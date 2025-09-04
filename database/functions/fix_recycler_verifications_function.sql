-- Fix the get_recycler_verifications function
-- Based on the error "column r.user_id does not exist", the recyclers table likely uses 'id' as the foreign key

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_recycler_verifications();

-- Create the corrected function
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
        r.id::UUID as user_id,  -- Use r.id as user_id since it references auth.users.id
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
    LEFT JOIN auth.users au ON r.id = au.id  -- Join on r.id = au.id
    WHERE au.raw_user_meta_data->>'verification_status' IN ('pending', 'rejected')
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_recycler_verifications() TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'get_recycler_verifications function fixed!' as status;
