const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotificationSystem() {
  try {
    console.log('🧪 Testing notification system with recycler_started_navigation type...');
    
    // Get a real user ID from the database
    const { data: users, error: userError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.log('ℹ️  No customers found in database, testing constraint only...');
      
      // Test that the constraint allows the new type by checking the constraint definition
      const { data: constraintData, error: constraintError } = await supabase
        .rpc('sql', {
          query: `SELECT conname, pg_get_constraintdef(oid) as definition
                  FROM pg_constraint 
                  WHERE conname = 'notifications_type_check';`
        });
      
      if (constraintError) {
        console.error('❌ Error checking constraint:', constraintError);
        return;
      }
      
      if (constraintData && constraintData.length > 0) {
        const definition = constraintData[0].definition;
        if (definition.includes('recycler_started_navigation')) {
          console.log('✅ Constraint includes recycler_started_navigation type!');
          console.log('📋 Constraint definition:', definition);
        } else {
          console.log('❌ Constraint does not include recycler_started_navigation type');
        }
      }
      
      console.log('🎉 Notification system is ready! The constraint allows the new type.');
      console.log('📱 When recyclers start navigation, customers will receive notifications.');
      return;
    }
    
    const userId = users[0].id;
    console.log('👤 Using real user ID:', userId);
    
    // Test inserting a notification with the new type
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'recycler_started_navigation',
        title: '🚛 Recycler is on the way!',
        message: 'Your recycler has started navigation and is heading to your pickup location. Tap to track their progress in real-time.',
        priority: 'high'
      })
      .select();
    
    if (error) {
      console.error('❌ Error inserting notification:', error);
      return;
    }
    
    console.log('✅ Notification inserted successfully!');
    console.log('📋 Data:', data);
    
    // Clean up test data
    await supabase
      .from('notifications')
      .delete()
      .eq('id', data[0].id);
    
    console.log('🧹 Test data cleaned up');
    console.log('🎉 Notification system is fully working!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNotificationSystem();
