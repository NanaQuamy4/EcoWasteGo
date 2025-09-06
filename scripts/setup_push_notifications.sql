-- Setup script for push notifications system
-- Run this script to set up the complete push notification system

-- 1. Create user_push_tokens table (run manually: psql -f database/setup/create_user_push_tokens_table.sql)
-- 2. Create push notification functions (run manually: psql -f database/functions/send_push_notification_function.sql)  
-- 3. Update arrival detection to include push notifications (run manually: psql -f database/functions/arrival_detection_functions.sql)

-- 4. Grant additional permissions for push notifications
GRANT SELECT ON user_push_tokens TO authenticated;
GRANT INSERT ON user_push_tokens TO authenticated;
GRANT UPDATE ON user_push_tokens TO authenticated;
GRANT DELETE ON user_push_tokens TO authenticated;

-- 5. Create index for better performance on push token lookups
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_active 
ON user_push_tokens(user_id, is_active) 
WHERE is_active = TRUE;

-- 6. Add comments for documentation
COMMENT ON FUNCTION send_push_notification_on_arrival(UUID) IS 'Sends push notification to customer when recycler arrives';
COMMENT ON FUNCTION send_expo_push_notification(TEXT, TEXT, TEXT, JSONB) IS 'Sends push notification via Expo Push API';
COMMENT ON FUNCTION send_push_notification_on_payment(UUID) IS 'Sends push notification to customer when payment is received';

-- 7. Test the setup
DO $$
DECLARE
    test_user_id UUID;
    test_token TEXT := 'ExponentPushToken[test-token]';
    result BOOLEAN;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM customers LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test inserting a push token
        INSERT INTO user_push_tokens (user_id, push_token, platform)
        VALUES (test_user_id, test_token, 'android')
        ON CONFLICT (user_id, platform) DO UPDATE SET
            push_token = EXCLUDED.push_token,
            updated_at = NOW();
        
        RAISE NOTICE 'Push notification setup completed successfully';
        RAISE NOTICE 'Test user ID: %', test_user_id;
        
        -- Clean up test data
        DELETE FROM user_push_tokens WHERE push_token = test_token;
        
    ELSE
        RAISE NOTICE 'No test users found, but setup completed successfully';
    END IF;
END $$;

-- 8. Final verification
SELECT 
    'Push notification system setup completed' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_push_tokens') 
        THEN 'SUCCESS: user_push_tokens table created'
        ELSE 'ERROR: user_push_tokens table not found'
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_push_notification_on_arrival') 
        THEN 'SUCCESS: Push notification functions created'
        ELSE 'ERROR: Push notification functions not found'
    END as function_status;
