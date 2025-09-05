-- Create waste collection and pricing tables for weight entry system
-- Run this SQL in your Supabase SQL editor

-- 1. Create waste_collection_details table for tracking actual collection data
CREATE TABLE IF NOT EXISTS waste_collection_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pickup_request_id UUID REFERENCES pickup_requests(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES recyclers(id) ON DELETE CASCADE,
    
    -- Weight and measurement details
    actual_weight DECIMAL(8,2) NOT NULL CHECK (actual_weight > 0), -- in kg
    weight_unit VARCHAR(10) DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs', 'g')),
    
    -- Waste type and quality
    waste_type VARCHAR(50) NOT NULL CHECK (waste_type IN ('plastic', 'paper', 'metal', 'glass', 'organic', 'electronic', 'general')),
    waste_quality VARCHAR(20) DEFAULT 'good' CHECK (waste_quality IN ('excellent', 'good', 'fair', 'poor')),
    contamination_level DECIMAL(3,2) DEFAULT 0.0 CHECK (contamination_level >= 0 AND contamination_level <= 1), -- 0-100%
    
    -- Collection details
    collection_method VARCHAR(30) DEFAULT 'manual' CHECK (collection_method IN ('manual', 'automated', 'mixed')),
    collection_notes TEXT,
    collection_photos TEXT[], -- Array of photo URLs
    
    -- Pricing details
    base_rate DECIMAL(8,2) NOT NULL, -- Rate per kg
    quality_multiplier DECIMAL(3,2) DEFAULT 1.0, -- Quality adjustment factor
    contamination_deduction DECIMAL(8,2) DEFAULT 0.0, -- Deduction for contamination
    subtotal DECIMAL(8,2) NOT NULL, -- Weight * base_rate * quality_multiplier
    environmental_tax DECIMAL(8,2) DEFAULT 0.0, -- Environmental tax amount
    total_amount DECIMAL(8,2) NOT NULL, -- Final amount to be paid
    
    -- Verification
    verified_by UUID REFERENCES auth.users(id), -- Admin who verified the collection
    verification_notes TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    
    -- Metadata
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_weight CHECK (actual_weight > 0 AND actual_weight <= 1000), -- Max 1000kg
    CONSTRAINT valid_quality_multiplier CHECK (quality_multiplier >= 0.1 AND quality_multiplier <= 2.0),
    CONSTRAINT valid_amounts CHECK (subtotal >= 0 AND total_amount >= 0)
);

-- 2. Create pricing_rates table for different waste types and quality levels
CREATE TABLE IF NOT EXISTS pricing_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Waste type and quality
    waste_type VARCHAR(50) NOT NULL CHECK (waste_type IN ('plastic', 'paper', 'metal', 'glass', 'organic', 'electronic', 'general')),
    quality_level VARCHAR(20) NOT NULL CHECK (quality_level IN ('excellent', 'good', 'fair', 'poor')),
    
    -- Pricing
    base_rate_per_kg DECIMAL(8,2) NOT NULL CHECK (base_rate_per_kg > 0),
    quality_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (quality_multiplier > 0),
    environmental_tax_rate DECIMAL(5,4) DEFAULT 0.05 CHECK (environmental_tax_rate >= 0 AND environmental_tax_rate <= 1), -- 5% default
    
    -- Validity period
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_waste_quality_active UNIQUE (waste_type, quality_level, is_active) 
    DEFERRABLE INITIALLY DEFERRED
);

-- 3. Create collection_photos table for storing collection evidence
CREATE TABLE IF NOT EXISTS collection_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_detail_id UUID REFERENCES waste_collection_details(id) ON DELETE CASCADE,
    
    -- Photo details
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(20) DEFAULT 'collection' CHECK (photo_type IN ('collection', 'before', 'after', 'verification')),
    photo_description TEXT,
    
    -- Metadata
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_photo_url CHECK (photo_url ~ '^https?://')
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waste_collection_pickup_request ON waste_collection_details(pickup_request_id);
CREATE INDEX IF NOT EXISTS idx_waste_collection_recycler ON waste_collection_details(recycler_id);
CREATE INDEX IF NOT EXISTS idx_waste_collection_collected_at ON waste_collection_details(collected_at);
CREATE INDEX IF NOT EXISTS idx_waste_collection_verification ON waste_collection_details(verification_status);

