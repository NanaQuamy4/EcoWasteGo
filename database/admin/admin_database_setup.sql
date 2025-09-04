-- =====================================================
-- Complete Admin Database Setup
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- 1. Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'verifier')),
    permissions JSONB DEFAULT '{"can_verify_recyclers": true, "can_view_reports": true, "can_manage_users": true}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create recycler verification requests table
CREATE TABLE IF NOT EXISTS recycler_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recycler_id UUID REFERENCES recyclers(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    residential_address TEXT,
    areas_of_operation TEXT,
    truck_size VARCHAR(100),
    truck_number_plate VARCHAR(50),
    profile_image TEXT, -- Profile image URL/path
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired')),
    admin_verified BOOLEAN DEFAULT FALSE,
    admin_verification_date TIMESTAMP WITH TIME ZONE,
    admin_verified_by UUID REFERENCES admin_users(id),
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    verification_request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_verification_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create verification history table for audit trail
CREATE TABLE IF NOT EXISTS verification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    verification_id UUID REFERENCES recycler_verifications(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES recyclers(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admin_users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('requested', 'approved', 'rejected', 'expired', 'renewed', 'reviewed')),
    status_before VARCHAR(20),
    status_after VARCHAR(20),
    notes TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT FALSE,
    related_resource_type VARCHAR(50),
    related_resource_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

CREATE INDEX IF NOT EXISTS idx_recycler_verifications_status ON recycler_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_recycler_verifications_admin_verified ON recycler_verifications(admin_verified);
CREATE INDEX IF NOT EXISTS idx_recycler_verifications_recycler_id ON recycler_verifications(recycler_id);
CREATE INDEX IF NOT EXISTS idx_recycler_verifications_request_date ON recycler_verifications(verification_request_date);

CREATE INDEX IF NOT EXISTS idx_verification_history_verification_id ON verification_history(verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_recycler_id ON verification_history(recycler_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_admin_id ON verification_history(admin_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_created_at ON verification_history(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycler_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for admin_users
CREATE POLICY "Admins can view all admin users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can manage admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- 10. Create RLS policies for recycler_verifications
CREATE POLICY "Admins can view all verifications" ON recycler_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'verifier')
        )
    );

CREATE POLICY "Admins can update verifications" ON recycler_verifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'verifier')
        )
    );

CREATE POLICY "Recyclers can view own verification" ON recycler_verifications
    FOR SELECT USING (recycler_id = auth.uid());

-- 11. Create RLS policies for verification_history
CREATE POLICY "Admins can view verification history" ON verification_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'verifier')
        )
    );

CREATE POLICY "Admins can insert verification history" ON verification_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'verifier')
        )
    );

-- 12. Create RLS policies for admin_activity_log
CREATE POLICY "Admins can view activity logs" ON admin_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "System can insert activity logs" ON admin_activity_log
    FOR INSERT WITH CHECK (true);

-- 13. Create RLS policies for admin_sessions
CREATE POLICY "Admins can manage own sessions" ON admin_sessions
    FOR ALL USING (admin_id IN (
        SELECT id FROM admin_users WHERE user_id = auth.uid()
    ));

