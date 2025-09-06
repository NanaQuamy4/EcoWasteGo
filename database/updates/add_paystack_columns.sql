-- Add Paystack payment tracking columns to subscription_fees table
-- This script enhances the subscription_fees table to support Paystack payment integration

-- Add payment gateway column
ALTER TABLE subscription_fees 
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(20) DEFAULT 'paystack';

-- Add transaction ID column for Paystack reference
ALTER TABLE subscription_fees 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);

-- Add payment status column
ALTER TABLE subscription_fees 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Add failure reason column for failed payments
ALTER TABLE subscription_fees 
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add gateway response column to store Paystack response data
ALTER TABLE subscription_fees 
ADD COLUMN IF NOT EXISTS gateway_response JSONB;

-- Add webhook verification column
ALTER TABLE subscription_fees 
ADD COLUMN IF NOT EXISTS webhook_verified BOOLEAN DEFAULT FALSE;

-- Add payment method column
ALTER TABLE subscription_fees 
ADD COLUMN IF NOT EXISTS payment_method_used VARCHAR(50);

-- Add authorization URL column for Paystack
ALTER TABLE subscription_fees 
ADD COLUMN IF NOT EXISTS authorization_url TEXT;

-- Add access code column for Paystack
ALTER TABLE subscription_fees 
ADD COLUMN IF NOT EXISTS access_code VARCHAR(100);

-- Create index on transaction_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_fees_transaction_id 
ON subscription_fees(transaction_id);

-- Create index on payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_subscription_fees_payment_status 
ON subscription_fees(payment_status);

-- Create index on payment_gateway for filtering
CREATE INDEX IF NOT EXISTS idx_subscription_fees_payment_gateway 
ON subscription_fees(payment_gateway);

-- Add comments to columns for documentation
COMMENT ON COLUMN subscription_fees.payment_gateway IS 'Payment gateway used (paystack, stripe, etc.)';
COMMENT ON COLUMN subscription_fees.transaction_id IS 'Paystack transaction reference ID';
COMMENT ON COLUMN subscription_fees.payment_status IS 'Payment status: pending, success, failed, cancelled';
COMMENT ON COLUMN subscription_fees.failure_reason IS 'Reason for payment failure if applicable';
COMMENT ON COLUMN subscription_fees.gateway_response IS 'Raw response from payment gateway';
COMMENT ON COLUMN subscription_fees.webhook_verified IS 'Whether payment was verified via webhook';
COMMENT ON COLUMN subscription_fees.payment_method_used IS 'Payment method selected (mobile_money, card, bank_transfer)';
COMMENT ON COLUMN subscription_fees.authorization_url IS 'Paystack authorization URL for payment';
COMMENT ON COLUMN subscription_fees.access_code IS 'Paystack access code for payment';

-- Update the mark_subscription_fee_paid function to handle Paystack data
CREATE OR REPLACE FUNCTION mark_subscription_fee_paid(
    p_fee_id UUID,
    p_payment_method VARCHAR(50),
    p_payment_reference VARCHAR(100),
    p_transaction_id VARCHAR(100) DEFAULT NULL,
    p_payment_gateway VARCHAR(20) DEFAULT 'paystack',
    p_gateway_response JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE subscription_fees 
    SET 
        payment_method = p_payment_method,
        payment_reference = p_payment_reference,
        transaction_id = p_transaction_id,
        payment_gateway = p_payment_gateway,
        gateway_response = p_gateway_response,
        payment_status = 'success',
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = p_fee_id;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update payment status
CREATE OR REPLACE FUNCTION update_subscription_payment_status(
    p_fee_id UUID,
    p_payment_status VARCHAR(20),
    p_transaction_id VARCHAR(100) DEFAULT NULL,
    p_gateway_response JSONB DEFAULT NULL,
    p_failure_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE subscription_fees 
    SET 
        payment_status = p_payment_status,
        transaction_id = COALESCE(p_transaction_id, transaction_id),
        gateway_response = COALESCE(p_gateway_response, gateway_response),
        failure_reason = COALESCE(p_failure_reason, failure_reason),
        updated_at = NOW()
    WHERE id = p_fee_id;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get payment details by transaction ID
CREATE OR REPLACE FUNCTION get_subscription_fee_by_transaction_id(
    p_transaction_id VARCHAR(100)
) RETURNS TABLE (
    id UUID,
    recycler_id UUID,
    week_start_date DATE,
    week_end_date DATE,
    amount DECIMAL(10,2),
    payment_status VARCHAR(20),
    payment_gateway VARCHAR(20),
    transaction_id VARCHAR(100),
    payment_method_used VARCHAR(50),
    gateway_response JSONB,
    webhook_verified BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sf.id,
        sf.recycler_id,
        sf.week_start_date,
        sf.week_end_date,
        sf.amount,
        sf.payment_status,
        sf.payment_gateway,
        sf.transaction_id,
        sf.payment_method_used,
        sf.gateway_response,
        sf.webhook_verified,
        sf.created_at,
        sf.updated_at
    FROM subscription_fees sf
    WHERE sf.transaction_id = p_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION mark_subscription_fee_paid(UUID, VARCHAR(50), VARCHAR(100), VARCHAR(100), VARCHAR(20), JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_subscription_payment_status(UUID, VARCHAR(20), VARCHAR(100), JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_fee_by_transaction_id(VARCHAR(100)) TO authenticated;

-- Grant permissions to anon users (for webhook calls)
GRANT EXECUTE ON FUNCTION mark_subscription_fee_paid(UUID, VARCHAR(50), VARCHAR(100), VARCHAR(100), VARCHAR(20), JSONB) TO anon;
GRANT EXECUTE ON FUNCTION update_subscription_payment_status(UUID, VARCHAR(20), VARCHAR(100), JSONB, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_subscription_fee_by_transaction_id(VARCHAR(100)) TO anon;

-- Insert a sample subscription fee for testing (remove in production)
-- INSERT INTO subscription_fees (
--     recycler_id,
--     week_start_date,
--     week_end_date,
--     amount,
--     payment_status,
--     payment_gateway
-- ) VALUES (
--     (SELECT id FROM recyclers LIMIT 1),
--     CURRENT_DATE - INTERVAL '7 days',
--     CURRENT_DATE - INTERVAL '1 day',
--     25.50,
--     'pending',
--     'paystack'
-- ) ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Paystack payment tracking columns added successfully!' as message;
