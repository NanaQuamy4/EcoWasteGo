-- Check recycler notifications and create test notifications if needed

-- 1. Check if notifications table exists and has data
SELECT 
    'Notifications table check:' as info,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications
FROM notifications;

-- 2. Check notifications for the specific recycler (Osei Adutwum)
SELECT 
    'Notifications for Osei Adutwum:' as info,
    n.id,
    n.title,
    n.message,
    n.type,
    n.is_read,
    n.created_at
FROM notifications n
JOIN auth.users u ON n.user_id = u.id
WHERE u.email = 'nquamy7@gmail.com'
ORDER BY n.created_at DESC;

-- 3. Check if notification triggers exist
SELECT 
    'Notification triggers check:' as info,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'recyclers'
AND trigger_name LIKE '%notification%';

-- 4. Create a test notification for the recycler if none exist
INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    action_data,
    created_at
)
SELECT 
    u.id,
    '🎉 Welcome to EcoWasteGo!',
    'Your recycler account has been successfully verified! You can now start accepting waste collection requests from customers in your area.',
    'verification',
    false,
    jsonb_build_object(
        'action_type', 'view_profile',
        'deep_link', '/recycler-screens/RecyclerEditProfileScreen',
        'button_text', 'View Profile'
    ),
    NOW()
FROM auth.users u
WHERE u.email = 'nquamy7@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM notifications n 
    WHERE n.user_id = u.id 
    AND n.type = 'verification'
);

-- 5. Create a pickup notification example
INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    action_data,
    created_at
)
SELECT 
    u.id,
    '📦 New Pickup Request Available',
    'A new waste collection request is available in your area. Location: KNUST Campus, Distance: 2.1 km, Waste Type: Mixed Waste',
    'pickup',
    false,
    jsonb_build_object(
        'action_type', 'view_requests',
        'deep_link', '/recycler-screens/RecyclerRequests',
        'button_text', 'View Request'
    ),
    NOW()
FROM auth.users u
WHERE u.email = 'nquamy7@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM notifications n 
    WHERE n.user_id = u.id 
    AND n.type = 'pickup'
);

-- 6. Verify the notifications were created
SELECT 
    'Final notification count:' as info,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications
FROM notifications n
JOIN auth.users u ON n.user_id = u.id
WHERE u.email = 'nquamy7@gmail.com';
