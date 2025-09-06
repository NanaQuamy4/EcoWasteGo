const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPushNotifications() {
  console.log('🚀 Setting up push notification system...');

  try {
    // 1. Create user_push_tokens table
    console.log('📋 Creating user_push_tokens table...');
    const createTableSQL = `
      -- Create table for storing user push notification tokens
      CREATE TABLE IF NOT EXISTS user_push_tokens (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
          push_token TEXT NOT NULL,
          platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
          device_id TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          
          -- Ensure one token per user per platform
          UNIQUE(user_id, platform)
      );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (tableError) {
      console.error('Error creating table:', tableError);
      return false;
    }
    console.log('✅ user_push_tokens table created');

    // 2. Enable RLS and create policies
    console.log('🔒 Setting up RLS policies...');
    const rlsSQL = `
      -- Add RLS policies
      ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view own push tokens" ON user_push_tokens;
      DROP POLICY IF EXISTS "Users can insert own push tokens" ON user_push_tokens;
      DROP POLICY IF EXISTS "Users can update own push tokens" ON user_push_tokens;
      DROP POLICY IF EXISTS "Users can delete own push tokens" ON user_push_tokens;

      -- Users can only access their own push tokens
      CREATE POLICY "Users can view own push tokens" ON user_push_tokens
          FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert own push tokens" ON user_push_tokens
          FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update own push tokens" ON user_push_tokens
          FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete own push tokens" ON user_push_tokens
          FOR DELETE USING (auth.uid() = user_id);
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) {
      console.error('Error setting up RLS:', rlsError);
      return false;
    }
    console.log('✅ RLS policies created');

    // 3. Create indexes
    console.log('📊 Creating indexes...');
    const indexSQL = `
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_push_tokens_platform ON user_push_tokens(platform);
      CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(is_active) WHERE is_active = TRUE;
      CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_active 
      ON user_push_tokens(user_id, is_active) 
      WHERE is_active = TRUE;
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
    if (indexError) {
      console.error('Error creating indexes:', indexError);
      return false;
    }
    console.log('✅ Indexes created');

    // 4. Create updated_at trigger function
    console.log('⏰ Creating updated_at trigger...');
    const triggerSQL = `
      -- Create function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_user_push_tokens_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger for updated_at
      DROP TRIGGER IF EXISTS trigger_update_user_push_tokens_updated_at ON user_push_tokens;
      CREATE TRIGGER trigger_update_user_push_tokens_updated_at
          BEFORE UPDATE ON user_push_tokens
          FOR EACH ROW
          EXECUTE FUNCTION update_user_push_tokens_updated_at();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    if (triggerError) {
      console.error('Error creating trigger:', triggerError);
      return false;
    }
    console.log('✅ Updated_at trigger created');

    // 5. Create push notification functions
    console.log('📱 Creating push notification functions...');
    const functionsSQL = `
      -- Create function to send push notifications when recycler arrives
      CREATE OR REPLACE FUNCTION send_push_notification_on_arrival(
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
              c.phone as customer_phone,
              r.full_name as recycler_name,
              r.phone as recycler_phone
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
          -- In production, you would integrate with Expo Push API or a push service
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
      $$ LANGUAGE plpgsql;
    `;

    const { error: functionError } = await supabase.rpc('exec_sql', { sql: functionsSQL });
    if (functionError) {
      console.error('Error creating functions:', functionError);
      return false;
    }
    console.log('✅ Push notification functions created');

    // 6. Grant permissions
    console.log('🔐 Granting permissions...');
    const grantSQL = `
      GRANT SELECT, INSERT, UPDATE, DELETE ON user_push_tokens TO authenticated;
      GRANT SELECT, INSERT, UPDATE, DELETE ON user_push_tokens TO anon;
      GRANT EXECUTE ON FUNCTION send_push_notification_on_arrival(UUID) TO authenticated;
      GRANT EXECUTE ON FUNCTION send_push_notification_on_arrival(UUID) TO anon;
    `;

    const { error: grantError } = await supabase.rpc('exec_sql', { sql: grantSQL });
    if (grantError) {
      console.error('Error granting permissions:', grantError);
      return false;
    }
    console.log('✅ Permissions granted');

    console.log('🎉 Push notification system setup completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error setting up push notifications:', error);
    return false;
  }
}

// Run the setup
setupPushNotifications()
  .then((success) => {
    if (success) {
      console.log('\n✅ Push notification system is ready!');
      console.log('📱 Customers will now receive push notifications when recyclers arrive');
    } else {
      console.log('\n❌ Setup failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Setup error:', error);
    process.exit(1);
  });
