-- Confirm admin email to fix login issue
-- This will set email_confirmed_at to current timestamp

UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'admin@ecowastego.com';

-- Verify the update
SELECT 
    email,
    email_confirmed_at,
    updated_at
FROM auth.users 
WHERE email = 'admin@ecowastego.com';

SELECT 'SUCCESS: Admin email confirmed! You can now login with admin@ecowastego.com' as status;
