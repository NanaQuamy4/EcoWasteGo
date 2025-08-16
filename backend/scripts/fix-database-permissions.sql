-- Fix Database Permissions and RLS Policies for EcoWasteGo
-- Run this script in your Supabase SQL Editor to fix permission issues
-- Based on original schema: customers, recyclers, email_verifications, notifications, 
-- payment_summaries, payments, waste_collections, weight_entries, chat_messages, tracking_sessions

-- First, disable RLS temporarily to fix permissions (only for existing tables)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE recyclers DISABLE ROW LEVEL SECURITY;
ALTER TABLE waste_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_summaries DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to all roles
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant permissions on sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions on functions
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant create permissions
GRANT CREATE ON SCHEMA public TO anon;
GRANT CREATE ON SCHEMA public TO authenticated;
GRANT CREATE ON SCHEMA public TO service_role;

-- Now re-enable RLS with proper policies (only for existing tables)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recyclers ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_summaries ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for development (only for existing tables)
-- Customers table policies
CREATE POLICY "Allow all operations on customers" ON customers
    FOR ALL USING (true) WITH CHECK (true);

-- Recyclers table policies
CREATE POLICY "Allow all operations on recyclers" ON recyclers
    FOR ALL USING (true) WITH CHECK (true);

-- Waste collections table policies
CREATE POLICY "Allow all operations on waste_collections" ON waste_collections
    FOR ALL USING (true) WITH CHECK (true);

-- Payments table policies
CREATE POLICY "Allow all operations on payments" ON payments
    FOR ALL USING (true) WITH CHECK (true);

-- Email verifications table policies
CREATE POLICY "Allow all operations on email_verifications" ON email_verifications
    FOR ALL USING (true) WITH CHECK (true);

-- Notifications table policies
CREATE POLICY "Allow all operations on notifications" ON notifications
    FOR ALL USING (true) WITH CHECK (true);

-- Chat messages table policies
CREATE POLICY "Allow all operations on chat_messages" ON chat_messages
    FOR ALL USING (true) WITH CHECK (true);

-- Tracking sessions table policies
CREATE POLICY "Allow all operations on tracking_sessions" ON tracking_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Weight entries table policies
CREATE POLICY "Allow all operations on weight_entries" ON weight_entries
    FOR ALL USING (true) WITH CHECK (true);

-- Payment summaries table policies
CREATE POLICY "Allow all operations on payment_summaries" ON payment_summaries
    FOR ALL USING (true) WITH CHECK (true);

-- Verify permissions
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