CREATE INDEX IF NOT EXISTS idx_pricing_rates_waste_type ON pricing_rates(waste_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rates_active ON pricing_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rates_effective ON pricing_rates(effective_from, effective_until);

CREATE INDEX IF NOT EXISTS idx_collection_photos_collection ON collection_photos(collection_detail_id);
CREATE INDEX IF NOT EXISTS idx_collection_photos_type ON collection_photos(photo_type);

-- 5. Enable Row Level Security
ALTER TABLE waste_collection_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_photos ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for waste_collection_details
-- Recyclers can view their own collections
CREATE POLICY "Recyclers can view own collections" ON waste_collection_details
    FOR SELECT USING (recycler_id = auth.uid());

-- Recyclers can create collections for their assigned requests
CREATE POLICY "Recyclers can create collections" ON waste_collection_details
    FOR INSERT WITH CHECK (
        recycler_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM pickup_requests 
            WHERE id = pickup_request_id 
            AND recycler_id = auth.uid()
        )
    );

-- Recyclers can update their own pending collections
CREATE POLICY "Recyclers can update own collections" ON waste_collection_details
    FOR UPDATE USING (
        recycler_id = auth.uid() AND
        verification_status = 'pending'
    );

-- Customers can view collections for their requests
CREATE POLICY "Customers can view their collections" ON waste_collection_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pickup_requests 
            WHERE id = pickup_request_id 
            AND customer_id = auth.uid()
        )
    );

-- 7. Create RLS policies for pricing_rates
-- Everyone can view active pricing rates
CREATE POLICY "Everyone can view active pricing rates" ON pricing_rates
    FOR SELECT USING (is_active = true);

-- Only admins can manage pricing rates
CREATE POLICY "Admins can manage pricing rates" ON pricing_rates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 8. Create RLS policies for collection_photos
-- Users can view photos for their collections
CREATE POLICY "Users can view collection photos" ON collection_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM waste_collection_details wcd
            JOIN pickup_requests pr ON wcd.pickup_request_id = pr.id
            WHERE wcd.id = collection_photos.collection_detail_id
            AND (wcd.recycler_id = auth.uid() OR pr.customer_id = auth.uid())
        )
    );

-- Recyclers can upload photos for their collections
CREATE POLICY "Recyclers can upload collection photos" ON collection_photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM waste_collection_details 
            WHERE id = collection_detail_id 
            AND recycler_id = auth.uid()
        )
    );

-- 9. Create function to calculate collection pricing
CREATE OR REPLACE FUNCTION calculate_collection_pricing(
    p_waste_type VARCHAR(50),
    p_quality_level VARCHAR(20),
    p_weight DECIMAL(8,2)
)
RETURNS JSON AS $$
DECLARE
    rate_record RECORD;
    base_rate DECIMAL(8,2);
    quality_multiplier DECIMAL(3,2);
    environmental_tax_rate DECIMAL(5,4);
    subtotal DECIMAL(8,2);
    environmental_tax DECIMAL(8,2);
    total_amount DECIMAL(8,2);
