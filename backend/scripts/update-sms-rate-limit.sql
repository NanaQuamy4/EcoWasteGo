-- Update SMS rate limit from 5 to 9000 attempts per hour
-- This script modifies the existing check_verification_rate_limit function

-- Drop the existing function
DROP FUNCTION IF EXISTS check_verification_rate_limit(VARCHAR, VARCHAR);

-- Recreate the function with the new rate limit
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
  
  -- Allow max 9000 attempts per hour (increased from 5)
  RETURN recent_attempts < 9000;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION check_verification_rate_limit(VARCHAR, VARCHAR) IS 'Rate limiting function to prevent spam/abuse of verification system - allows 9000 attempts per hour';

-- Grant necessary permissions (adjust based on your setup)
-- GRANT EXECUTE ON FUNCTION check_verification_rate_limit(VARCHAR, VARCHAR) TO authenticated;

-- Verify the function was updated
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'check_verification_rate_limit';
