require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testDatabaseComprehensive() {
  console.log('🔍 Comprehensive Database Test\n');
  console.log('=' .repeat(50));

  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`GOOGLE_MAPS_API_KEY: ${process.env.GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Missing'}`);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('\n❌ Missing required environment variables!');
    return;
  }

  try {
    console.log('\n🔄 Creating Supabase client...');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('✅ Supabase client created');
    console.log(`📊 Project URL: ${process.env.SUPABASE_URL}`);

    // Test network connectivity
    console.log('\n🌐 Testing network connectivity...');
    try {
      const response = await fetch(process.env.SUPABASE_URL);
      console.log(`✅ Network connectivity to Supabase: ${response.status} ${response.statusText}`);
    } catch (networkError) {
      console.log('❌ Network connectivity failed:', networkError.message);
      console.log('💡 This might be due to:');
      console.log('   - Internet connection issues');
      console.log('   - Firewall blocking the connection');
      console.log('   - Supabase service being down');
      return;
    }

    // Test basic database connection
    console.log('\n🗄️ Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database connection error:', error.message);
      console.log('💡 Possible issues:');
      console.log('   - Database schema not deployed');
      console.log('   - RLS policies blocking access');
      console.log('   - Invalid API keys');
      return;
    }

    console.log('✅ Database connection successful!');

    // Test table existence
    console.log('\n📋 Testing table existence...');
    const tables = [
      'users',
      'waste_collections',
      'payments',
      'payment_summaries',
      'weight_entries',
      'recycler_profiles',
      'customer_preferences',
      'notifications',
      'eco_impact',
      'tracking_sessions',
      'recycler_registrations',
      'request_rejections',
      'email_verifications',
      'chat_messages',
      'rewards',
      'achievements',
      'user_achievements',
      'reviews',
      'support_tickets',
      'support_messages'
    ];

    let existingTables = 0;
    let missingTables = 0;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
          missingTables++;
        } else {
          console.log(`✅ Table '${table}' exists`);
          existingTables++;
        }
      } catch (err) {
        console.log(`❌ Error accessing '${table}': ${err.message}`);
        missingTables++;
      }
    }

    console.log(`\n📊 Table Summary:`);
    console.log(`✅ Existing tables: ${existingTables}`);
    console.log(`❌ Missing tables: ${missingTables}`);
    console.log(`📋 Total expected: ${tables.length}`);

    if (missingTables > 0) {
      console.log('\n⚠️ Some tables are missing. You may need to:');
      console.log('   1. Deploy the database schema');
      console.log('   2. Check if all tables were created');
      console.log('   3. Verify RLS policies');
    }

    // Test CRUD operations
    console.log('\n🔄 Testing CRUD operations...');
    
    // Test user creation
    const testUser = {
      email: 'test-db@ecowastego.com',
      full_name: 'Database Test User',
      phone: '+1234567890',
      role: 'customer',
      created_at: new Date().toISOString()
    };

    console.log('📝 Testing INSERT operation...');
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([testUser])
      .select();

    if (insertError) {
      console.log('❌ INSERT test failed:', insertError.message);
    } else {
      console.log('✅ INSERT test successful');
      const userId = insertData[0].id;

      // Test SELECT operation
      console.log('👀 Testing SELECT operation...');
      const { data: selectData, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (selectError) {
        console.log('❌ SELECT test failed:', selectError.message);
      } else {
        console.log('✅ SELECT test successful');
      }

      // Test UPDATE operation
      console.log('✏️ Testing UPDATE operation...');
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ full_name: 'Updated Test User' })
        .eq('id', userId)
        .select();

      if (updateError) {
        console.log('❌ UPDATE test failed:', updateError.message);
      } else {
        console.log('✅ UPDATE test successful');
      }

      // Test DELETE operation
      console.log('🗑️ Testing DELETE operation...');
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.log('❌ DELETE test failed:', deleteError.message);
      } else {
        console.log('✅ DELETE test successful');
      }
    }

    // Test authentication
    console.log('\n🔐 Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test-auth@ecowastego.com',
      password: 'testpassword123'
    });

    if (authError) {
      console.log('❌ Authentication test failed:', authError.message);
    } else {
      console.log('✅ Authentication test successful');
    }

    console.log('\n🎉 Comprehensive database test completed!');
    console.log('✅ Database is ready for use');

  } catch (error) {
    console.error('\n❌ Database test failed:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify Supabase project is active');
    console.log('   3. Ensure API keys are correct');
    console.log('   4. Check if database schema is deployed');
  }
}

testDatabaseComprehensive(); 