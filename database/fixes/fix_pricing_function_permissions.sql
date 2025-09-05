-- Fix pricing function to not access users table
-- The function should only use pricing_rates table

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
    
    -- If still no rate found, use default rates
    IF rate_record IS NULL THEN
        v_base_rate := 1.20;  -- GHS 1.20 per kg base rate
        
        -- CORRECT quality adjustments: Excellent pays LESS, Poor pays MORE
        CASE p_quality_level
            WHEN 'excellent' THEN v_quality_multiplier := 0.90;  -- 10% discount (easier to process)
            WHEN 'good' THEN v_quality_multiplier := 1.00;       -- No adjustment (baseline)
            WHEN 'fair' THEN v_quality_multiplier := 1.10;       -- 10% premium (more processing)
            WHEN 'poor' THEN v_quality_multiplier := 1.20;       -- 20% premium (much more processing)
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

-- Test the function
SELECT calculate_collection_pricing('plastic', 'good', 5.0) as test_pricing;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed pricing function permissions!';
    RAISE NOTICE 'The function now only accesses pricing_rates table.';
    RAISE NOTICE 'Test with: SELECT calculate_collection_pricing(''plastic'', ''good'', 5.0);';
END $$;