-- 14. Create RLS policies for admin_notifications
CREATE POLICY "Admins can view own notifications" ON admin_notifications
    FOR SELECT USING (admin_id IN (
        SELECT id FROM admin_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admins can update own notifications" ON admin_notifications
    FOR UPDATE USING (admin_id IN (
        SELECT id FROM admin_users WHERE user_id = auth.uid()
    ));

-- 15. Create admin policies for customers table (allow admins to view all customers)
CREATE POLICY "Admins can view all customers" ON customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update customer profiles" ON customers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 16. Create admin policies for recyclers table (allow admins to view all recyclers)
CREATE POLICY "Admins can view all recyclers" ON recyclers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update recycler profiles" ON recyclers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 17. Create functions for admin operations
CREATE OR REPLACE FUNCTION create_admin_user(
    admin_email VARCHAR,
    admin_full_name VARCHAR,
    admin_role VARCHAR DEFAULT 'admin'
)
RETURNS UUID AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Insert new admin user
    INSERT INTO admin_users (email, full_name, role)
    VALUES (admin_email, admin_full_name, admin_role)
    RETURNING id INTO admin_user_id;
    
    -- Log the activity
    INSERT INTO admin_activity_log (admin_id, action, resource_type, resource_id, details)
    VALUES (admin_user_id, 'admin_user_created', 'admin_user', admin_user_id, 
            json_build_object('email', admin_email, 'role', admin_role));
    
    RETURN admin_user_id;
END;
$$ LANGUAGE plpgsql;

-- 18. Create function to approve/reject verification
CREATE OR REPLACE FUNCTION process_verification(
    verification_uuid UUID,
    action_type VARCHAR,
    admin_notes TEXT DEFAULT NULL,
    expiration_days INTEGER DEFAULT 365
)
RETURNS BOOLEAN AS $$
DECLARE
    admin_user_record RECORD;
    verification_record RECORD;
BEGIN
    -- Get admin user info
    SELECT * INTO admin_user_record FROM admin_users WHERE user_id = auth.uid();
    
    IF admin_user_record IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User is not an admin';
    END IF;
    
    -- Get verification info
    SELECT * INTO verification_record FROM recycler_verifications WHERE id = verification_uuid;
    
    IF verification_record IS NULL THEN
        RAISE EXCEPTION 'Verification request not found';
    END IF;
    
    -- Update verification status
    UPDATE recycler_verifications 
    SET 
        verification_status = action_type,
        admin_verified = (action_type = 'approved'),
        admin_verification_date = CASE WHEN action_type = 'approved' THEN NOW() ELSE NULL END,
        admin_verified_by = admin_user_record.id,
        verification_expires_at = CASE WHEN action_type = 'approved' THEN NOW() + INTERVAL '1 day' * expiration_days ELSE NULL END,
        admin_notes = admin_notes,
        updated_at = NOW()
    WHERE id = verification_uuid;
    
    -- Log the action
    INSERT INTO verification_history (verification_id, recycler_id, admin_id, action, status_before, status_after, notes)
    VALUES (verification_uuid, verification_record.recycler_id, admin_user_record.id, action_type, 
            verification_record.verification_status, action_type, admin_notes);
    
    -- Log admin activity
    INSERT INTO admin_activity_log (admin_id, action, resource_type, resource_id, details)
    VALUES (admin_user_record.id, 'verification_processed', 'recycler_verification', verification_uuid,
            json_build_object('action', action_type, 'recycler_id', verification_record.recycler_id));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 19. Add verification columns to existing recyclers table
ALTER TABLE recyclers 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired')),
ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_verified_by UUID REFERENCES admin_users(id),
ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS verification_request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_verification_check TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- Note: profile_photo_url column already exists in recyclers table

-- 20. Create comprehensive view for all users (customers and recyclers)
CREATE OR REPLACE VIEW admin_all_users AS
SELECT 
    'customer' as user_type,
    c.id,
    c.full_name,
    c.email,
    c.phone,
    c.created_at,
    c.updated_at,
    NULL as company_name,
    NULL as verification_status,
    NULL as admin_verified,
    NULL as verification_expires_at
FROM customers c
UNION ALL
SELECT 
    'recycler' as user_type,
    r.id,
    r.full_name,
    r.email,
    r.phone,
    r.created_at,
    r.updated_at,
    r.company_name,
    r.verification_status,
    r.admin_verified,
    r.verification_expires_at
FROM recyclers r;

-- 21. Create view for admin dashboard
CREATE OR REPLACE VIEW admin_dashboard AS
SELECT 
    rv.id,
    rv.full_name,
    rv.company_name,
    rv.email,
    rv.phone,
    rv.verification_status,
    rv.admin_verified,
    rv.verification_request_date,
    rv.verification_expires_at,
    rv.admin_notes,
    CASE 
        WHEN rv.verification_expires_at IS NOT NULL AND rv.verification_expires_at < NOW()
        THEN 'expired'
        WHEN rv.verification_expires_at IS NOT NULL AND rv.verification_expires_at < (NOW() + INTERVAL '30 days')
        THEN 'expiring_soon'
        ELSE 'valid'
    END as expiration_status,
    COUNT(vh.id) as verification_history_count,
    au.full_name as admin_name
FROM recycler_verifications rv
LEFT JOIN verification_history vh ON rv.id = vh.verification_id
LEFT JOIN admin_users au ON rv.admin_verified_by = au.id
GROUP BY rv.id, rv.full_name, rv.company_name, rv.email, rv.phone, rv.verification_status, 
         rv.admin_verified, rv.verification_request_date, rv.verification_expires_at, rv.admin_notes, au.full_name;

-- 22. Create view for user statistics
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
    'customers' as user_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30_days,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7_days,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as new_users_1_day
FROM customers
UNION ALL
SELECT 
    'recyclers' as user_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30_days,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7_days,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as new_users_1_day
FROM recyclers;

-- 23. Grant permissions
GRANT SELECT ON admin_dashboard TO authenticated;
GRANT SELECT ON admin_all_users TO authenticated;
GRANT SELECT ON admin_user_stats TO authenticated;
GRANT ALL ON admin_users TO authenticated;
GRANT ALL ON recycler_verifications TO authenticated;
GRANT ALL ON verification_history TO authenticated;
GRANT ALL ON admin_activity_log TO authenticated;
GRANT ALL ON admin_sessions TO authenticated;
GRANT ALL ON admin_notifications TO authenticated;

-- 24. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recycler_verifications_updated_at 
    BEFORE UPDATE ON recycler_verifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 25. Insert default super admin (you'll need to update this with your actual user ID)
-- Uncomment and update after creating your admin account
-- INSERT INTO admin_users (user_id, email, full_name, role, permissions) 
-- VALUES ('your-user-id-here', 'admin@ecowastego.com', 'Super Admin', 'super_admin', 
--         '{"can_verify_recyclers": true, "can_view_reports": true, "can_manage_users": true, "can_manage_admins": true}');

-- =====================================================
-- Admin Database Setup Completed Successfully!
-- =====================================================

-- Verification queries
SELECT 'Admin database setup completed successfully!' as status;

-- Show all created tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%admin%' OR table_name LIKE '%verification%'
ORDER BY table_name;

-- Show table structures (commented out as these are psql commands)
-- \d admin_users;
-- \d recycler_verifications;
-- \d verification_history;

-- Test the admin views
SELECT 'Testing admin views...' as test_status;
SELECT COUNT(*) as total_users FROM admin_all_users;
SELECT * FROM admin_user_stats;
