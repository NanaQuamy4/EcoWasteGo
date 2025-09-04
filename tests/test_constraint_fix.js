const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConstraint() {
  try {
    console.log('🔍 Checking if recycler_started_navigation type is allowed...');
    
    // Try to insert a test notification with the new type
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        type: 'recycler_started_navigation',
        title: 'Test Notification',
        message: 'Testing the new notification type',
        priority: 'high'
      })
      .select();
    
    if (error) {
      console.error('❌ Error:', error.message);
      
      if (error.code === '23514' && error.message.includes('notifications_type_check')) {
        console.log('🔧 The constraint needs to be updated in the database.');
        console.log('📋 Please run this SQL in your Supabase dashboard:');
        console.log('');
        console.log('ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;');
        console.log('ALTER TABLE notifications ADD CONSTRAINT notifications_type_check');
        console.log('CHECK (type IN (');
        console.log("  'new_pickup_request',");
        console.log("  'request_sent',");
        console.log("  'request_confirmed',");
        console.log("  'request_accepted',");
        console.log("  'request_rejected',");
        console.log("  'request_cancelled',");
        console.log("  'request_completed',");
        console.log("  'recycler_started',");
        console.log("  'recycler_started_navigation',");
        console.log("  'help_response',");
        console.log("  'verification_required',");
        console.log("  'verification_approved',");
        console.log("  'verification_rejected',");
        console.log("  'general',");
        console.log("  'pickup_request',");
        console.log("  'request_status',");
        console.log("  'status_update',");
        console.log("  'notification',");
        console.log("  'alert',");
        console.log("  'message',");
        console.log("  'update',");
        console.log("  'info',");
        console.log("  'warning',");
        console.log("  'error',");
        console.log("  'success'");
        console.log('));');
        console.log('');
        console.log('Or run the SQL file: database/fixes/fix_notification_constraint_final.sql');
      }
    } else {
      console.log('✅ recycler_started_navigation type is allowed!');
      console.log('📋 Data:', data);
      
      // Clean up test data
      await supabase
        .from('notifications')
        .delete()
        .eq('id', data[0].id);
      
      console.log('🧹 Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConstraint();
