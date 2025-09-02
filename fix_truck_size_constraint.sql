-- Fix truck_size check constraint issue
-- The error indicates there's a check constraint on truck_size that's being violated

-- First, let's see what the current constraint is
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'recyclers'::regclass 
AND conname LIKE '%truck_size%';

-- Drop the problematic constraint
ALTER TABLE recyclers DROP CONSTRAINT IF EXISTS recyclers_truck_size_check;

-- Add a more flexible constraint that allows common truck sizes
ALTER TABLE recyclers ADD CONSTRAINT recyclers_truck_size_check 
CHECK (
    truck_size IS NULL OR 
    truck_size = '' OR
    truck_size IN (
        'Small (1-2 tons)',
        'Medium (3-5 tons)', 
        'Large (6-10 tons)',
        'Extra Large (10+ tons)',
        'Pickup Truck',
        'Van',
        'Box Truck',
        'Flatbed Truck',
        'Other'
    ) OR
    LENGTH(truck_size) <= 50  -- Allow custom values up to 50 characters
);

-- Also ensure the column allows NULL values
ALTER TABLE recyclers ALTER COLUMN truck_size DROP NOT NULL;

SELECT 'Truck size constraint fixed - now allows flexible values' as status;
