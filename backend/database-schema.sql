-- EcoWasteGo Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waste collections table
CREATE TABLE IF NOT EXISTS waste_collections (
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
CREATE TABLE IF NOT EXISTS payments (
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
CREATE TABLE IF NOT EXISTS payment_summaries (
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
CREATE TABLE IF NOT EXISTS weight_entries (
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
CREATE TABLE IF NOT EXISTS recycler_profiles (
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
CREATE TABLE IF NOT EXISTS customer_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferred_pickup_time VARCHAR,
    preferred_pickup_days TEXT[], -- Array of days
    auto_schedule BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eco impact tracking table
CREATE TABLE IF NOT EXISTS eco_impact (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    co2_saved DECIMAL(10,2), -- CO2 saved in kg
    trees_equivalent DECIMAL(10,2), -- Trees equivalent
    water_saved DECIMAL(10,2), -- Water saved in liters
    energy_saved DECIMAL(10,2), -- Energy saved in kWh
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracking Sessions Table
CREATE TABLE IF NOT EXISTS tracking_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pickup_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
  recycler_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_location TEXT NOT NULL,
  destination_location TEXT NOT NULL,
  current_location TEXT,
  current_speed DECIMAL(5,2) DEFAULT 0,
  current_heading DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'en_route' CHECK (status IN ('en_route', 'arrived', 'picking_up', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recycler Registrations Table
CREATE TABLE IF NOT EXISTS recycler_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  documents JSONB DEFAULT '{}',
  personal_info JSONB DEFAULT '{}',
  service_info JSONB DEFAULT '{}',
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request Rejections Table
CREATE TABLE IF NOT EXISTS request_rejections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
  recycler_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Verifications Table
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pickup_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) CHECK (sender_type IN ('customer', 'recycler')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards Table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  type VARCHAR(20) CHECK (type IN ('achievement', 'milestone', 'bonus', 'referral')),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'expired')),
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  points INTEGER DEFAULT 0,
  criteria JSONB, -- Criteria for earning the achievement
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements Table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewed_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN ('technical', 'billing', 'service', 'general')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Messages Table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) CHECK (sender_type IN ('customer', 'support', 'admin')),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
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

-- Indexes for tracking_sessions
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_pickup_id ON tracking_sessions(pickup_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_recycler_id ON tracking_sessions(recycler_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_customer_id ON tracking_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_status ON tracking_sessions(status);

-- Indexes for recycler_registrations
CREATE INDEX IF NOT EXISTS idx_recycler_registrations_user_id ON recycler_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_recycler_registrations_status ON recycler_registrations(status);

-- Indexes for request_rejections
CREATE INDEX IF NOT EXISTS idx_request_rejections_collection_id ON request_rejections(collection_id);
CREATE INDEX IF NOT EXISTS idx_request_rejections_recycler_id ON request_rejections(recycler_id);

-- Indexes for email_verifications
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_otp ON email_verifications(otp);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_email ON email_verifications(user_id, email);

-- Indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_pickup_id ON chat_messages(pickup_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycler_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycler_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for waste_collections table
CREATE POLICY "Users can view their own collections" ON waste_collections
    FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = recycler_id);

CREATE POLICY "Users can create their own collections" ON waste_collections
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own collections" ON waste_collections
    FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = recycler_id);

-- RLS Policies for payments table
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE id = payments.collection_id 
            AND (customer_id = auth.uid() OR recycler_id = auth.uid())
        )
    );

CREATE POLICY "Users can create payments for their collections" ON payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE id = payments.collection_id 
            AND customer_id = auth.uid()
        )
    );

-- RLS Policies for payment_summaries table
CREATE POLICY "Users can view their own payment summaries" ON payment_summaries
    FOR SELECT USING (auth.uid() = recycler_id OR 
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE id = payment_summaries.collection_id 
            AND customer_id = auth.uid()
        )
    );

CREATE POLICY "Recyclers can create payment summaries" ON payment_summaries
    FOR INSERT WITH CHECK (auth.uid() = recycler_id);

-- RLS Policies for weight_entries table
CREATE POLICY "Users can view weight entries for their collections" ON weight_entries
    FOR SELECT USING (auth.uid() = recycler_id OR 
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE id = weight_entries.collection_id 
            AND customer_id = auth.uid()
        )
    );

CREATE POLICY "Recyclers can create weight entries" ON weight_entries
    FOR INSERT WITH CHECK (auth.uid() = recycler_id);

-- RLS Policies for recycler_profiles table
CREATE POLICY "Recyclers can view their own profile" ON recycler_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Recyclers can update their own profile" ON recycler_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Recyclers can insert their own profile" ON recycler_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for customer_preferences table
CREATE POLICY "Users can view their own preferences" ON customer_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON customer_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON customer_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for eco_impact table
CREATE POLICY "Users can view their own eco impact" ON eco_impact
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for tracking_sessions
CREATE POLICY "Recyclers can view own tracking sessions" ON tracking_sessions
  FOR SELECT USING (auth.uid() = recycler_id);

