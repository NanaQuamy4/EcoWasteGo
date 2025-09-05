-- Fix ambiguous column references in calculate_collection_pricing function
-- The issue is that variable names conflict with column names

CREATE OR REPLACE FUNCTION calculate_collection_pricing(
    p_waste_type VARCHAR(50),
    p_quality_level VARCHAR(20),
    p_weight DECIMAL(8,2)
)
RETURNS JSON AS $$
DECLARE
    rate_record RECORD;
    v_base_rate DECIMAL(8,2);
    v_quality_multiplier DECIMAL(3,2);
    v_environmental_tax_rate DECIMAL(5,4);
    v_subtotal DECIMAL(8,2);
    v_environmental_tax DECIMAL(8,2);
    v_total_amount DECIMAL(8,2);
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
        AND quality_level = 'good'
        AND is_active = true
        AND (effective_until IS NULL OR effective_until > NOW())
        ORDER BY effective_from DESC
        LIMIT 1;
    END IF;
    
    -- If still no rate found, use default rates
    IF rate_record IS NULL THEN
        v_base_rate := 1.20;
        v_quality_multiplier := 1.0;
        v_environmental_tax_rate := 0.05;
    ELSE
        v_base_rate := rate_record.base_rate_per_kg;
        v_quality_multiplier := rate_record.quality_multiplier;
        v_environmental_tax_rate := rate_record.environmental_tax_rate;
    END IF;
    
    -- Calculate amounts
    v_subtotal := p_weight * v_base_rate * v_quality_multiplier;
    v_environmental_tax := v_subtotal * v_environmental_tax_rate;
    v_total_amount := v_subtotal + v_environmental_tax;
    
    RETURN json_build_object(
        'base_rate', v_base_rate,
        'quality_multiplier', v_quality_multiplier,
        'environmental_tax_rate', v_environmental_tax_rate,
        'subtotal', ROUND(v_subtotal, 2),
        'environmental_tax', ROUND(v_environmental_tax, 2),
        'total_amount', ROUND(v_total_amount, 2)
    );
END;
$$ LANGUAGE plpgsql;

-- Also fix the create_waste_collection function to use the corrected pricing function
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
    v_base_rate DECIMAL(8,2);
    v_quality_multiplier DECIMAL(3,2);
    v_environmental_tax_rate DECIMAL(5,4);
    v_subtotal DECIMAL(8,2);
    v_environmental_tax DECIMAL(8,2);
    v_total_amount DECIMAL(8,2);
BEGIN
    -- Calculate pricing
    SELECT calculate_collection_pricing(p_waste_type, p_waste_quality, p_actual_weight)
    INTO pricing_data;
    
    v_base_rate := (pricing_data->>'base_rate')::DECIMAL;
    v_quality_multiplier := (pricing_data->>'quality_multiplier')::DECIMAL;
    v_environmental_tax_rate := (pricing_data->>'environmental_tax_rate')::DECIMAL;
    v_subtotal := (pricing_data->>'subtotal')::DECIMAL;
    v_environmental_tax := (pricing_data->>'environmental_tax')::DECIMAL;
    v_total_amount := (pricing_data->>'total_amount')::DECIMAL;
    
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
        v_base_rate,
        v_quality_multiplier,
        0.0,
        v_subtotal,
        v_environmental_tax,
        v_total_amount,
        p_collection_notes
    ) RETURNING id INTO collection_id;
    
    -- Update pickup request status to completed
    UPDATE pickup_requests 
    SET 
        status = 'completed',
        final_price = v_total_amount,
        payment_status = 'pending',
        pickup_completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_pickup_request_id;
    
    RETURN collection_id;
END;
$$ LANGUAGE plpgsql;

-- Test the fixed function
SELECT calculate_collection_pricing('plastic', 'good', 5.0) as test_pricing;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Fixed ambiguous column references in pricing functions!';
    RAISE NOTICE 'The calculate_collection_pricing function should now work correctly.';
END $$;
