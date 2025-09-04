-- Fix Admin Verification Issues
-- This script addresses the remaining database errors

-- Step 1: Fix the get_recycler_verifications function
DROP FUNCTION IF EXISTS get_recycler_verifications();

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

-- Step 2: Check if admin_verified_by column exists and fix foreign key constraint
-- First, let's see what columns exist in the recyclers table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'recyclers' 
AND table_schema = 'public'
AND column_name LIKE '%admin%';

-- Step 3: Fix the foreign key constraint issue
-- Remove the problematic foreign key constraint if it exists
ALTER TABLE recyclers DROP CONSTRAINT IF EXISTS recyclers_admin_verified_by_fkey;

-- Step 4: Make admin_verified_by column nullable to avoid constraint issues
ALTER TABLE recyclers ALTER COLUMN admin_verified_by DROP NOT NULL;

-- Step 5: Create a default admin user if it doesn't exist
-- First check if admin user exists
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin user exists in auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin' 
    LIMIT 1;
    
    -- If no admin user exists, create one
    IF admin_user_id IS NULL THEN
        -- Insert admin user into auth.users (this will be handled by the app)
        -- For now, just ensure the admin_users table has a record
        INSERT INTO admin_users (id, email, full_name, role, is_active, created_at)
        VALUES (
            gen_random_uuid(),
            'admin@ecowastego.com',
            'System Administrator',
            'admin',
            true,
            NOW()
        )
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- Step 6: Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION get_recycler_verifications() TO authenticated;

-- Step 7: Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Admin verification issues fixed!' as status;
