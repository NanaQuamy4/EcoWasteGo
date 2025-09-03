-- Delete user with email ecowastego@gmail.com from auth.users table
-- This will permanently remove the user and all associated data

-- Step 1: First, let's check if the user exists
SELECT 'Checking if user ecowastego@gmail.com exists...' as info;

SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'ecowastego@gmail.com';

-- Step 2: Check if user exists in other tables (customers, recyclers)
SELECT 'Checking if user exists in customers table...' as info;

SELECT 
    id,
    full_name,
    email,
    phone,
    created_at
FROM customers 
WHERE email = 'ecowastego@gmail.com';

SELECT 'Checking if user exists in recyclers table...' as info;

SELECT 
    id,
    full_name,
    email,
    phone,
    verification_status,
    created_at
FROM recyclers 
WHERE email = 'ecowastego@gmail.com';

-- Step 3: Delete from auth.users (this will cascade to related tables)
SELECT 'Deleting user from auth.users...' as info;

DELETE FROM auth.users 
WHERE email = 'ecowastego@gmail.com';

-- Step 4: Verify deletion
SELECT 'Verifying user has been deleted...' as info;

SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'ecowastego@gmail.com';

-- Step 5: Check if any orphaned records remain in customers/recyclers
SELECT 'Checking for orphaned records in customers...' as info;

SELECT 
    id,
    full_name,
    email,
    phone
FROM customers 
WHERE email = 'ecowastego@gmail.com';

SELECT 'Checking for orphaned records in recyclers...' as info;

SELECT 
    id,
    full_name,
    email,
    phone
FROM recyclers 
WHERE email = 'ecowastego@gmail.com';

SELECT 'SUCCESS: User ecowastego@gmail.com has been deleted from auth.users' as status;
