-- Add Password Columns for Database-Only Authentication
-- This implements Option 3: Skip Supabase Auth, use database authentication

-- Add password column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add password column to recyclers table  
ALTER TABLE public.recyclers 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Verify the new structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('customers', 'recyclers')
ORDER BY table_name, ordinal_position;

-- Note: password_hash will store bcrypt hashed passwords
-- For now, you can manually set a test password:
-- UPDATE public.customers SET password_hash = '$2b$10$...' WHERE email = 'nanaquamy4@gmail.com';
