-- Fix Admin Permissions and Update User Metadata
-- This script creates an RPC function to update user verification status

-- Step 1: Create RPC function to update user verification status
CREATE OR REPLACE FUNCTION update_user_verification_status(
    user_id UUID,
    verification_status TEXT,
    admin_verified BOOLEAN,
    admin_verification_date TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the auth.users metadata
    UPDATE auth.users 
    SET 
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'verification_status', verification_status,
            'admin_verified', admin_verified,
            'admin_verification_date', admin_verification_date,
            'admin_notes', admin_notes
        )
    WHERE id = user_id;
    
    -- Return true if update was successful
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION update_user_verification_status(UUID, TEXT, BOOLEAN, TIMESTAMP WITH TIME ZONE, TEXT) TO authenticated;

-- Step 3: Update the get_recycler_verifications function to also check user metadata
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
        r.id::UUID as user_id,
        COALESCE(au.raw_user_meta_data->>'full_name', '')::TEXT as full_name,
        au.email::TEXT,
        COALESCE(au.raw_user_meta_data->>'company_name', '')::TEXT as company_name,
        COALESCE(au.raw_user_meta_data->>'phone', '')::TEXT as phone,
        COALESCE(r.residential_address, '')::TEXT as residential_address,
        COALESCE(r.areas_of_operation, '')::TEXT as areas_of_operation,
        COALESCE(r.truck_size, '')::TEXT as truck_size,
        COALESCE(r.truck_number_plate, '')::TEXT as truck_number_plate,
        COALESCE(r.drivers_license, '')::TEXT as drivers_license,
        COALESCE(r.verification_status, au.raw_user_meta_data->>'verification_status', 'incomplete')::TEXT as verification_status,
        COALESCE(r.admin_notes, au.raw_user_meta_data->>'admin_notes', '')::TEXT as admin_notes,
        COALESCE(au.raw_user_meta_data->>'profile_photo_url', '')::TEXT as profile_photo_url,
        r.created_at,
        r.updated_at
    FROM recyclers r
    LEFT JOIN auth.users au ON r.id = au.id
    WHERE COALESCE(r.verification_status, au.raw_user_meta_data->>'verification_status', 'incomplete') IN ('pending', 'rejected')
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant execute permissions
GRANT EXECUTE ON FUNCTION get_recycler_verifications() TO authenticated;

-- Step 5: Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Admin permissions and RPC functions fixed!' as status;
