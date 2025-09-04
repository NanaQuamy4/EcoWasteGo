const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotificationType() {
  try {
    console.log('🧪 Testing recycler_started_navigation notification type...');
    
    // Get a test user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user found');
      return;
    }
    
    // Try to insert a notification with the new type
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'recycler_started_navigation',
        title: '🚛 Recycler is on the way!',
        message: 'Your recycler has started navigation and is heading to your pickup location.',
        priority: 'high'
      })
      .select();
    
    if (error) {
      console.error('❌ Error inserting notification:', error);
      
      // If it's a constraint error, we need to add the type to the database
      if (error.code === '23514' && error.message.includes('notifications_type_check')) {
        console.log('🔧 The notification type needs to be added to the database constraint.');
        console.log('📋 Please run the SQL script: database/fixes/add_notification_type_simple.sql');
        console.log('💡 Or manually add "recycler_started_navigation" to the notifications_type_check constraint.');
      }
    } else {
      console.log('✅ Notification inserted successfully!');
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

testNotificationType();
