-- EcoWasteGo Complete Supabase Database Schema
-- Run this entire script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
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

-- Users Table (Main table for all users)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'recycler')),
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  privacy_policy_accepted BOOLEAN DEFAULT FALSE,
  privacy_policy_version VARCHAR(10),
  privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
  privacy_policy_withdrawn_at TIMESTAMP WITH TIME ZONE,
  profile_image VARCHAR(500),
  
  -- Recycler-specific fields
  company_name VARCHAR(255),
  business_location VARCHAR(255),
  passport_photo_url VARCHAR(500),
  business_document_url VARCHAR(500),
  areas_of_operation TEXT,
  available_resources TEXT,
  verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waste collections table
CREATE TABLE waste_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES users(id) ON DELETE SET NULL,
    waste_type VARCHAR NOT NULL CHECK (waste_type IN ('plastic', 'paper', 'glass', 'metal', 'organic', 'electronics', 'mixed')),
    weight DECIMAL(10,2),
    description TEXT,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
    pickup_date TIMESTAMP WITH TIME ZONE,
    pickup_address TEXT,
    pickup_notes TEXT,
    collection_photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR DEFAULT 'GHS',
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR CHECK (payment_method IN ('mobile_money', 'bank_transfer', 'cash', 'card')),
    transaction_id VARCHAR,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Summaries table (for recycler payment calculations)
CREATE TABLE payment_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(10,2) NOT NULL,
    rate_per_kg DECIMAL(10,2) NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    environmental_tax DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'rejected')),
    sent_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weight Entry Records table
CREATE TABLE weight_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(10,2) NOT NULL,
    waste_type VARCHAR NOT NULL,
    notes TEXT,
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recycler profiles table
CREATE TABLE recycler_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR,
    business_license VARCHAR,
    service_areas TEXT[], -- Array of areas served
    vehicle_type VARCHAR,
    vehicle_number VARCHAR,
    experience_years INTEGER,
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_collections INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer preferences table
CREATE TABLE customer_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferred_waste_types TEXT[], -- Array of preferred waste types
    preferred_pickup_times TEXT[], -- Array of preferred pickup times
    preferred_payment_method VARCHAR,
    notification_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eco impact tracking table
CREATE TABLE eco_impact (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    impact_type VARCHAR(50), -- 'co2_saved', 'trees_equivalent', 'energy_saved'
    impact_value DECIMAL(10,4),
    impact_unit VARCHAR(20),
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracking sessions table
CREATE TABLE tracking_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pickup_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    start_location JSONB, -- {lat, lng, address}
    current_location JSONB,
    end_location JSONB,
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recycler registrations table (for verification process)
CREATE TABLE recycler_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_license VARCHAR(255),
    business_address TEXT,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    business_type VARCHAR(100),
    years_in_business INTEGER,
    documents_submitted JSONB, -- Array of document URLs
    verification_notes TEXT,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request rejections table
CREATE TABLE request_rejections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    rejection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verifications table
CREATE TABLE email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pickup_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards table
CREATE TABLE rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reward_type VARCHAR(50), -- 'points', 'badge', 'discount'
    reward_value INTEGER,
    reward_description TEXT,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    points_required INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Reviews table
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50), -- 'technical', 'billing', 'general'
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support messages table
CREATE TABLE support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- For internal notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_waste_collections_customer_id ON waste_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_waste_collections_recycler_id ON waste_collections(recycler_id);
CREATE INDEX IF NOT EXISTS idx_waste_collections_status ON waste_collections(status);
CREATE INDEX IF NOT EXISTS idx_payments_collection_id ON payments(collection_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_summaries_collection_id ON payment_summaries(collection_id);
CREATE INDEX IF NOT EXISTS idx_payment_summaries_status ON payment_summaries(status);
CREATE INDEX IF NOT EXISTS idx_weight_entries_collection_id ON weight_entries(collection_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_collection_id ON reviews(collection_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_pickup_id ON tracking_sessions(pickup_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_recycler_id ON tracking_sessions(recycler_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_customer_id ON tracking_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_status ON tracking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_recycler_registrations_user_id ON recycler_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_recycler_registrations_status ON recycler_registrations(status);
CREATE INDEX IF NOT EXISTS idx_request_rejections_collection_id ON request_rejections(collection_id);
CREATE INDEX IF NOT EXISTS idx_request_rejections_recycler_id ON request_rejections(recycler_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_otp ON email_verifications(otp);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_email ON email_verifications(user_id, email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pickup_id ON chat_messages(pickup_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waste_collections_updated_at BEFORE UPDATE ON waste_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recycler_profiles_updated_at BEFORE UPDATE ON recycler_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_preferences_updated_at BEFORE UPDATE ON customer_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracking_sessions_updated_at BEFORE UPDATE ON tracking_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recycler_registrations_updated_at BEFORE UPDATE ON recycler_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_summaries_updated_at BEFORE UPDATE ON payment_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create eco impact calculation function
CREATE OR REPLACE FUNCTION calculate_eco_impact()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate eco impact based on waste type and weight
    INSERT INTO eco_impact (user_id, collection_id, impact_type, impact_value, impact_unit)
    SELECT 
        NEW.customer_id,
        NEW.id,
        'co2_saved',
        CASE 
            WHEN NEW.waste_type = 'plastic' THEN NEW.weight * 2.5
            WHEN NEW.waste_type = 'paper' THEN NEW.weight * 1.8
            WHEN NEW.waste_type = 'glass' THEN NEW.weight * 0.3
            WHEN NEW.waste_type = 'metal' THEN NEW.weight * 4.2
            WHEN NEW.waste_type = 'organic' THEN NEW.weight * 0.5
            ELSE NEW.weight * 1.0
        END,
        'kg'
    WHERE NEW.status = 'completed';
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for eco impact calculation
CREATE TRIGGER calculate_eco_impact_trigger 
    AFTER INSERT ON waste_collections
    FOR EACH ROW EXECUTE FUNCTION calculate_eco_impact();

-- Create views for common queries
CREATE OR REPLACE VIEW verified_recyclers AS
SELECT 
    id,
    email,
    username,
    company_name,
    business_location,
    areas_of_operation,
    available_resources,
    created_at,
    updated_at
FROM users 
WHERE role = 'recycler' 
AND verification_status = 'verified' 
AND status = 'active';

CREATE OR REPLACE VIEW pending_recyclers AS
SELECT 
    id,
    email,
    username,
    company_name,
    business_location,
    areas_of_operation,
    available_resources,
    created_at,
    updated_at
FROM users 
WHERE role = 'recycler' 
AND verification_status IN ('unverified', 'pending')
AND status = 'active';

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic ones - you can customize these)
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own collections" ON waste_collections
    FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = recycler_id);

CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() IN (
        SELECT customer_id FROM waste_collections WHERE id = payments.collection_id
    ));

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Insert some sample achievements
INSERT INTO achievements (name, description, points_required) VALUES
('First Collection', 'Complete your first waste collection', 0),
('Eco Warrior', 'Complete 10 waste collections', 10),
('Plastic Hero', 'Collect 50kg of plastic waste', 50),
('Paper Champion', 'Collect 100kg of paper waste', 100),
('Metal Master', 'Collect 75kg of metal waste', 75),
('Glass Guardian', 'Collect 25kg of glass waste', 25),
('Organic Expert', 'Collect 200kg of organic waste', 200),
('Electronics Specialist', 'Collect 10kg of electronic waste', 10),
('Mixed Waste Pro', 'Collect 500kg of mixed waste', 500),
('Eco Legend', 'Complete 100 waste collections', 1000);

COMMIT; 