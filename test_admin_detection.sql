-- Test admin user detection and notification system
-- Run this to check if admin users exist and notifications are working

-- Check if there are any admin users
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin'
ORDER BY created_at DESC;

-- Check if admin_notifications table exists and has data
SELECT 
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications,
    COUNT(CASE WHEN type = 'help_message' THEN 1 END) as help_message_notifications
FROM admin_notifications;

-- Check recent help messages
SELECT 
    id,
    user_name,
    user_role,
    message,
    status,
    priority,
    created_at
FROM help_messages 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name IN ('notify_admin_help_message', 'notify_admin_verification_request');

-- Check if RPC functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_admin_notifications', 'create_admin_notification', 'get_admin_unread_count')
AND routine_schema = 'public';
