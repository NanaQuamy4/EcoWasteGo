-- Recreate missing RPC functions that were dropped during RLS fix
-- This addresses the "Could not find the function public.get_recycler_verifications" error

-- Recreate the get_recycler_verifications function
CREATE OR REPLACE FUNCTION get_recycler_verifications()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    email TEXT,
    company_name TEXT,
    phone TEXT,
    residential_address TEXT,
    areas_of_operation TEXT,
    truck_size TEXT,
    truck_number_plate TEXT,
    drivers_license TEXT,
    verification_status TEXT,
    admin_notes TEXT,
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id::UUID,
        r.user_id::UUID,
        COALESCE(au.raw_user_meta_data->>'full_name', '')::TEXT as full_name,
        au.email::TEXT,
        COALESCE(au.raw_user_meta_data->>'company_name', '')::TEXT as company_name,
        COALESCE(au.raw_user_meta_data->>'phone', '')::TEXT as phone,
        COALESCE(r.residential_address, '')::TEXT as residential_address,
        COALESCE(r.areas_of_operation, '')::TEXT as areas_of_operation,
        COALESCE(r.truck_size, '')::TEXT as truck_size,
        COALESCE(r.truck_number_plate, '')::TEXT as truck_number_plate,
        COALESCE(r.drivers_license, '')::TEXT as drivers_license,
        COALESCE(au.raw_user_meta_data->>'verification_status', 'incomplete')::TEXT as verification_status,
        COALESCE(au.raw_user_meta_data->>'admin_notes', '')::TEXT as admin_notes,
        COALESCE(au.raw_user_meta_data->>'profile_photo_url', '')::TEXT as profile_photo_url,
        r.created_at,
        r.updated_at
    FROM recyclers r
    LEFT JOIN auth.users au ON r.user_id = au.id
    WHERE au.raw_user_meta_data->>'verification_status' IN ('pending', 'rejected')
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the is_admin_user function
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = user_id 
        AND raw_user_meta_data->>'role' = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the get_user_role function
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = user_id LIMIT 1),
        'customer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION get_recycler_verifications() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Missing RPC functions recreated successfully!' as status;
