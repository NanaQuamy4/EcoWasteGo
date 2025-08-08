-- Fix Service Role Permissions
-- Run this in Supabase SQL Editor

-- 1. Grant all privileges to service_role on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 2. Grant future privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- 3. Grant usage on schema
GRANT USAGE ON SCHEMA public TO service_role;

-- 4. Grant specific permissions on users table
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5. Grant permissions on all other tables
GRANT SELECT, INSERT, UPDATE, DELETE ON waste_collections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON payments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_summaries TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON weight_entries TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON recycler_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_preferences TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON eco_impact TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON tracking_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON recycler_registrations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON request_rejections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_verifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON rewards TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON achievements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_achievements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON reviews TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON support_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON support_messages TO service_role;

-- 6. Verify the permissions
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE grantee = 'service_role' AND table_name = 'users'; 