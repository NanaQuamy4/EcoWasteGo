-- Grant Admin Permissions
-- This script creates RPC functions that allow admins to access user data

-- Step 1: Create RPC function to get user analytics data
CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS TABLE (
    total_users BIGINT,
    total_customers BIGINT,
    total_recyclers BIGINT,
    verified_recyclers BIGINT,
    pending_verifications BIGINT,
    approved_verifications BIGINT,
    rejected_verifications BIGINT,
    new_users_this_month BIGINT,
    growth_rate NUMERIC
) AS $$
DECLARE
    current_month_start TIMESTAMP;
    last_month_start TIMESTAMP;
    last_month_end TIMESTAMP;
    new_users_count BIGINT;
    last_month_users_count BIGINT;
    calculated_growth_rate NUMERIC;
BEGIN
    -- Calculate date ranges
    current_month_start := date_trunc('month', CURRENT_DATE);
    last_month_start := date_trunc('month', CURRENT_DATE - INTERVAL '1 month');
    last_month_end := current_month_start;
    
    -- Get user counts
    SELECT 
        COUNT(*) FILTER (WHERE raw_user_meta_data->>'role' != 'admin'),
        COUNT(*) FILTER (WHERE raw_user_meta_data->>'role' = 'customer'),
        COUNT(*) FILTER (WHERE raw_user_meta_data->>'role' = 'recycler'),
        COUNT(*) FILTER (WHERE raw_user_meta_data->>'role' = 'recycler' AND raw_user_meta_data->>'verification_status' = 'approved'),
        COUNT(*) FILTER (WHERE raw_user_meta_data->>'role' = 'recycler' AND raw_user_meta_data->>'verification_status' = 'pending'),
        COUNT(*) FILTER (WHERE raw_user_meta_data->>'role' = 'recycler' AND raw_user_meta_data->>'verification_status' = 'approved'),
        COUNT(*) FILTER (WHERE raw_user_meta_data->>'role' = 'recycler' AND raw_user_meta_data->>'verification_status' = 'rejected'),
        COUNT(*) FILTER (WHERE created_at >= current_month_start AND raw_user_meta_data->>'role' != 'admin'),
        COUNT(*) FILTER (WHERE created_at >= last_month_start AND created_at < last_month_end AND raw_user_meta_data->>'role' != 'admin')
    INTO 
        total_users,
        total_customers,
        total_recyclers,
        verified_recyclers,
        pending_verifications,
        approved_verifications,
        rejected_verifications,
        new_users_count,
        last_month_users_count
    FROM auth.users;
    
    -- Calculate growth rate
    IF last_month_users_count > 0 THEN
        calculated_growth_rate := ROUND(((new_users_count - last_month_users_count)::NUMERIC / last_month_users_count::NUMERIC) * 100, 1);
    ELSIF new_users_count > 0 THEN
        calculated_growth_rate := 100.0;
    ELSE
        calculated_growth_rate := 0.0;
    END IF;
    
    RETURN QUERY SELECT 
        total_users,
        total_customers,
        total_recyclers,
        verified_recyclers,
        pending_verifications,
        approved_verifications,
        rejected_verifications,
        new_users_count,
        calculated_growth_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create RPC function to get recent activity
CREATE OR REPLACE FUNCTION get_recent_activity()
RETURNS TABLE (
    id UUID,
    type TEXT,
    description TEXT,
    activity_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title as description,
        n.created_at as activity_timestamp
    FROM notifications n
    ORDER BY n.created_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION get_user_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity() TO authenticated;

-- Step 4: Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE email = user_email 
        AND raw_user_meta_data->>'role' = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin_user(TEXT) TO authenticated;

-- Step 6: Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Admin permissions granted successfully!' as status;
