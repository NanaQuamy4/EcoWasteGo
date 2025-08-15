-- SMS Verification Migration Script
-- This script adds SMS verification support to the existing email_verifications table
-- and creates new tables for comprehensive verification tracking

-- First, let's update the existing email_verifications table to support SMS
ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS verification_type VARCHAR(10) DEFAULT 'email' CHECK (verification_type IN ('email', 'sms'));
ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;
ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE;

-- Add index for better performance on phone lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_phone ON email_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_email_verifications_type ON email_verifications(verification_type);

-- Create a comprehensive verification tracking table
CREATE TABLE IF NOT EXISTS verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'recycler')),
  verification_type VARCHAR(10) NOT NULL CHECK (verification_type IN ('email', 'sms')),
  contact_info VARCHAR(255) NOT NULL, -- email or phone number
  verification_code VARCHAR(10) NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  is_successful BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_attempts_user_id ON verification_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_contact_info ON verification_attempts(contact_info);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_code ON verification_attempts(verification_code);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_expires_at ON verification_attempts(expires_at);

-- Add phone verification status to both customer and recycler tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE recyclers ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE recyclers ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Create function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired email verifications
  DELETE FROM email_verifications 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete expired verification attempts
  DELETE FROM verification_attempts 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to rate limit verification attempts
CREATE OR REPLACE FUNCTION check_verification_rate_limit(
  contact_info_param VARCHAR(255),
  verification_type_param VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
  recent_attempts INTEGER;
BEGIN
  -- Count attempts in the last hour
  SELECT COUNT(*) INTO recent_attempts
  FROM verification_attempts
  WHERE contact_info = contact_info_param
    AND verification_type = verification_type_param
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Allow max 5 attempts per hour
  RETURN recent_attempts < 5;
END;
$$ LANGUAGE plpgsql;

-- Insert initial data migration (update existing email verifications)
UPDATE email_verifications SET verification_type = 'email' WHERE verification_type IS NULL;

-- Add comments for documentation
COMMENT ON TABLE verification_attempts IS 'Comprehensive tracking of all verification attempts (email and SMS)';
COMMENT ON COLUMN verification_attempts.contact_info IS 'Email address or phone number being verified';
COMMENT ON COLUMN verification_attempts.attempt_count IS 'Number of times this verification code was attempted';
COMMENT ON COLUMN verification_attempts.ip_address IS 'IP address of the verification attempt for security tracking';

COMMENT ON FUNCTION cleanup_expired_verifications() IS 'Cleans up expired verification codes to maintain database performance';
COMMENT ON FUNCTION check_verification_rate_limit(VARCHAR, VARCHAR) IS 'Rate limiting function to prevent spam/abuse of verification system';

-- Grant necessary permissions (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON verification_attempts TO authenticated;
-- GRANT EXECUTE ON FUNCTION cleanup_expired_verifications() TO authenticated;
-- GRANT EXECUTE ON FUNCTION check_verification_rate_limit(VARCHAR, VARCHAR) TO authenticated;
