-- EcoWasteGo Role-Based Database Schema Update
-- Copy and paste this entire script into your Supabase SQL Editor

-- Update users table to support roles
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add recycler-specific fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS passport_photo_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_document_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS areas_of_operation TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_resources TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);

-- Update existing users to have default role
UPDATE users SET role = 'customer' WHERE role IS NULL;

-- Add constraints
ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('customer', 'recycler'));
ALTER TABLE users ADD CONSTRAINT check_status CHECK (status IN ('active', 'inactive', 'suspended'));
ALTER TABLE users ADD CONSTRAINT check_verification_status CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- Create view for verified recyclers
CREATE OR REPLACE VIEW verified_recyclers AS
SELECT 
    id,
    email,
    company_name,
    business_location,
    areas_of_operation,
    available_resources,
    created_at,
    updated_at
FROM users 
WHERE role = 'recycler' 
AND verification_status = 'verified' 
AND status = 'active';

-- Create view for pending recyclers
CREATE OR REPLACE VIEW pending_recyclers AS
SELECT 
    id,
    email,
    company_name,
    business_location,
    areas_of_operation,
    available_resources,
    created_at,
    updated_at
FROM users 
WHERE role = 'recycler' 
AND verification_status IN ('unverified', 'pending')
AND status = 'active'; 