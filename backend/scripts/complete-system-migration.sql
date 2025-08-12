-- Complete System Migration for EcoWasteGo
-- This script creates all missing tables and columns for the complete system

-- =====================================================
-- 1. FIX CHAT MESSAGES TABLE
-- =====================================================

-- Check if sender_type column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'sender_type'
    ) THEN
        ALTER TABLE chat_messages ADD COLUMN sender_type VARCHAR(20);
        
        -- Update existing records with default sender_type
        UPDATE chat_messages SET sender_type = 'recycler' WHERE sender_type IS NULL;
        
        -- Make the column NOT NULL after updating existing data
        ALTER TABLE chat_messages ALTER COLUMN sender_type SET NOT NULL;
        
        -- Add the CHECK constraint
        ALTER TABLE chat_messages ADD CONSTRAINT check_sender_type 
            CHECK (sender_type IN ('customer', 'recycler'));
    END IF;
END $$;

-- Check if is_read column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE chat_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Check if updated_at column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE chat_messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 5. CREATE RECYCLER PROFILES TABLE
-- =====================================================

-- Create recycler_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS recycler_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recycler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  business_license VARCHAR(255),
  service_areas TEXT[],
  waste_types TEXT[],
  vehicle_info JSONB,
  experience_years INTEGER DEFAULT 1,
  hourly_rate DECIMAL(10,2) DEFAULT 10.00,
  availability_schedule JSONB DEFAULT '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": true}',
  bio TEXT,
  certifications TEXT[],
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_collections INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on recycler_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_recycler_profiles_recycler_id ON recycler_profiles(recycler_id);

-- Create index on availability
CREATE INDEX IF NOT EXISTS idx_recycler_profiles_is_available ON recycler_profiles(is_available);

-- Create index on service areas
CREATE INDEX IF NOT EXISTS idx_recycler_profiles_service_areas ON recycler_profiles USING GIN(service_areas);

-- Create index on waste types
CREATE INDEX IF NOT EXISTS idx_recycler_profiles_waste_types ON recycler_profiles USING GIN(waste_types);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_recycler_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_recycler_profiles_updated_at
  BEFORE UPDATE ON recycler_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_recycler_profiles_updated_at();

-- =====================================================
-- 6. CREATE REJECTED RECYCLERS TABLE
-- =====================================================

