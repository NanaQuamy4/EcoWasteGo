-- Fix RLS Policies for Recyclers Table
-- This script fixes the infinite recursion issue in the recyclers table policies

-- First, drop all existing policies on recyclers table
DROP POLICY IF EXISTS "Recyclers can view own profile" ON recyclers;
DROP POLICY IF EXISTS "Recyclers can update own profile" ON recyclers;
DROP POLICY IF EXISTS "Admins can view all recyclers" ON recyclers;
DROP POLICY IF EXISTS "Admins can update recycler profiles" ON recyclers;
DROP POLICY IF EXISTS "Admins can update verification status" ON recyclers;

-- Create simplified policies that avoid recursion
-- 1. Recyclers can view their own profile
CREATE POLICY "Recyclers can view own profile" ON recyclers
    FOR SELECT USING (id = auth.uid());

-- 2. Recyclers can update their own profile
CREATE POLICY "Recyclers can update own profile" ON recyclers
    FOR UPDATE USING (id = auth.uid());

-- 3. Admins can view all recyclers (simplified to avoid recursion)
CREATE POLICY "Admins can view all recyclers" ON recyclers
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'admin@ecowastego.com'
    );

-- 4. Admins can update all recycler profiles (simplified to avoid recursion)
CREATE POLICY "Admins can update recycler profiles" ON recyclers
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'admin@ecowastego.com'
    );

-- 5. Admins can update verification status (simplified to avoid recursion)
CREATE POLICY "Admins can update verification status" ON recyclers
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'admin@ecowastego.com'
    );

-- Also fix policies for recycler_verifications table
DROP POLICY IF EXISTS "Recyclers can view own verification" ON recycler_verifications;
DROP POLICY IF EXISTS "Admins can view all verifications" ON recycler_verifications;
DROP POLICY IF EXISTS "Admins can update verifications" ON recycler_verifications;

-- Create simplified policies for recycler_verifications
CREATE POLICY "Recyclers can view own verification" ON recycler_verifications
    FOR SELECT USING (recycler_id = auth.uid());

CREATE POLICY "Admins can view all verifications" ON recycler_verifications
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'admin@ecowastego.com'
    );

CREATE POLICY "Admins can update verifications" ON recycler_verifications
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'admin@ecowastego.com'
    );

-- Fix policies for admin_users table
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update admin users" ON admin_users;

CREATE POLICY "Admins can view all admin users" ON admin_users
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'admin@ecowastego.com'
    );

CREATE POLICY "Admins can update admin users" ON admin_users
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'admin@ecowastego.com'
    );

-- Fix policies for admin_all_users view (if it exists)
-- Note: Views don't have RLS policies, but the underlying tables do

-- Enable RLS on all tables to ensure policies are enforced
ALTER TABLE recyclers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycler_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, UPDATE ON recyclers TO authenticated;
GRANT SELECT, UPDATE ON recycler_verifications TO authenticated;
GRANT SELECT, UPDATE ON admin_users TO authenticated;
GRANT SELECT, UPDATE ON customers TO authenticated;
