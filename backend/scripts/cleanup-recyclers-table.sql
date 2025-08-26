-- Cleanup Recyclers Table Schema
-- Remove unused columns and keep only essential ones for authentication

-- First, let's see the current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'recyclers'
ORDER BY ordinal_position;

-- Remove unused columns (keeping only essential ones)
-- Keep: id, email, phone, privacy_policy_accepted, privacy_policy_accepted_at

-- Remove columns that are not being used:
ALTER TABLE public.recyclers DROP COLUMN IF EXISTS username;
ALTER TABLE public.recyclers DROP COLUMN IF EXISTS role;
ALTER TABLE public.recyclers DROP COLUMN IF EXISTS company_name;
ALTER TABLE public.recyclers DROP COLUMN IF EXISTS verification_status;
ALTER TABLE public.recyclers DROP COLUMN IF EXISTS created_at;
ALTER TABLE public.recyclers DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.recyclers DROP COLUMN IF EXISTS business_location;
ALTER TABLE public.recyclers DROP COLUMN IF EXISTS available_resources;
ALTER TABLE public.recyclers DROP COLUMN IF EXISTS passport_photo_url;
ALTER TABLE public.recyclers DROP COLUMN IF EXISTS business_document_url;

-- Verify the final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'recyclers'
ORDER BY ordinal_position;

-- Expected final structure:
-- id (uuid) - Primary key
-- email (varchar) - For Supabase authentication
-- phone (varchar) - For phone-based login
-- privacy_policy_accepted (bool) - User consent
-- privacy_policy_accepted_at (timestamp) - Consent timestamp
