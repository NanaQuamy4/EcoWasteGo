-- =====================================================
-- EcoWasteGo Notifications Database Setup
-- =====================================================
-- This script creates the notifications system with proper permissions
-- Run this as a database superuser (postgres) or with sufficient privileges

-- =====================================================
-- 1. CREATE DATABASE (if not exists)
-- =====================================================
-- Uncomment if you need to create the database
-- CREATE DATABASE ecowastego_notifications;

-- =====================================================
-- 2. CONNECT TO DATABASE
-- =====================================================
-- \c ecowastego_notifications;

-- =====================================================
-- 3. CREATE EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 4. CREATE TABLES
-- =====================================================

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'recycler', 'admin')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (
        type IN (
            'pickup_confirmed', 'pickup_completed', 'arrival_notification',
            'points_earned', 'challenge_unlocked', 'payment_received',
            'payment_rejected', 'recycler_assigned', 'reminder', 'system'
        )
    ),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    data JSONB DEFAULT '{}',
    expires_at TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- User notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    push_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    pickup_updates BOOLEAN DEFAULT TRUE,
    payment_updates BOOLEAN DEFAULT TRUE,
    challenge_updates BOOLEAN DEFAULT TRUE,
    system_updates BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification delivery logs table
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delivery_method VARCHAR(50) NOT NULL CHECK (delivery_method IN ('push', 'email', 'sms', 'in_app')),
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Delivery logs indexes
CREATE INDEX IF NOT EXISTS idx_delivery_logs_notification_id ON notification_delivery_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_user_id ON notification_delivery_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_status ON notification_delivery_logs(delivery_status);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_created_at ON notification_delivery_logs(created_at);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- 6. CREATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 7. CREATE TRIGGERS
-- =====================================================

-- Notifications updated_at trigger
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User preferences updated_at trigger
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. CREATE DATABASE USER AND PERMISSIONS
-- =====================================================

-- Create application user (replace 'your_app_user' and 'your_secure_password' with actual values)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ecowastego_app') THEN
        CREATE USER ecowastego_app WITH PASSWORD 'your_secure_password_here';
    END IF;
END
$$;

-- Grant permissions to application user
GRANT CONNECT ON DATABASE ecowastego_notifications TO ecowastego_app;
GRANT USAGE ON SCHEMA public TO ecowastego_app;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ecowastego_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO ecowastego_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_notification_preferences TO ecowastego_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_delivery_logs TO ecowastego_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO ecowastego_app;

-- Grant sequence permissions (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ecowastego_app;
GRANT USAGE, SELECT ON users_id_seq TO ecowastego_app;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO ecowastego_app;

-- =====================================================
-- 9. CREATE ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications table
CREATE POLICY notifications_user_access ON notifications
    FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Create policies for user preferences
CREATE POLICY user_preferences_own_access ON user_notification_preferences
    FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Create policies for delivery logs
CREATE POLICY delivery_logs_user_access ON notification_delivery_logs
    FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- =====================================================
-- 10. INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert sample user (for testing)
INSERT INTO users (phone_number, email, full_name, role) 
VALUES ('+233123456789', 'test@ecowastego.com', 'Test User', 'customer')
ON CONFLICT (phone_number) DO NOTHING;

-- Insert sample notification preferences
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users WHERE phone_number = '+233123456789'
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 11. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get user notifications with pagination
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_id INTEGER,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN,
    created_at TIMESTAMP,
    data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.is_read,
        n.created_at,
        n.data
    FROM notifications n
    WHERE n.user_id = p_user_id
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_user_unread_count(p_user_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notifications
        WHERE user_id = p_user_id AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, updated_at = NOW()
    WHERE id = p_notification_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id AND is_read = FALSE;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_user_notifications(INTEGER, INTEGER, INTEGER) TO ecowastego_app;
GRANT EXECUTE ON FUNCTION get_user_unread_count(INTEGER) TO ecowastego_app;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID, INTEGER) TO ecowastego_app;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(INTEGER) TO ecowastego_app;

-- =====================================================
-- 12. CREATE VIEWS FOR EASY QUERYING
-- =====================================================

-- View for user notifications with delivery status
CREATE OR REPLACE VIEW user_notifications_view AS
SELECT 
    n.id,
    n.user_id,
    n.title,
    n.message,
    n.type,
    n.is_read,
    n.created_at,
    n.data,
    n.priority,
    COALESCE(
        (SELECT COUNT(*) FROM notification_delivery_logs 
         WHERE notification_id = n.id AND delivery_status = 'delivered'), 0
    ) as delivery_count
FROM notifications n;

-- Grant select permissions on views
GRANT SELECT ON user_notifications_view TO ecowastego_app;

-- =====================================================
-- 13. FINAL PERMISSIONS CHECK
-- =====================================================

-- Verify permissions
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasinsert,
    hasselect,
    hasupdate,
    hasdelete
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('notifications', 'user_notification_preferences', 'notification_delivery_logs', 'users');

-- =====================================================
-- 14. BACKUP AND RECOVERY NOTES
-- =====================================================

-- To backup the notifications data:
-- pg_dump -h localhost -U postgres -d ecowastego_notifications -t notifications -t user_notification_preferences > notifications_backup.sql

-- To restore:
-- psql -h localhost -U postgres -d ecowastego_notifications < notifications_backup.sql

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Notifications database setup completed successfully!';
    RAISE NOTICE '📱 Database: ecowastego_notifications';
    RAISE NOTICE '👤 Application User: ecowastego_app';
    RAISE NOTICE '🔐 Remember to change the default password!';
    RAISE NOTICE '📊 Tables created: users, notifications, user_notification_preferences, notification_delivery_logs';
    RAISE NOTICE '🔒 RLS enabled with proper security policies';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '🛠️ Helper functions and views created';
END $$;
