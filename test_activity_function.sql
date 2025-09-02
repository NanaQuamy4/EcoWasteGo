-- Test script to verify the get_recent_activity function is working
-- Run this in Supabase SQL Editor to test the function

-- Test 1: Check if function exists and returns correct structure
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'get_recent_activity';

-- Test 2: Try to call the function
SELECT * FROM get_recent_activity();

-- Test 3: Check notifications table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name IN ('type', 'title');

-- Test 4: Check if there are any notifications to display
SELECT COUNT(*) as total_notifications FROM notifications;
