-- Complete fix for pricing function - remove all users table references
-- Drop and recreate the function completely

-- First, drop the existing function
DROP FUNCTION IF EXISTS calculate_collection_pricing(VARCHAR, VARCHAR, DECIMAL);

-- Create a completely new function with no users table access
CREATE FUNCTION calculate_collection_pricing(
    p_waste_type VARCHAR(50),
    p_quality_level VARCHAR(20),
    p_weight DECIMAL(8,2)
)
RETURNS JSON AS $$
DECLARE
    v_base_rate DECIMAL(8,2);
    v_quality_multiplier DECIMAL(3,2);
    v_environmental_tax_rate DECIMAL(5,4);
    v_subtotal DECIMAL(8,2);
    v_environmental_tax DECIMAL(8,2);
    v_total_amount DECIMAL(8,2);
BEGIN
    -- Set default values first
    v_base_rate := 1.20;  -- GHS 1.20 per kg base rate
    v_environmental_tax_rate := 0.05;  -- 5% environmental tax
    
    -- Set quality multiplier based on quality level
    CASE p_quality_level
        WHEN 'excellent' THEN v_quality_multiplier := 0.90;  -- 10% discount (easier to process)
        WHEN 'good' THEN v_quality_multiplier := 1.00;       -- No adjustment (baseline)
        WHEN 'fair' THEN v_quality_multiplier := 1.10;       -- 10% premium (more processing)
        WHEN 'poor' THEN v_quality_multiplier := 1.20;       -- 20% premium (much more processing)
        ELSE v_quality_multiplier := 1.00;
    END CASE;
    
    -- Try to get rate from pricing_rates table (if it exists and has data)
    BEGIN
        SELECT pr.base_rate_per_kg, pr.quality_multiplier, pr.environmental_tax_rate
        INTO v_base_rate, v_quality_multiplier, v_environmental_tax_rate
        FROM pricing_rates pr
        WHERE pr.waste_type = p_waste_type
        AND pr.quality_level = p_quality_level
        AND pr.is_active = true
        LIMIT 1;
        
        -- If no specific rate found, try to get default rate for waste type
        IF v_base_rate IS NULL THEN
            SELECT pr.base_rate_per_kg, pr.quality_multiplier, pr.environmental_tax_rate
            INTO v_base_rate, v_quality_multiplier, v_environmental_tax_rate
            FROM pricing_rates pr
            WHERE pr.waste_type = p_waste_type
            AND pr.quality_level = 'good'
            AND pr.is_active = true
            LIMIT 1;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- If pricing_rates table doesn't exist or has issues, use defaults
            v_base_rate := 1.20;
            v_environmental_tax_rate := 0.05;
            -- Keep the quality_multiplier that was set above
    END;
    
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_collection_pricing(VARCHAR, VARCHAR, DECIMAL) TO authenticated;

-- Test the function
SELECT calculate_collection_pricing('plastic', 'good', 5.0) as test_pricing;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ COMPLETE FIX: Pricing function recreated without users table access!';
    RAISE NOTICE 'Function now uses only default values and pricing_rates table.';
    RAISE NOTICE 'Test result should show: base_rate: 1.20, quality_multiplier: 1.00, total_amount: 6.30';
END $$;
