const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRoleBasedSystem() {
  console.log('🧪 Testing Role-Based System...\n');

  try {
    // 1. Test if new columns exist
    console.log('1️⃣ Checking if new columns exist...');
    const { data: columns, error: columnsError } = await supabase
      .from('users')
      .select('role, status, verification_status, company_name')
      .limit(1);

    if (columnsError) {
      console.log('❌ New columns not found. Please run the database migration first.');
      console.log('📋 Copy and paste the SQL from role-based-migration.sql into your Supabase SQL Editor');
      return;
    }

    console.log('✅ New columns exist!');

    // 2. Test creating a customer user
    console.log('\n2️⃣ Testing customer registration...');
    const testCustomerEmail = `test-customer-${Date.now()}@example.com`;
    
    const { data: customerAuth, error: customerAuthError } = await supabase.auth.admin.createUser({
      email: testCustomerEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: { role: 'customer' }
    });

    if (customerAuthError) {
      console.log('❌ Customer creation failed:', customerAuthError.message);
    } else {
      console.log('✅ Customer user created successfully');
      
      // Create customer profile
      const { data: customerProfile, error: customerProfileError } = await supabase
        .from('users')
        .insert([{
          id: customerAuth.user.id,
          email: testCustomerEmail,
          role: 'customer',
          status: 'active',
          verification_status: undefined,
          email_verified: true,
          onboarding_completed: false,
          privacy_policy_accepted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (customerProfileError) {
        console.log('❌ Customer profile creation failed:', customerProfileError.message);
      } else {
        console.log('✅ Customer profile created successfully');
      }
    }

    // 3. Test creating a recycler user
    console.log('\n3️⃣ Testing recycler registration...');
    const testRecyclerEmail = `test-recycler-${Date.now()}@example.com`;
    
    const { data: recyclerAuth, error: recyclerAuthError } = await supabase.auth.admin.createUser({
      email: testRecyclerEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: { role: 'recycler' }
    });

    if (recyclerAuthError) {
      console.log('❌ Recycler creation failed:', recyclerAuthError.message);
    } else {
      console.log('✅ Recycler user created successfully');
      
      // Create recycler profile
      const { data: recyclerProfile, error: recyclerProfileError } = await supabase
        .from('users')
        .insert([{
          id: recyclerAuth.user.id,
          email: testRecyclerEmail,
          role: 'recycler',
          status: 'active',
          verification_status: 'unverified',
          company_name: 'Test Recycling Company',
          business_location: 'Kumasi, Ghana',
          areas_of_operation: 'Kumasi Central, Adum',
          available_resources: '2 trucks, 1 van',
          email_verified: true,
          onboarding_completed: false,
          privacy_policy_accepted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (recyclerProfileError) {
        console.log('❌ Recycler profile creation failed:', recyclerProfileError.message);
      } else {
        console.log('✅ Recycler profile created successfully');
      }
    }

    // 4. Test the views
    console.log('\n4️⃣ Testing database views...');
    
    const { data: verifiedRecyclers, error: verifiedError } = await supabase
      .from('verified_recyclers')
      .select('*');

    if (verifiedError) {
      console.log('❌ Verified recyclers view error:', verifiedError.message);
    } else {
      console.log(`✅ Verified recyclers view works: ${verifiedRecyclers.length} recyclers found`);
    }

    const { data: pendingRecyclers, error: pendingError } = await supabase
      .from('pending_recyclers')
      .select('*');

    if (pendingError) {
      console.log('❌ Pending recyclers view error:', pendingError.message);
    } else {
      console.log(`✅ Pending recyclers view works: ${pendingRecyclers.length} recyclers found`);
    }

    console.log('\n🎉 Role-based system test completed!');
    console.log('📱 You can now test the app with the new role-based flow:');
    console.log('   1. Open the app');
    console.log('   2. Go through onboarding');
    console.log('   3. Choose "Customer" or "Recycler" role');
    console.log('   4. Register with the chosen role');
    console.log('   5. Test the different experiences');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRoleBasedSystem(); 