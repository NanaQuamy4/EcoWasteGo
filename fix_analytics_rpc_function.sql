-- Fix the get_user_analytics RPC function to return consistent data
-- This will make all admin screens show the same user counts

-- Drop the existing function
DROP FUNCTION IF EXISTS get_user_analytics();

-- Create a corrected version that uses consistent counting logic
CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS TABLE (
    total_users INTEGER,
    total_customers INTEGER,
    total_recyclers INTEGER,
    verified_recyclers INTEGER,
    pending_verifications INTEGER,
    approved_verifications INTEGER,
    rejected_verifications INTEGER,
    total_admins INTEGER,
    active_users_24h INTEGER,
    new_users_7d INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total users (customers + recyclers, excluding admins)
        (SELECT COUNT(*)::INTEGER FROM customers) + 
        (SELECT COUNT(*)::INTEGER FROM recyclers) as total_users,
        
        -- Total customers
        (SELECT COUNT(*)::INTEGER FROM customers) as total_customers,
        
        -- Total recyclers  
        (SELECT COUNT(*)::INTEGER FROM recyclers) as total_recyclers,
        
        -- Verified recyclers
        (SELECT COUNT(*)::INTEGER FROM recyclers WHERE verification_status = 'approved') as verified_recyclers,
        
        -- Pending verifications
        (SELECT COUNT(*)::INTEGER FROM recyclers WHERE verification_status = 'pending') as pending_verifications,
        
        -- Approved verifications
        (SELECT COUNT(*)::INTEGER FROM recyclers WHERE verification_status = 'approved') as approved_verifications,
        
        -- Rejected verifications
        (SELECT COUNT(*)::INTEGER FROM recyclers WHERE verification_status = 'rejected') as rejected_verifications,
        
        -- Total admins
        (SELECT COUNT(*)::INTEGER FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin') as total_admins,
        
        -- Active users in last 24 hours
        (SELECT COUNT(*)::INTEGER FROM auth.users 
         WHERE last_sign_in_at > NOW() - INTERVAL '24 hours' 
         AND raw_user_meta_data->>'role' IN ('customer', 'recycler')) as active_users_24h,
        
        -- New users in last 7 days
        (SELECT COUNT(*)::INTEGER FROM auth.users 
         WHERE created_at > NOW() - INTERVAL '7 days' 
         AND raw_user_meta_data->>'role' IN ('customer', 'recycler')) as new_users_7d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_analytics() TO authenticated;

-- Test the fixed function
SELECT 'Fixed get_user_analytics results:' as info;
SELECT * FROM get_user_analytics();

-- Verify the counts match the admin_all_users view
SELECT 'Verification - admin_all_users view:' as info;
SELECT 
    user_type,
    COUNT(*) as count
FROM admin_all_users 
GROUP BY user_type;
