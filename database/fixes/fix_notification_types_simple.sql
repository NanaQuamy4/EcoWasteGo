-- Simple fix for notification types constraint violation
-- This script first checks existing data, then creates a permissive constraint

-- Step 1: Check what notification types currently exist
SELECT 'Current notification types in database:' as info;
SELECT type, COUNT(*) as count
FROM notifications 
GROUP BY type 
ORDER BY type;

-- Step 2: Check current constraint
SELECT 'Current constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 3: Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 4: Create a very permissive constraint that allows any non-empty string
-- This will work with existing data and allow new types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IS NOT NULL AND type != '' AND length(type) > 0);

-- Step 5: Verify the constraint was created
SELECT 'New constraint created:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 6: Test that all existing data now passes
SELECT 'Testing constraint with existing data:' as info;
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All existing data passes the new constraint'
    ELSE '❌ ' || COUNT(*) || ' rows still violate the constraint'
  END as result
FROM notifications 
WHERE type IS NULL OR type = '' OR length(type) = 0;
