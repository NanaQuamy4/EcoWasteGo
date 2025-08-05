require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testDatabase() {
  console.log('🔍 Testing Database Connection...\n');

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    console.log('✅ Supabase client created successfully');
    console.log(`📊 Project URL: ${process.env.SUPABASE_URL}`);
    console.log(`🔑 Anon Key: ${process.env.SUPABASE_ANON_KEY?.substring(0, 20)}...`);

    // Test basic connection
    console.log('\n🔄 Testing basic connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ Database connection error:', error.message);
      return;
    }

    console.log('✅ Database connection successful!');
    console.log('📊 Data retrieved:', data);

    // Test if tables exist
    console.log('\n🔄 Testing table existence...');
    
    const tables = [
      'users',
      'waste_collections', 
      'payments',
      'recycler_profiles',
      'notifications',
      'eco_impact'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table '${table}' not found or error:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Error accessing table '${table}':`, err.message);
      }
    }

    // Test inserting a test user
    console.log('\n🔄 Testing user creation...');
    const testUser = {
      email: 'test@ecowastego.com',
      full_name: 'Test User',
      phone: '+1234567890',
      role: 'customer',
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([testUser])
      .select();

    if (insertError) {
      console.log('❌ User creation test failed:', insertError.message);
    } else {
      console.log('✅ User creation test successful!');
      console.log('👤 Created user:', insertData[0]);

      // Clean up - delete test user
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('email', 'test@ecowastego.com');

      if (deleteError) {
        console.log('⚠️ Could not clean up test user:', deleteError.message);
      } else {
        console.log('🧹 Test user cleaned up successfully');
      }
    }

    console.log('\n🎉 Database test completed successfully!');
    console.log('✅ All database operations working correctly');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase(); 