-- Create rejected_recyclers table if it doesn't exist
CREATE TABLE IF NOT EXISTS rejected_recyclers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES waste_collections(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recycler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE PAYMENT SUMMARIES TABLE
-- =====================================================

-- Create payment_summaries table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES waste_collections(id) ON DELETE CASCADE,
  recycler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight DECIMAL(10,2) NOT NULL,
  waste_type VARCHAR(50) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  environmental_tax DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE NOTIFICATIONS TABLE
-- =====================================================

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ADD MISSING COLUMNS TO WASTE_COLLECTIONS
-- =====================================================

-- Add missing columns to waste_collections table
DO $$
BEGIN
    -- Add rejection_reason column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waste_collections' 
        AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE waste_collections ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- Add accepted_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waste_collections' 
        AND column_name = 'accepted_at'
    ) THEN
        ALTER TABLE waste_collections ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add started_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waste_collections' 
        AND column_name = 'started_at'
    ) THEN
        ALTER TABLE waste_collections ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add completed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waste_collections' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE waste_collections ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add cancelled_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waste_collections' 
        AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE waste_collections ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add actual_weight column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waste_collections' 
        AND column_name = 'actual_weight'
    ) THEN
        ALTER TABLE waste_collections ADD COLUMN actual_weight DECIMAL(10,2);
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waste_collections' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE waste_collections ADD COLUMN notes TEXT;
    END IF;
    
    -- Add payment_summary_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waste_collections' 
        AND column_name = 'payment_summary_id'
    ) THEN
        ALTER TABLE waste_collections ADD COLUMN payment_summary_id UUID REFERENCES payment_summaries(id);
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waste_collections' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE waste_collections ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 6. CREATE INDEXES
-- =====================================================

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_pickup_id ON chat_messages(pickup_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pickup_created ON chat_messages(pickup_id, created_at);

-- Rejected recyclers indexes
CREATE INDEX IF NOT EXISTS idx_rejected_recyclers_request_id ON rejected_recyclers(request_id);
CREATE INDEX IF NOT EXISTS idx_rejected_recyclers_customer_id ON rejected_recyclers(customer_id);
CREATE INDEX IF NOT EXISTS idx_rejected_recyclers_recycler_id ON rejected_recyclers(recycler_id);
CREATE INDEX IF NOT EXISTS idx_rejected_recyclers_customer_recycler ON rejected_recyclers(customer_id, recycler_id);

-- Payment summaries indexes
CREATE INDEX IF NOT EXISTS idx_payment_summaries_request_id ON payment_summaries(request_id);
CREATE INDEX IF NOT EXISTS idx_payment_summaries_recycler_id ON payment_summaries(recycler_id);
CREATE INDEX IF NOT EXISTS idx_payment_summaries_status ON payment_summaries(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- 7. CREATE FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to get available recyclers excluding rejected ones
CREATE OR REPLACE FUNCTION get_available_recyclers_excluding_rejected(
  p_customer_id UUID,
  p_location TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  business_name TEXT,
  vehicle_type TEXT,
  rating NUMERIC,
  total_collections INTEGER,
  is_available BOOLEAN,
  service_areas TEXT[],
  city TEXT,
  state TEXT,
  address TEXT,
  profile_image TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    r.business_name,
    r.vehicle_type,
    r.rating,
    r.total_collections,
    r.is_available,
    r.service_areas,
    r.city,
    r.state,
    r.address,
    r.profile_image
  FROM users u
  INNER JOIN recyclers r ON u.id = r.user_id
  WHERE u.role = 'recycler'
    AND r.is_available = true
    AND u.id NOT IN (
      SELECT recycler_id 
      FROM rejected_recyclers 
      WHERE customer_id = p_customer_id
    )
    AND (
      p_location IS NULL 
      OR r.service_areas @> ARRAY[p_location]
      OR r.city ILIKE '%' || p_location || '%'
      OR r.state ILIKE '%' || p_location || '%'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(pickup_uuid UUID, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE chat_messages 
    SET is_read = TRUE 
    WHERE pickup_id = pickup_uuid 
    AND sender_id != user_uuid 
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CREATE TRIGGERS
-- =====================================================

-- Chat messages trigger
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Rejected recyclers trigger
CREATE OR REPLACE FUNCTION update_rejected_recyclers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rejected_recyclers_updated_at
  BEFORE UPDATE ON rejected_recyclers
  FOR EACH ROW
  EXECUTE FUNCTION update_rejected_recyclers_updated_at();

-- Payment summaries trigger
DROP TRIGGER IF EXISTS update_payment_summaries_updated_at ON payment_summaries;
CREATE TRIGGER update_payment_summaries_updated_at
    BEFORE UPDATE ON payment_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Notifications trigger
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Waste collections trigger
DROP TRIGGER IF EXISTS update_waste_collections_updated_at ON waste_collections;
CREATE TRIGGER update_waste_collections_updated_at
    BEFORE UPDATE ON waste_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. CREATE VIEWS
-- =====================================================

-- Unread message counts view
CREATE OR REPLACE VIEW unread_message_counts AS
SELECT 
    pickup_id,
    sender_id,
    COUNT(*) as unread_count
FROM chat_messages 
WHERE is_read = FALSE 
GROUP BY pickup_id, sender_id;

-- Customer rejected recyclers view
CREATE OR REPLACE VIEW customer_rejected_recyclers AS
SELECT 
  customer_id,
  recycler_id,
  COUNT(*) as rejection_count,
  MAX(rejected_at) as last_rejected_at,
  STRING_AGG(DISTINCT rejection_reason, '; ') as rejection_reasons
FROM rejected_recyclers
GROUP BY customer_id, recycler_id;

-- =====================================================
-- 10. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rejected_recyclers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycler_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. CREATE RLS POLICIES
-- =====================================================

-- Chat messages policies
DROP POLICY IF EXISTS "Users can view messages for their pickups" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages for their pickups" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;

CREATE POLICY "Users can view messages for their pickups" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE id = pickup_id 
            AND (customer_id = auth.uid() OR recycler_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages for their pickups" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE id = pickup_id 
            AND (customer_id = auth.uid() OR recycler_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Rejected recyclers policies
DROP POLICY IF EXISTS "Users can view their own rejections" ON rejected_recyclers;
DROP POLICY IF EXISTS "Authenticated users can insert rejections" ON rejected_recyclers;
DROP POLICY IF EXISTS "Customers can update their rejections" ON rejected_recyclers;
DROP POLICY IF EXISTS "Customers can delete their rejections" ON rejected_recyclers;

CREATE POLICY "Users can view their own rejections" ON rejected_recyclers
  FOR SELECT USING (
    auth.uid() = customer_id OR auth.uid() = recycler_id
  );

CREATE POLICY "Authenticated users can insert rejections" ON rejected_recyclers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Customers can update their rejections" ON rejected_recyclers
  FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Customers can delete their rejections" ON rejected_recyclers
  FOR DELETE USING (auth.uid() = customer_id);

-- Payment summaries policies
DROP POLICY IF EXISTS "Users can view their payment summaries" ON payment_summaries;
DROP POLICY IF EXISTS "Recyclers can create payment summaries" ON payment_summaries;
DROP POLICY IF EXISTS "Users can update their payment summaries" ON payment_summaries;

CREATE POLICY "Users can view their payment summaries" ON payment_summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM waste_collections 
      WHERE id = request_id 
      AND (customer_id = auth.uid() OR recycler_id = auth.uid())
    )
  );

CREATE POLICY "Recyclers can create payment summaries" ON payment_summaries
  FOR INSERT WITH CHECK (auth.uid() = recycler_id);

CREATE POLICY "Users can update their payment summaries" ON payment_summaries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM waste_collections 
      WHERE id = request_id 
      AND (customer_id = auth.uid() OR recycler_id = auth.uid())
    )
  );

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;

CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Recycler profiles policies
DROP POLICY IF EXISTS "Recyclers can view their own profile" ON recycler_profiles;
DROP POLICY IF EXISTS "Recyclers can insert their own profile" ON recycler_profiles;
DROP POLICY IF EXISTS "Recyclers can update their own profile" ON recycler_profiles;
DROP POLICY IF EXISTS "Public can view available recycler profiles" ON recycler_profiles;

CREATE POLICY "Recyclers can view their own profile" ON recycler_profiles
  FOR SELECT USING (auth.uid() = recycler_id);

CREATE POLICY "Recyclers can insert their own profile" ON recycler_profiles
  FOR INSERT WITH CHECK (auth.uid() = recycler_id);

CREATE POLICY "Recyclers can update their own profile" ON recycler_profiles
  FOR UPDATE USING (auth.uid() = recycler_id);

CREATE POLICY "Public can view available recycler profiles" ON recycler_profiles
  FOR SELECT USING (is_available = true);

-- =====================================================
-- 12. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on all tables
GRANT SELECT, INSERT, UPDATE ON chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rejected_recyclers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payment_summaries TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON recycler_profiles TO authenticated;

-- Grant permissions on views
GRANT SELECT ON unread_message_counts TO authenticated;
GRANT SELECT ON customer_rejected_recyclers TO authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_available_recyclers_excluding_rejected(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;

-- =====================================================
-- 13. VERIFY MIGRATION
-- =====================================================

-- Show all tables created/updated
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('chat_messages', 'rejected_recyclers', 'payment_summaries', 'notifications', 'recycler_profiles')
ORDER BY tablename;

-- Show chat_messages structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
ORDER BY ordinal_position;

-- Show functions created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_available_recyclers_excluding_rejected', 'mark_messages_as_read')
ORDER BY routine_name;

COMMIT;
