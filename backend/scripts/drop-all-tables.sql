-- Comprehensive Drop All Tables Script for EcoWasteGo
-- Run this in your Supabase SQL Editor to completely clean the database

-- First, disable RLS on all tables
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS waste_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recycler_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tracking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recycler_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weight_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS eco_impact DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS request_rejections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS support_messages DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own collections" ON waste_collections;
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own profiles" ON recycler_profiles;
DROP POLICY IF EXISTS "Users can view their own preferences" ON customer_preferences;
DROP POLICY IF EXISTS "Users can view their own tracking" ON tracking_sessions;
DROP POLICY IF EXISTS "Users can view their own registrations" ON recycler_registrations;
DROP POLICY IF EXISTS "Users can view their own payment summaries" ON payment_summaries;
DROP POLICY IF EXISTS "Users can view their own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view their own weight entries" ON weight_entries;
DROP POLICY IF EXISTS "Users can view their own eco impact" ON eco_impact;
DROP POLICY IF EXISTS "Users can view their own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view their own email verifications" ON email_verifications;
DROP POLICY IF EXISTS "Users can view their own request rejections" ON request_rejections;
DROP POLICY IF EXISTS "Users can view their own rewards" ON rewards;
DROP POLICY IF EXISTS "Users can view their own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can view their own user achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view their own support messages" ON support_messages;

-- Drop all triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_waste_collections_updated_at ON waste_collections;
DROP TRIGGER IF EXISTS update_recycler_profiles_updated_at ON recycler_profiles;
DROP TRIGGER IF EXISTS update_customer_preferences_updated_at ON customer_preferences;
DROP TRIGGER IF EXISTS update_tracking_sessions_updated_at ON tracking_sessions;
DROP TRIGGER IF EXISTS update_recycler_registrations_updated_at ON recycler_registrations;
DROP TRIGGER IF EXISTS update_payment_summaries_updated_at ON payment_summaries;
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
DROP TRIGGER IF EXISTS calculate_eco_impact_trigger ON waste_collections;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_eco_impact() CASCADE;

-- Drop all views
DROP VIEW IF EXISTS verified_recyclers CASCADE;
DROP VIEW IF EXISTS pending_recyclers CASCADE;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS request_rejections CASCADE;
DROP TABLE IF EXISTS recycler_registrations CASCADE;
DROP TABLE IF EXISTS tracking_sessions CASCADE;
DROP TABLE IF EXISTS eco_impact CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS customer_preferences CASCADE;
DROP TABLE IF EXISTS recycler_profiles CASCADE;
DROP TABLE IF EXISTS weight_entries CASCADE;
DROP TABLE IF EXISTS payment_summaries CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS waste_collections CASCADE;
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any remaining indexes (they should be dropped with tables, but just in case)
DROP INDEX IF EXISTS idx_users_email CASCADE;
DROP INDEX IF EXISTS idx_users_role CASCADE;
DROP INDEX IF EXISTS idx_users_status CASCADE;
DROP INDEX IF EXISTS idx_users_verification_status CASCADE;
DROP INDEX IF EXISTS idx_waste_collections_customer_id CASCADE;
DROP INDEX IF EXISTS idx_waste_collections_recycler_id CASCADE;
DROP INDEX IF EXISTS idx_waste_collections_status CASCADE;
DROP INDEX IF EXISTS idx_payments_collection_id CASCADE;
DROP INDEX IF EXISTS idx_payments_status CASCADE;
DROP INDEX IF EXISTS idx_payment_summaries_collection_id CASCADE;
DROP INDEX IF EXISTS idx_payment_summaries_status CASCADE;
DROP INDEX IF EXISTS idx_weight_entries_collection_id CASCADE;
DROP INDEX IF EXISTS idx_notifications_user_id CASCADE;
DROP INDEX IF EXISTS idx_notifications_is_read CASCADE;
DROP INDEX IF EXISTS idx_rewards_user_id CASCADE;
DROP INDEX IF EXISTS idx_rewards_status CASCADE;
DROP INDEX IF EXISTS idx_user_achievements_user_id CASCADE;
DROP INDEX IF EXISTS idx_reviews_collection_id CASCADE;
DROP INDEX IF EXISTS idx_reviews_reviewed_id CASCADE;
DROP INDEX IF EXISTS idx_support_tickets_user_id CASCADE;
DROP INDEX IF EXISTS idx_support_tickets_status CASCADE;
DROP INDEX IF EXISTS idx_support_messages_ticket_id CASCADE;
DROP INDEX IF EXISTS idx_tracking_sessions_pickup_id CASCADE;
DROP INDEX IF EXISTS idx_tracking_sessions_recycler_id CASCADE;
DROP INDEX IF EXISTS idx_tracking_sessions_customer_id CASCADE;
DROP INDEX IF EXISTS idx_tracking_sessions_status CASCADE;
DROP INDEX IF EXISTS idx_recycler_registrations_user_id CASCADE;
DROP INDEX IF EXISTS idx_recycler_registrations_status CASCADE;
DROP INDEX IF EXISTS idx_request_rejections_collection_id CASCADE;
DROP INDEX IF EXISTS idx_request_rejections_recycler_id CASCADE;
DROP INDEX IF EXISTS idx_email_verifications_user_id CASCADE;
DROP INDEX IF EXISTS idx_email_verifications_email CASCADE;
DROP INDEX IF EXISTS idx_email_verifications_otp CASCADE;
DROP INDEX IF EXISTS idx_email_verifications_expires_at CASCADE;
DROP INDEX IF EXISTS idx_email_verifications_user_email CASCADE;
DROP INDEX IF EXISTS idx_chat_messages_pickup_id CASCADE;
DROP INDEX IF EXISTS idx_chat_messages_sender_id CASCADE;
DROP INDEX IF EXISTS idx_chat_messages_created_at CASCADE;
DROP INDEX IF EXISTS idx_chat_messages_is_read CASCADE;

-- Force cleanup of any remaining objects
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop any remaining tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop any remaining views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
    
    -- Drop any remaining functions
    FOR r IN (SELECT proname FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || ' CASCADE';
    END LOOP;
END $$;

COMMIT; 