BEGIN
    -- Get current pricing rate
    SELECT base_rate_per_kg, quality_multiplier, environmental_tax_rate
    INTO rate_record
    FROM pricing_rates
    WHERE waste_type = p_waste_type
    AND quality_level = p_quality_level
    AND is_active = true
    AND (effective_until IS NULL OR effective_until > NOW())
    ORDER BY effective_from DESC
    LIMIT 1;
    
    -- If no specific rate found, get default rate for waste type
    IF rate_record IS NULL THEN
        SELECT base_rate_per_kg, quality_multiplier, environmental_tax_rate
        INTO rate_record
        FROM pricing_rates
        WHERE waste_type = p_waste_type
        AND quality_level = 'good' -- Default to 'good' quality
        AND is_active = true
        AND (effective_until IS NULL OR effective_until > NOW())
        ORDER BY effective_from DESC
        LIMIT 1;
    END IF;
    
    -- If still no rate found, use default rates
    IF rate_record IS NULL THEN
        base_rate := 1.20; -- Default rate
        quality_multiplier := 1.0;
        environmental_tax_rate := 0.05; -- 5%
    ELSE
        base_rate := rate_record.base_rate_per_kg;
        quality_multiplier := rate_record.quality_multiplier;
        environmental_tax_rate := rate_record.environmental_tax_rate;
    END IF;
    
    -- Calculate amounts
    subtotal := p_weight * base_rate * quality_multiplier;
    environmental_tax := subtotal * environmental_tax_rate;
    total_amount := subtotal + environmental_tax;
    
    RETURN json_build_object(
        'base_rate', base_rate,
        'quality_multiplier', quality_multiplier,
        'environmental_tax_rate', environmental_tax_rate,
        'subtotal', ROUND(subtotal, 2),
        'environmental_tax', ROUND(environmental_tax, 2),
        'total_amount', ROUND(total_amount, 2)
    );
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to create collection detail
CREATE OR REPLACE FUNCTION create_waste_collection(
    p_pickup_request_id UUID,
    p_recycler_id UUID,
    p_actual_weight DECIMAL(8,2),
    p_waste_type VARCHAR(50),
    p_waste_quality VARCHAR(20) DEFAULT 'good',
    p_contamination_level DECIMAL(3,2) DEFAULT 0.0,
    p_collection_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    collection_id UUID;
    pricing_data JSON;
    base_rate DECIMAL(8,2);
    quality_multiplier DECIMAL(3,2);
    environmental_tax_rate DECIMAL(5,4);
    subtotal DECIMAL(8,2);
    environmental_tax DECIMAL(8,2);
    total_amount DECIMAL(8,2);
BEGIN
    -- Calculate pricing
    SELECT calculate_collection_pricing(p_waste_type, p_waste_quality, p_actual_weight)
    INTO pricing_data;
    
    base_rate := (pricing_data->>'base_rate')::DECIMAL;
    quality_multiplier := (pricing_data->>'quality_multiplier')::DECIMAL;
    environmental_tax_rate := (pricing_data->>'environmental_tax_rate')::DECIMAL;
    subtotal := (pricing_data->>'subtotal')::DECIMAL;
    environmental_tax := (pricing_data->>'environmental_tax')::DECIMAL;
    total_amount := (pricing_data->>'total_amount')::DECIMAL;
    
    -- Create collection detail
    INSERT INTO waste_collection_details (
        pickup_request_id,
        recycler_id,
        actual_weight,
        waste_type,
        waste_quality,
        contamination_level,
        base_rate,
        quality_multiplier,
        contamination_deduction,
        subtotal,
        environmental_tax,
        total_amount,
        collection_notes
    ) VALUES (
        p_pickup_request_id,
        p_recycler_id,
        p_actual_weight,
        p_waste_type,
        p_waste_quality,
        p_contamination_level,
        base_rate,
        quality_multiplier,
        0.0, -- contamination_deduction (can be calculated later)
        subtotal,
        environmental_tax,
        total_amount,
        p_collection_notes
    ) RETURNING id INTO collection_id;
    
    -- Update pickup request status to completed
    UPDATE pickup_requests 
    SET 
        status = 'completed',
        final_price = total_amount,
        payment_status = 'pending',
        pickup_completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_pickup_request_id;
    
    RETURN collection_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_waste_collection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_waste_collection_details_updated_at
    BEFORE UPDATE ON waste_collection_details
    FOR EACH ROW
    EXECUTE FUNCTION update_waste_collection_updated_at();

CREATE TRIGGER update_pricing_rates_updated_at
    BEFORE UPDATE ON pricing_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_waste_collection_updated_at();

-- 12. Insert default pricing rates
INSERT INTO pricing_rates (waste_type, quality_level, base_rate_per_kg, quality_multiplier, environmental_tax_rate) VALUES
-- Plastic rates
('plastic', 'excellent', 2.50, 1.2, 0.05),
('plastic', 'good', 2.00, 1.0, 0.05),
('plastic', 'fair', 1.50, 0.8, 0.05),
('plastic', 'poor', 1.00, 0.6, 0.05),

-- Paper rates
('paper', 'excellent', 1.80, 1.2, 0.05),
('paper', 'good', 1.50, 1.0, 0.05),
('paper', 'fair', 1.20, 0.8, 0.05),
('paper', 'poor', 0.80, 0.6, 0.05),

-- Metal rates
('metal', 'excellent', 3.00, 1.2, 0.05),
('metal', 'good', 2.50, 1.0, 0.05),
('metal', 'fair', 2.00, 0.8, 0.05),
('metal', 'poor', 1.50, 0.6, 0.05),

-- Glass rates
('glass', 'excellent', 1.20, 1.2, 0.05),
('glass', 'good', 1.00, 1.0, 0.05),
('glass', 'fair', 0.80, 0.8, 0.05),
('glass', 'poor', 0.60, 0.6, 0.05),

-- Electronic rates
('electronic', 'excellent', 5.00, 1.2, 0.05),
('electronic', 'good', 4.00, 1.0, 0.05),
('electronic', 'fair', 3.00, 0.8, 0.05),
('electronic', 'poor', 2.00, 0.6, 0.05),

-- Organic rates
('organic', 'excellent', 0.80, 1.2, 0.05),
('organic', 'good', 0.60, 1.0, 0.05),
('organic', 'fair', 0.40, 0.8, 0.05),
('organic', 'poor', 0.20, 0.6, 0.05),

-- General waste rates
('general', 'excellent', 1.20, 1.2, 0.05),
('general', 'good', 1.00, 1.0, 0.05),
('general', 'fair', 0.80, 0.8, 0.05),
('general', 'poor', 0.60, 0.6, 0.05);

-- 13. Grant permissions
GRANT ALL ON waste_collection_details TO authenticated;
GRANT ALL ON pricing_rates TO authenticated;
GRANT ALL ON collection_photos TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_collection_pricing(VARCHAR, VARCHAR, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION create_waste_collection(UUID, UUID, DECIMAL, VARCHAR, VARCHAR, DECIMAL, TEXT) TO authenticated;

-- 14. Create view for collection summary
CREATE OR REPLACE VIEW collection_summary AS
SELECT 
    wcd.id,
    wcd.pickup_request_id,
    wcd.recycler_id,
    wcd.actual_weight,
    wcd.waste_type,
    wcd.waste_quality,
    wcd.subtotal,
    wcd.environmental_tax,
    wcd.total_amount,
    wcd.verification_status,
    wcd.collected_at,
    pr.customer_id,
    pr.pickup_address,
    r.full_name as recycler_name,
    cu.email as customer_email
FROM waste_collection_details wcd
JOIN pickup_requests pr ON wcd.pickup_request_id = pr.id
LEFT JOIN recyclers r ON wcd.recycler_id = r.id
LEFT JOIN auth.users cu ON pr.customer_id = cu.id;

-- Grant permissions on view
GRANT SELECT ON collection_summary TO authenticated;

COMMENT ON TABLE waste_collection_details IS 'Table for tracking actual waste collection details and pricing';
COMMENT ON TABLE pricing_rates IS 'Table for managing pricing rates for different waste types and quality levels';
COMMENT ON TABLE collection_photos IS 'Table for storing collection evidence photos';
COMMENT ON FUNCTION calculate_collection_pricing(VARCHAR, VARCHAR, DECIMAL) IS 'Calculate pricing for waste collection based on type, quality, and weight';
COMMENT ON FUNCTION create_waste_collection(UUID, UUID, DECIMAL, VARCHAR, VARCHAR, DECIMAL, TEXT) IS 'Create a new waste collection record with automatic pricing calculation';
