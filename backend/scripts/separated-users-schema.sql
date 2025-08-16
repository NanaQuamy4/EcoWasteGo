-- EcoWasteGo Database Schema with Separated Customer and Recycler Tables
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
DROP TABLE IF EXISTS recyclers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;


-- Customers Table (Separate from recyclers)
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  company_name VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Ghana',
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  privacy_policy_accepted BOOLEAN DEFAULT FALSE,
  privacy_policy_version VARCHAR(10),
  privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
  privacy_policy_withdrawn_at TIMESTAMP WITH TIME ZONE,
  profile_image VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Recyclers Table (Separate from customers)
CREATE TABLE recyclers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  company_name VARCHAR(255),
  business_location VARCHAR(255),
  passport_photo_url VARCHAR(500),
  business_document_url VARCHAR(500),
  areas_of_operation TEXT,
  available_resources TEXT,
  vehicle_type VARCHAR(100),
  vehicle_number VARCHAR(50),
  experience_years INTEGER,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_collections INTEGER DEFAULT 0,
  verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  is_available BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
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


-- Email verifications table
CREATE TABLE email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'recycler')),
  user_id UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Waste collections table
CREATE TABLE waste_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES recyclers(id) ON DELETE SET NULL,
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
    recycler_id UUID REFERENCES recyclers(id) ON DELETE CASCADE,
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
    recycler_id UUID REFERENCES recyclers(id) ON DELETE CASCADE,
    weight DECIMAL(10,2) NOT NULL,
    waste_type VARCHAR NOT NULL,
    notes TEXT,
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'recycler')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Chat messages table
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'recycler')),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    file_url VARCHAR(500),
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracking sessions table
CREATE TABLE tracking_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES recyclers(id) ON DELETE CASCADE,
    start_location JSONB,
    current_location JSONB,
    end_location JSONB,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Create indexes for better performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_username ON customers(username);
CREATE INDEX idx_customers_status ON customers(status);

CREATE INDEX idx_recyclers_email ON recyclers(email);
CREATE INDEX idx_recyclers_username ON recyclers(username);
CREATE INDEX idx_recyclers_verification_status ON recyclers(verification_status);
CREATE INDEX idx_recyclers_status ON recyclers(status);
CREATE INDEX idx_recyclers_is_available ON recyclers(is_available);

CREATE INDEX idx_waste_collections_customer_id ON waste_collections(customer_id);
CREATE INDEX idx_waste_collections_recycler_id ON waste_collections(recycler_id);
CREATE INDEX idx_waste_collections_status ON waste_collections(status);
CREATE INDEX idx_waste_collections_created_at ON waste_collections(created_at);

CREATE INDEX idx_payments_collection_id ON payments(collection_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);


-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recyclers ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_sessions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Add comments to tables
COMMENT ON TABLE customers IS 'Stores customer account information and profiles';
COMMENT ON TABLE recyclers IS 'Stores recycler account information and business profiles';
COMMENT ON TABLE waste_collections IS 'Stores waste collection requests and their status';
COMMENT ON TABLE payments IS 'Stores payment information for waste collections';
COMMENT ON TABLE email_verifications IS 'Stores email verification OTPs for user registration';
