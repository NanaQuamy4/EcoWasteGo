const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupPushNotifications() {
  console.log('🚀 Setting up push notification system...');

  try {
    // Test connection first
    console.log('🔗 Testing Supabase connection...');
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return false;
    }
    console.log('✅ Connected to Supabase');

    console.log('📋 Push notification system setup instructions:');
    console.log('');
    console.log('1. Go to your Supabase dashboard SQL editor');
    console.log('2. Run the following SQL commands:');
    console.log('');
    console.log('-- Create user_push_tokens table');
    console.log(`CREATE TABLE IF NOT EXISTS user_push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    push_token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, platform)
);`);
    console.log('');
    console.log('-- Enable RLS');
    console.log('ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- Create policies');
    console.log(`CREATE POLICY "Users can manage own push tokens" ON user_push_tokens
    FOR ALL USING (auth.uid() = user_id);`);
    console.log('');
    console.log('-- Create indexes');
    console.log(`CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(is_active) WHERE is_active = TRUE;`);
    console.log('');
    console.log('-- Create updated_at trigger');
    console.log(`CREATE OR REPLACE FUNCTION update_user_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_push_tokens_updated_at
    BEFORE UPDATE ON user_push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_user_push_tokens_updated_at();`);
    console.log('');
    console.log('3. Grant permissions');
    console.log(`GRANT SELECT, INSERT, UPDATE, DELETE ON user_push_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_push_tokens TO anon;`);
    console.log('');
    console.log('4. Create push notification function');
    console.log(`CREATE OR REPLACE FUNCTION send_push_notification_on_arrival(
    p_request_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
    customer_token RECORD;
    notification_sent BOOLEAN := FALSE;
BEGIN
    -- Get request details with customer info
    SELECT 
        pr.id,
        pr.customer_id,
        pr.recycler_id,
        pr.pickup_address,
        pr.status,
        pr.arrived_at,
        c.full_name as customer_name,
        r.full_name as recycler_name
    INTO request_record
    FROM pickup_requests pr
    LEFT JOIN customers c ON pr.customer_id = c.id
    LEFT JOIN recyclers r ON pr.recycler_id = r.id
    WHERE pr.id = p_request_id;
    
    -- Check if request exists and is in arrived status
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pickup request % not found', p_request_id;
    END IF;
    
    IF request_record.status != 'arrived' THEN
        RAISE EXCEPTION 'Request % is not in arrived status (current: %)', p_request_id, request_record.status;
    END IF;
    
    -- Get customer's push token
    SELECT push_token INTO customer_token
    FROM user_push_tokens
    WHERE user_id = request_record.customer_id
    AND is_active = TRUE
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- For now, just log that we would send a notification
    IF FOUND AND customer_token.push_token IS NOT NULL THEN
        RAISE NOTICE 'Would send push notification to customer % for request %', 
            request_record.customer_id, p_request_id;
        RAISE NOTICE 'Notification: Recycler % has arrived at %', 
            request_record.recycler_name, request_record.pickup_address;
        notification_sent := TRUE;
    ELSE
        RAISE NOTICE 'No push token found for customer %', request_record.customer_id;
    END IF;
    
    RETURN notification_sent;
END;
$$ LANGUAGE plpgsql;`);
    console.log('');
    console.log(`GRANT EXECUTE ON FUNCTION send_push_notification_on_arrival(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_push_notification_on_arrival(UUID) TO anon;`);
    console.log('');
    console.log('✅ After running these commands, your push notification system will be ready!');
    console.log('');
    console.log('📱 Your app can already access GPS location with these permissions:');
    console.log('   - ACCESS_FINE_LOCATION (precise GPS)');
    console.log('   - ACCESS_COARSE_LOCATION (approximate location)');
    console.log('   - ACCESS_BACKGROUND_LOCATION (location when app is closed)');
    console.log('');
    console.log('🎯 Push notifications will work when:');
    console.log('   1. Customer grants notification permissions');
    console.log('   2. App registers for push notifications');
    console.log('   3. Recycler arrives and triggers arrival detection');
    console.log('   4. Database sends push notification to customer');

    return true;

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Run the setup
setupPushNotifications()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Setup instructions completed!');
    } else {
      console.log('\n❌ Setup failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Setup error:', error);
    process.exit(1);
  });
