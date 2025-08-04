-- EcoWasteGo Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR NOT NULL,
    phone VARCHAR,
    role VARCHAR DEFAULT 'customer' CHECK (role IN ('customer', 'recycler', 'admin')),
    email_verified BOOLEAN DEFAULT FALSE,
    profile_image VARCHAR,
    address TEXT,
    city VARCHAR,
    state VARCHAR,
    country VARCHAR DEFAULT 'Ghana',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waste collections table
CREATE TABLE IF NOT EXISTS public.waste_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
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
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES public.waste_collections(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR DEFAULT 'GHS',
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR CHECK (payment_method IN ('mobile_money', 'bank_transfer', 'cash', 'card')),
    transaction_id VARCHAR,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recycler profiles table
CREATE TABLE IF NOT EXISTS public.recycler_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.customer_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    preferred_pickup_time VARCHAR,
    preferred_pickup_days TEXT[], -- Array of days
    auto_schedule BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eco impact tracking table
CREATE TABLE IF NOT EXISTS public.eco_impact (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.waste_collections(id) ON DELETE CASCADE,
    co2_saved DECIMAL(10,2), -- CO2 saved in kg
    trees_equivalent DECIMAL(10,2), -- Trees equivalent
    water_saved DECIMAL(10,2), -- Water saved in liters
    energy_saved DECIMAL(10,2), -- Energy saved in kWh
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_waste_collections_customer_id ON public.waste_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_waste_collections_recycler_id ON public.waste_collections(recycler_id);
CREATE INDEX IF NOT EXISTS idx_waste_collections_status ON public.waste_collections(status);
CREATE INDEX IF NOT EXISTS idx_payments_collection_id ON public.payments(collection_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eco_impact ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for waste_collections table
CREATE POLICY "Users can view their own collections" ON public.waste_collections
    FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = recycler_id);

CREATE POLICY "Users can create their own collections" ON public.waste_collections
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own collections" ON public.waste_collections
    FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = recycler_id);

-- RLS Policies for payments table
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.waste_collections 
            WHERE id = payments.collection_id 
            AND (customer_id = auth.uid() OR recycler_id = auth.uid())
        )
    );

CREATE POLICY "Users can create payments for their collections" ON public.payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.waste_collections 
            WHERE id = payments.collection_id 
            AND customer_id = auth.uid()
        )
    );

-- RLS Policies for recycler_profiles table
CREATE POLICY "Recyclers can view their own profile" ON public.recycler_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Recyclers can update their own profile" ON public.recycler_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Recyclers can insert their own profile" ON public.recycler_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for customer_preferences table
CREATE POLICY "Users can view their own preferences" ON public.customer_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.customer_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.customer_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for eco_impact table
CREATE POLICY "Users can view their own eco impact" ON public.eco_impact
    FOR SELECT USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waste_collections_updated_at BEFORE UPDATE ON public.waste_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recycler_profiles_updated_at BEFORE UPDATE ON public.recycler_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_preferences_updated_at BEFORE UPDATE ON public.customer_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate eco impact
CREATE OR REPLACE FUNCTION calculate_eco_impact()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate CO2 saved based on waste type and weight
    -- These are approximate values - adjust based on research
    INSERT INTO public.eco_impact (user_id, collection_id, co2_saved, trees_equivalent, water_saved, energy_saved)
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
$$ language 'plpgsql';

-- Create trigger for eco impact calculation
CREATE TRIGGER calculate_eco_impact_trigger 
    AFTER INSERT ON public.waste_collections
    FOR EACH ROW EXECUTE FUNCTION calculate_eco_impact();

-- Insert sample data for testing (optional)
-- INSERT INTO public.users (id, email, username, role) VALUES 
--     ('00000000-0000-0000-0000-000000000001', 'admin@ecowastego.com', 'Admin', 'admin'),
--     ('00000000-0000-0000-0000-000000000002', 'customer@ecowastego.com', 'TestCustomer', 'customer'),
--     ('00000000-0000-0000-0000-000000000003', 'recycler@ecowastego.com', 'TestRecycler', 'recycler'); 
 