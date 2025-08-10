-- EcoWasteGo Production Row Level Security Policies
-- Run this in your Supabase SQL Editor for production

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycler_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycler_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS TABLE POLICIES
-- =============================================================================

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================================================
-- WASTE COLLECTIONS TABLE POLICIES
-- =============================================================================

-- Customers can see their own waste collections
CREATE POLICY "Customers can view own collections" ON waste_collections
    FOR SELECT USING (
        auth.uid() = customer_id OR 
        auth.uid() = recycler_id
    );

-- Customers can create waste collections
CREATE POLICY "Customers can create collections" ON waste_collections
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own collections (before acceptance)
CREATE POLICY "Customers can update own collections" ON waste_collections
    FOR UPDATE USING (
        auth.uid() = customer_id AND 
        status = 'pending'
    );

-- Recyclers can see pending collections in their area
CREATE POLICY "Recyclers can view pending collections" ON waste_collections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'recycler'
            AND users.verification_status = 'verified'
        )
    );

-- Recyclers can update collections they've accepted
CREATE POLICY "Recyclers can update accepted collections" ON waste_collections
    FOR UPDATE USING (
        auth.uid() = recycler_id AND 
        status IN ('accepted', 'in_progress', 'completed')
    );

-- =============================================================================
-- PAYMENTS TABLE POLICIES
-- =============================================================================

-- Users can only see payments related to their collections
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE waste_collections.id = payments.collection_id
            AND (waste_collections.customer_id = auth.uid() OR 
                 waste_collections.recycler_id = auth.uid())
        )
    );

-- Only authenticated users can create payments
CREATE POLICY "Authenticated users can create payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- =============================================================================

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- =============================================================================
-- RECYCLER PROFILES TABLE POLICIES
-- =============================================================================

-- Recyclers can view their own profile
CREATE POLICY "Recyclers can view own profile" ON recycler_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Recyclers can update their own profile
CREATE POLICY "Recyclers can update own profile" ON recycler_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Customers can view verified recycler profiles
CREATE POLICY "Customers can view verified recyclers" ON recycler_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = recycler_profiles.user_id
            AND users.verification_status = 'verified'
            AND users.status = 'active'
        )
    );

-- =============================================================================
-- TRACKING SESSIONS TABLE POLICIES
-- =============================================================================

-- Users can only see tracking sessions they're involved in
CREATE POLICY "Users can view own tracking sessions" ON tracking_sessions
    FOR SELECT USING (
        auth.uid() = customer_id OR 
        auth.uid() = recycler_id
    );

-- Recyclers can update tracking sessions they're handling
CREATE POLICY "Recyclers can update tracking sessions" ON tracking_sessions
    FOR UPDATE USING (auth.uid() = recycler_id);

-- =============================================================================
-- SUPPORT TICKETS TABLE POLICIES
-- =============================================================================

-- Users can only see their own support tickets
CREATE POLICY "Users can view own support tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create support tickets
CREATE POLICY "Users can create support tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets
CREATE POLICY "Users can update own tickets" ON support_tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- CHAT MESSAGES TABLE POLICIES
-- =============================================================================

-- Users can only see messages from collections they're involved in
CREATE POLICY "Users can view collection messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE waste_collections.id = chat_messages.pickup_id
            AND (waste_collections.customer_id = auth.uid() OR 
                 waste_collections.recycler_id = auth.uid())
        )
    );

-- Users can send messages to collections they're involved in
CREATE POLICY "Users can send messages" ON chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE waste_collections.id = chat_messages.pickup_id
            AND (waste_collections.customer_id = auth.uid() OR 
                 waste_collections.recycler_id = auth.uid())
        )
    );

-- =============================================================================
-- ADMIN POLICIES (for service role)
-- =============================================================================

-- Service role can bypass RLS for all operations
-- This is handled automatically by Supabase when using service role key

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'waste_collections', 'payments', 'notifications',
    'recycler_profiles', 'tracking_sessions', 'support_tickets'
)
ORDER BY tablename;

-- Count policies on each table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