CREATE POLICY "Customers can view own pickup tracking" ON tracking_sessions
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Recyclers can insert own tracking sessions" ON tracking_sessions
  FOR INSERT WITH CHECK (auth.uid() = recycler_id);

CREATE POLICY "Recyclers can update own tracking sessions" ON tracking_sessions
  FOR UPDATE USING (auth.uid() = recycler_id);

-- RLS Policies for recycler_registrations
CREATE POLICY "Users can view their own registrations" ON recycler_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own registrations" ON recycler_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending registrations" ON recycler_registrations
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- RLS Policies for request_rejections
CREATE POLICY "Recyclers can view their own rejections" ON request_rejections
  FOR SELECT USING (auth.uid() = recycler_id);

CREATE POLICY "Recyclers can insert their own rejections" ON request_rejections
  FOR INSERT WITH CHECK (auth.uid() = recycler_id);

-- RLS Policies for email_verifications
CREATE POLICY "Users can view their own verification records" ON email_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification records" ON email_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own verification records" ON email_verifications
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages for their pickups" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM waste_collections 
      WHERE id = chat_messages.pickup_id 
      AND (customer_id = auth.uid() OR recycler_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages for their pickups" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM waste_collections 
      WHERE id = chat_messages.pickup_id 
      AND (customer_id = auth.uid() OR recycler_id = auth.uid())
    ) AND sender_id = auth.uid()
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- RLS Policies for rewards
CREATE POLICY "Users can view their own rewards" ON rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards" ON rewards
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for reviews
CREATE POLICY "Users can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their collections" ON reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM waste_collections 
      WHERE id = reviews.collection_id 
      AND (customer_id = auth.uid() OR recycler_id = auth.uid())
    ) AND reviewer_id = auth.uid()
  );

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" ON support_tickets
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages for their tickets" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE id = support_messages.ticket_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages for their tickets" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE id = support_messages.ticket_id 
      AND user_id = auth.uid()
    ) AND sender_id = auth.uid()
  );

-- Create function for automatic timestamp updates (SINGLE DEFINITION)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
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

-- Function to calculate eco impact
CREATE OR REPLACE FUNCTION calculate_eco_impact()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate CO2 saved based on waste type and weight
    -- These are approximate values - adjust based on research
    INSERT INTO eco_impact (user_id, collection_id, co2_saved, trees_equivalent, water_saved, energy_saved)
    VALUES (
        NEW.customer_id,
        NEW.id,
        CASE 
            WHEN NEW.waste_type = 'plastic' THEN NEW.weight * 2.5
            WHEN NEW.waste_type = 'paper' THEN NEW.weight * 1.8
            WHEN NEW.waste_type = 'glass' THEN NEW.weight * 0.3
            WHEN NEW.waste_type = 'metal' THEN NEW.weight * 4.0
            WHEN NEW.waste_type = 'organic' THEN NEW.weight * 0.5
            WHEN NEW.waste_type = 'electronics' THEN NEW.weight * 8.0
            ELSE NEW.weight * 1.5
        END,
        CASE 
            WHEN NEW.waste_type = 'plastic' THEN NEW.weight * 0.1
            WHEN NEW.waste_type = 'paper' THEN NEW.weight * 0.08
            WHEN NEW.waste_type = 'glass' THEN NEW.weight * 0.02
            WHEN NEW.waste_type = 'metal' THEN NEW.weight * 0.15
            WHEN NEW.waste_type = 'organic' THEN NEW.weight * 0.03
            WHEN NEW.waste_type = 'electronics' THEN NEW.weight * 0.3
            ELSE NEW.weight * 0.06
        END,
        CASE 
            WHEN NEW.waste_type = 'plastic' THEN NEW.weight * 100
            WHEN NEW.waste_type = 'paper' THEN NEW.weight * 80
            WHEN NEW.waste_type = 'glass' THEN NEW.weight * 20
            WHEN NEW.waste_type = 'metal' THEN NEW.weight * 150
            WHEN NEW.waste_type = 'organic' THEN NEW.weight * 30
            WHEN NEW.waste_type = 'electronics' THEN NEW.weight * 300
            ELSE NEW.weight * 60
        END,
        CASE 
            WHEN NEW.waste_type = 'plastic' THEN NEW.weight * 5.0
            WHEN NEW.waste_type = 'paper' THEN NEW.weight * 3.5
            WHEN NEW.waste_type = 'glass' THEN NEW.weight * 1.0
            WHEN NEW.waste_type = 'metal' THEN NEW.weight * 8.0
            WHEN NEW.waste_type = 'organic' THEN NEW.weight * 1.5
            WHEN NEW.waste_type = 'electronics' THEN NEW.weight * 15.0
            ELSE NEW.weight * 3.0
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for eco impact calculation
CREATE TRIGGER calculate_eco_impact_trigger 
    AFTER INSERT ON waste_collections
    FOR EACH ROW EXECUTE FUNCTION calculate_eco_impact(); 