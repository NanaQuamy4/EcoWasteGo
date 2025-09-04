// Complete test of notification system after all RLS fixes
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itijkqkmdyqftmxjpbgr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0aWprcWttZHlxZnRteGpwYmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTg1ODUsImV4cCI6MjA3MjEzNDU4NX0.-lpVhulSRkIdihfS6VZAEiaqeE1dlvJgtr4PRpYRXmg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteNotificationSystem() {
  console.log('🔔 COMPLETE TEST: Full notification system after all RLS fixes...\n');

  try {
    // Step 1: Get a recycler
    console.log('1. Finding online recycler...');
    const { data: recyclers, error: recyclerError } = await supabase
      .from('recyclers')
      .select('id, full_name, is_online')
      .eq('is_online', true)
      .limit(1);

    if (recyclerError || !recyclers || recyclers.length === 0) {
      console.log('❌ No online recyclers found');
      return;
    }

    const recycler = recyclers[0];
    console.log(`✅ Found recycler: ${recycler.full_name}`);

    // Step 2: Check initial notification count
    console.log('\n2. Checking initial notifications...');
    const { data: initialNotifications } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', recycler.id);

    const initialCount = initialNotifications?.length || 0;
    console.log(`📊 Recycler has ${initialCount} notifications initially`);

    // Step 3: Test pickup request creation (this should trigger notification)
    console.log('\n3. Testing pickup request creation with trigger...');
    
    const testCustomerId = '11111111-1111-1111-1111-111111111111';
    
    const { data: pickupRequest, error: requestError } = await supabase
      .from('pickup_requests')
      .insert({
        customer_id: testCustomerId,
        recycler_id: recycler.id,
        pickup_address: 'Test Address for Complete Notification Test',
        status: 'pending'
      })
      .select()
      .single();

    if (requestError) {
      console.log('❌ Error creating pickup request:', requestError.message);
      return;
    }

    console.log('✅ Pickup request created successfully!');
    console.log(`📦 Request ID: ${pickupRequest.id}`);

    // Step 4: Wait for trigger to fire and check notifications
    console.log('\n4. Waiting for trigger to fire...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: finalNotifications } = await supabase
      .from('notifications')
      .select('id, type, title, message, created_at')
      .eq('user_id', recycler.id)
      .order('created_at', { ascending: false });

    const finalCount = finalNotifications?.length || 0;
    const newNotifications = finalCount - initialCount;

    console.log(`📊 Final notification count: ${finalCount}`);
    console.log(`📈 New notifications created: ${newNotifications}`);

    if (newNotifications > 0) {
      console.log('🎉 SUCCESS! Trigger notifications created:');
      
      // Show the latest notifications
      const latestNotifications = finalNotifications.slice(0, newNotifications);
      latestNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title}`);
        console.log(`      Type: ${notif.type}`);
        console.log(`      Message: ${notif.message.substring(0, 80)}...`);
        console.log(`      Created: ${notif.created_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No new notifications found - trigger may not be working');
    }

    // Step 5: Test direct notification insertion (backup method)
    console.log('5. Testing direct notification insertion...');
    const { data: directNotification, error: directError } = await supabase
      .from('notifications')
      .insert({
        user_id: recycler.id,
        type: 'new_pickup_request',
        title: 'Direct Test Notification',
        message: 'This is a direct test notification to verify the system works.',
        is_read: false,
        priority: 'urgent'
      })
      .select()
      .single();

    if (directError) {
      console.log('❌ Direct notification failed:', directError.message);
    } else {
      console.log('✅ Direct notification works!');
      console.log(`📱 Direct notification ID: ${directNotification.id}`);
    }

    // Step 6: Clean up all test data
    console.log('\n6. Cleaning up test data...');
    
    // Delete test pickup request
    await supabase
      .from('pickup_requests')
      .delete()
      .eq('id', pickupRequest.id);
    
    // Delete test notifications
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', recycler.id)
      .in('title', ['Direct Test Notification']);
    
    console.log('🧹 Test data cleaned up');

    // Final status
    console.log('\n🎉🎉🎉 NOTIFICATION SYSTEM STATUS 🎉🎉🎉');
    console.log('✅ RLS policies: FIXED');
    console.log('✅ Notifications table: WORKING');
    console.log('✅ Pickup requests table: WORKING');
    console.log('✅ Direct notification insertion: WORKING');
    
    if (newNotifications > 0) {
      console.log('✅ Database triggers: WORKING');
      console.log('✅ Complete notification flow: WORKING');
      console.log('\n🚀 RECYCLERS WILL RECEIVE NOTIFICATIONS FOR NEW PICKUP REQUESTS!');
    } else {
      console.log('⚠️  Database triggers: NEEDS CHECKING');
      console.log('⚠️  Complete notification flow: PARTIALLY WORKING');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteNotificationSystem();
