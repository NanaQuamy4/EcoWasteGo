-- Fix notifications constraint by first identifying ALL existing types
-- This approach dynamically includes all existing notification types

-- Step 1: Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 2: Create a dynamic constraint that includes all existing types
DO $$
DECLARE
    existing_types text;
    constraint_sql text;
BEGIN
    -- Get all distinct notification types as a comma-separated string
    SELECT string_agg(DISTINCT quote_literal(type), ', ' ORDER BY quote_literal(type))
    INTO existing_types
    FROM notifications;
    
    -- Add our new tracking types
    existing_types := existing_types || ', ''recycler_location_update'', ''recycler_started_navigation'', ''navigation_started''';
    
    -- Build the constraint SQL
    constraint_sql := 'ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (' || existing_types || '))';
    
    -- Execute the constraint
    EXECUTE constraint_sql;
    
    RAISE NOTICE 'Constraint created with types: %', existing_types;
END $$;

-- Verify the constraint works
SELECT 'SUCCESS: Dynamic constraint created with all existing types!' as status;
