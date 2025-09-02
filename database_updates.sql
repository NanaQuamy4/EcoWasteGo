-- Enhanced Verification System Database Updates
-- Run these SQL commands in your Supabase SQL editor

-- 1. Add admin verification columns to recyclers table
ALTER TABLE recyclers 
ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired')),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS verification_request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_verification_check TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Add verification history table for audit trail
CREATE TABLE IF NOT EXISTS verification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recycler_id UUID REFERENCES recyclers(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('requested', 'approved', 'rejected', 'expired', 'renewed')),
    status_before VARCHAR(20),
    status_after VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add admin roles table
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'verifier')),
    permissions JSONB DEFAULT '{"can_verify_recyclers": true, "can_view_reports": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recyclers_verification_status ON recyclers(verification_status);
CREATE INDEX IF NOT EXISTS idx_recyclers_admin_verified ON recyclers(admin_verified);
CREATE INDEX IF NOT EXISTS idx_verification_history_recycler_id ON verification_history(recycler_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_created_at ON verification_history(created_at);

-- 5. Update existing RLS policies for new columns
-- Drop existing policies first
DROP POLICY IF EXISTS "Recyclers can view own profile" ON recyclers;
DROP POLICY IF EXISTS "Recyclers can update own profile" ON recyclers;

-- Create new policies with verification columns
CREATE POLICY "Recyclers can view own profile" ON recyclers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Recyclers can update own profile" ON recyclers
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- Prevent recyclers from updating admin verification fields
        admin_verified IS NOT DISTINCT FROM (SELECT admin_verified FROM recyclers WHERE id = auth.uid()) AND
        admin_verification_date IS NOT DISTINCT FROM (SELECT admin_verification_date FROM recyclers WHERE id = auth.uid()) AND
        admin_verified_by IS NOT DISTINCT FROM (SELECT admin_verified_by FROM recyclers WHERE id = auth.uid()) AND
        verification_status IS NOT DISTINCT FROM (SELECT verification_status FROM recyclers WHERE id = auth.uid()) AND
        admin_notes IS NOT DISTINCT FROM (SELECT admin_notes FROM recyclers WHERE id = auth.uid())
    );

-- 6. Admin policies for verification management
CREATE POLICY "Admins can view all recyclers" ON recyclers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'verifier')
        )
    );

CREATE POLICY "Admins can update verification status" ON recyclers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'verifier')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'verifier')
        )
    );

-- 7. Verification history policies
CREATE POLICY "Recyclers can view own verification history" ON verification_history
    FOR SELECT USING (
        recycler_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'verifier')
        )
    );

CREATE POLICY "Admins can insert verification history" ON verification_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'verifier')
        )
    );

-- 8. Admin roles policies
CREATE POLICY "Admins can view admin roles" ON admin_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 9. Function to automatically update verification status based on expiration
CREATE OR REPLACE FUNCTION check_verification_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if verification has expired
    IF NEW.verification_expires_at IS NOT NULL AND NEW.verification_expires_at < NOW() THEN
        NEW.verification_status = 'expired';
        NEW.admin_verified = FALSE;
        
        -- Insert into verification history
        INSERT INTO verification_history (recycler_id, action, status_before, status_after, notes)
        VALUES (NEW.id, 'expired', OLD.verification_status, 'expired', 'Verification expired automatically');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger to check expiration on update
CREATE TRIGGER check_verification_expiration_trigger
    BEFORE UPDATE ON recyclers
    FOR EACH ROW
    EXECUTE FUNCTION check_verification_expiration();

-- 11. Function to get verification status with expiration info
CREATE OR REPLACE FUNCTION get_verification_status(recycler_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'is_verified', admin_verified,
        'verification_status', verification_status,
        'verification_expires_at', verification_expires_at,
        'days_until_expiration', 
            CASE 
                WHEN verification_expires_at IS NOT NULL 
                THEN EXTRACT(DAY FROM (verification_expires_at - NOW()))
                ELSE NULL
            END,
        'is_expired', 
            CASE 
                WHEN verification_expires_at IS NOT NULL AND verification_expires_at < NOW()
                THEN TRUE
                ELSE FALSE
            END,
        'admin_verification_date', admin_verification_date,
        'verification_request_date', verification_request_date
    ) INTO result
    FROM recyclers
    WHERE id = recycler_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 12. Insert default admin user (replace with actual admin user ID)
-- INSERT INTO admin_roles (user_id, role, permissions) 
-- VALUES ('your-admin-user-id-here', 'super_admin', '{"can_verify_recyclers": true, "can_view_reports": true, "can_manage_admins": true}');

-- 13. Update existing recyclers to have pending status
UPDATE recyclers 
SET verification_status = 'pending', 
    verification_request_date = COALESCE(verification_request_date, NOW())
WHERE verification_status IS NULL;

-- 14. Create view for admin dashboard
CREATE OR REPLACE VIEW admin_verification_dashboard AS
SELECT 
    r.id,
    r.full_name,
    r.company_name,
    r.email,
    r.phone,
    r.verification_status,
    r.admin_verified,
    r.verification_request_date,
    r.verification_expires_at,
    r.admin_notes,
    CASE 
        WHEN r.verification_expires_at IS NOT NULL AND r.verification_expires_at < NOW()
        THEN 'expired'
        WHEN r.verification_expires_at IS NOT NULL AND r.verification_expires_at < (NOW() + INTERVAL '30 days')
        THEN 'expiring_soon'
        ELSE 'valid'
    END as expiration_status,
    COUNT(vh.id) as verification_history_count
FROM recyclers r
LEFT JOIN verification_history vh ON r.id = vh.recycler_id
GROUP BY r.id, r.full_name, r.company_name, r.email, r.phone, r.verification_status, 
         r.admin_verified, r.verification_request_date, r.verification_expires_at, r.admin_notes;

-- Grant permissions
GRANT SELECT ON admin_verification_dashboard TO authenticated;
GRANT ALL ON verification_history TO authenticated;
GRANT ALL ON admin_roles TO authenticated;

-- Enable RLS on new tables
ALTER TABLE verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
