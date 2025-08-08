-- Comprehensive RLS Fix for EcoWasteGo
-- Run this in Supabase SQL Editor

-- 1. Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE waste_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE recycler_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE eco_impact DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE recycler_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE request_rejections DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages DISABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies that might be causing issues
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON users;

-- 3. Create a simple policy that allows all operations
CREATE POLICY "Allow all operations on users" ON users
FOR ALL USING (true) WITH CHECK (true);

-- 4. Verify the changes
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'waste_collections', 'payments')
ORDER BY tablename; 