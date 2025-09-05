-- Fix quality adjustment rates to be more fair and realistic
-- Good quality should get a small premium, not huge multipliers

-- Update the pricing rates with more reasonable quality adjustments
UPDATE pricing_rates SET 
    quality_multiplier = 1.05,  -- 5% premium for excellent
    base_rate_per_kg = 1.20
WHERE quality_level = 'excellent' AND base_rate_per_kg = 1.20;

UPDATE pricing_rates SET 
    quality_multiplier = 1.00,  -- No adjustment for good (baseline)
    base_rate_per_kg = 1.20
WHERE quality_level = 'good' AND base_rate_per_kg = 1.20;

UPDATE pricing_rates SET 
    quality_multiplier = 0.95,  -- 5% discount for fair
    base_rate_per_kg = 1.20
WHERE quality_level = 'fair' AND base_rate_per_kg = 1.20;

UPDATE pricing_rates SET 
    quality_multiplier = 0.90,  -- 10% discount for poor
    base_rate_per_kg = 1.20
WHERE quality_level = 'poor' AND base_rate_per_kg = 1.20;

-- Update the function to use more reasonable default quality multipliers
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
    -- Get current pricing rate using table alias
    SELECT pr.base_rate_per_kg, pr.quality_multiplier, pr.environmental_tax_rate
    INTO rate_record
    FROM pricing_rates pr
    WHERE pr.waste_type = p_waste_type
    AND pr.quality_level = p_quality_level
    AND pr.is_active = true
    AND (pr.effective_until IS NULL OR pr.effective_until > NOW())
    ORDER BY pr.effective_from DESC
    LIMIT 1;
    
    -- If no specific rate found, get default rate for waste type
    IF rate_record IS NULL THEN
        SELECT pr.base_rate_per_kg, pr.quality_multiplier, pr.environmental_tax_rate
        INTO rate_record
        FROM pricing_rates pr
        WHERE pr.waste_type = p_waste_type
        AND pr.quality_level = 'good'
        AND pr.is_active = true
        AND (pr.effective_until IS NULL OR pr.effective_until > NOW())
        ORDER BY pr.effective_from DESC
        LIMIT 1;
    END IF;
    
    -- If still no rate found, use default rates with reasonable quality adjustments
    IF rate_record IS NULL THEN
        v_base_rate := 1.20;  -- GHS 1.20 per kg base rate
        
        -- More reasonable quality adjustments
        CASE p_quality_level
            WHEN 'excellent' THEN v_quality_multiplier := 1.05;  -- 5% premium
            WHEN 'good' THEN v_quality_multiplier := 1.00;       -- No adjustment (baseline)
            WHEN 'fair' THEN v_quality_multiplier := 0.95;       -- 5% discount
            WHEN 'poor' THEN v_quality_multiplier := 0.90;       -- 10% discount
            ELSE v_quality_multiplier := 1.00;
        END CASE;
        
        v_environmental_tax_rate := 0.05;  -- 5% environmental tax
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

-- Test the updated function with different quality levels
SELECT 
    'Excellent Quality' as test_case,
    calculate_collection_pricing('plastic', 'excellent', 5.0) as pricing
UNION ALL
SELECT 
    'Good Quality' as test_case,
    calculate_collection_pricing('plastic', 'good', 5.0) as pricing
UNION ALL
SELECT 
    'Fair Quality' as test_case,
    calculate_collection_pricing('plastic', 'fair', 5.0) as pricing
UNION ALL
SELECT 
    'Poor Quality' as test_case,
    calculate_collection_pricing('plastic', 'poor', 5.0) as pricing;

-- Show the updated pricing rates
SELECT 
    waste_type,
    quality_level,
    base_rate_per_kg,
    quality_multiplier,
    ROUND(base_rate_per_kg * quality_multiplier, 2) as effective_rate_per_kg
FROM pricing_rates 
WHERE is_active = true 
ORDER BY waste_type, quality_level;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Updated quality adjustment rates to be more fair!';
    RAISE NOTICE 'New quality adjustments:';
    RAISE NOTICE '  - Excellent: +5% premium (1.05x)';
    RAISE NOTICE '  - Good: No adjustment (1.00x) - baseline';
    RAISE NOTICE '  - Fair: -5% discount (0.95x)';
    RAISE NOTICE '  - Poor: -10% discount (0.90x)';
    RAISE NOTICE 'This is much more reasonable and fair for recyclers!';
END $$;
