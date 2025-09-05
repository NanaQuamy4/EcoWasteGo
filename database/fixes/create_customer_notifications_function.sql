-- Create function to get customer notifications

-- Step 1: Drop existing function if it exists and create function to get customer notifications
DROP FUNCTION IF EXISTS get_customer_notifications(UUID, INTEGER);
CREATE OR REPLACE FUNCTION get_customer_notifications(
    p_customer_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    type VARCHAR(50),
    title TEXT,
    message TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    related_request_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type::VARCHAR(50),
        n.title::TEXT,
        n.message::TEXT,
        n.is_read,
        n.created_at,
        n.related_request_id
    FROM notifications n
    WHERE n.user_id = p_customer_id
    ORDER BY n.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Step 2: Drop existing function if it exists and create function to mark notification as read
DROP FUNCTION IF EXISTS mark_notification_read(UUID, UUID);
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_customer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = true, updated_at = NOW()
    WHERE id = p_notification_id AND user_id = p_customer_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$;

-- Step 3: Drop existing function if it exists and create function to get unread notification count
DROP FUNCTION IF EXISTS get_unread_notification_count(UUID);
CREATE OR REPLACE FUNCTION get_unread_notification_count(
    p_customer_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM notifications
    WHERE user_id = p_customer_id AND is_read = false;
    
    RETURN COALESCE(unread_count, 0);
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION get_customer_notifications(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_notifications(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO anon;

-- Step 5: Test the functions
SELECT '✅ Customer notification functions created successfully!' as result;
