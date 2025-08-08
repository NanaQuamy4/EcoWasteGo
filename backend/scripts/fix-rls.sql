-- Fix RLS for users table
-- Run this in Supabase SQL Editor

-- Disable RLS on users table for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Or create a policy that allows all operations (alternative)
-- CREATE POLICY "Allow all operations on users" ON users
-- FOR ALL USING (true) WITH CHECK (true);

-- Verify the change
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users'; 