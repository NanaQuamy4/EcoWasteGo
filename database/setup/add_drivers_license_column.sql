-- Add drivers_license column to recyclers table
ALTER TABLE recyclers ADD COLUMN IF NOT EXISTS drivers_license TEXT;

-- Add drivers_license column to recycler_verifications table
ALTER TABLE recycler_verifications ADD COLUMN IF NOT EXISTS drivers_license TEXT;

-- Update the admin_all_users view to include drivers_license
DROP VIEW IF EXISTS admin_all_users;
CREATE VIEW admin_all_users AS
SELECT 
    'customer' as user_type,
    id,
    full_name,
    email,
    phone,
    created_at,
    updated_at,
    NULL as company_name,
    NULL as verification_status,
    NULL as admin_verified,
    NULL as verification_expires_at,
    NULL as residential_address,
    NULL as areas_of_operation,
    NULL as truck_size,
    NULL as truck_number_plate,
    NULL as drivers_license
FROM customers
UNION ALL
SELECT 
    'recycler' as user_type,
    id,
    full_name,
    email,
    phone,
    created_at,
    updated_at,
    company_name,
    verification_status,
    admin_verified,
    verification_expires_at,
    residential_address,
    areas_of_operation,
    truck_size,
    truck_number_plate,
    drivers_license
FROM recyclers;

-- Drop the existing function first, then recreate it with the new return type
DROP FUNCTION IF EXISTS get_recycler_verifications();

-- Create the RPC function with drivers_license included
CREATE FUNCTION get_recycler_verifications()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    residential_address TEXT,
    areas_of_operation TEXT,
    truck_size TEXT,
    truck_number_plate TEXT,
    drivers_license TEXT,
    verification_status TEXT,
    verification_request_date TIMESTAMPTZ,
    admin_notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.full_name::TEXT,
        r.email::TEXT,
        r.phone::TEXT,
        r.company_name::TEXT,
        r.residential_address::TEXT,
        r.areas_of_operation::TEXT,
        r.truck_size::TEXT,
        r.truck_number_plate::TEXT,
        r.drivers_license::TEXT,
        r.verification_status::TEXT,
        r.verification_request_date,
        r.admin_notes::TEXT
    FROM recyclers r
    WHERE r.verification_status IS NOT NULL
    ORDER BY r.verification_request_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'Drivers license column added successfully!' as status;
