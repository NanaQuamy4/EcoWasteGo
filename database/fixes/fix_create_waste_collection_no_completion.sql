-- Fix create_waste_collection function to NOT mark process as complete
-- It should only save collection data and keep status as 'in_progress'

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
    current_status TEXT;
BEGIN
    -- Get current status of pickup request
    SELECT status INTO current_status
    FROM pickup_requests
    WHERE id = p_pickup_request_id;

    -- Check if request exists and is in valid state
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Pickup request not found: %', p_pickup_request_id;
    END IF;

    -- Only allow if status is 'in_progress' or 'arrived'
    IF current_status NOT IN ('in_progress', 'arrived') THEN
        RAISE EXCEPTION 'Invalid status for weight entry: %. Must be in_progress or arrived.', current_status;
    END IF;

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
        0.0,
        subtotal,
        environmental_tax,
        total_amount,
        p_collection_notes
    ) RETURNING id INTO collection_id;
    
    -- Update pickup request with pricing info but KEEP STATUS AS IS
    UPDATE pickup_requests
    SET
        final_price = total_amount,
        payment_status = 'pending'
        -- DO NOT change status - keep it as 'in_progress' or 'arrived'
    WHERE id = p_pickup_request_id;
    
    RETURN collection_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_waste_collection(UUID, UUID, DECIMAL, VARCHAR, VARCHAR, DECIMAL, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_waste_collection(UUID, UUID, DECIMAL, VARCHAR, VARCHAR, DECIMAL, TEXT) IS 'Create a new waste collection record with automatic pricing calculation. Does NOT mark process as complete - keeps status as in_progress or arrived.';
