-- Add missing columns to recyclers table
-- Note: available_resources and business_location columns removed as per requirements

-- Add only the columns that are actually used in the app
ALTER TABLE recyclers ADD COLUMN IF NOT EXISTS residential_address TEXT;
ALTER TABLE recyclers ADD COLUMN IF NOT EXISTS areas_of_operation TEXT;
ALTER TABLE recyclers ADD COLUMN IF NOT EXISTS truck_size TEXT;
ALTER TABLE recyclers ADD COLUMN IF NOT EXISTS truck_number_plate TEXT;
ALTER TABLE recyclers ADD COLUMN IF NOT EXISTS drivers_license TEXT;
ALTER TABLE recyclers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Update the schema cache
NOTIFY pgrst, 'reload schema';
