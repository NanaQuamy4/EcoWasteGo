const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseHealth() {
  console.log('🔍 Testing database health and functionality...\n');

  const tests = [
    {
      name: 'Customers Table',
      test: () => supabase.from('customers').select('count').limit(1),
    },
    {
      name: 'Recyclers Table', 
      test: () => supabase.from('recyclers').select('count').limit(1),
    },
    {
      name: 'Pickup Requests Table',
      test: () => supabase.from('pickup_requests').select('count').limit(1),
    },
    {
      name: 'Notifications Table',
      test: () => supabase.from('notifications').select('count').limit(1),
    },
    {
      name: 'Payment Summaries Table',
      test: () => supabase.from('payment_summaries').select('count').limit(1),
    },
    {
      name: 'Subscription Fees Table',
      test: () => supabase.from('subscription_fees').select('count').limit(1),
    },
    {
      name: 'User Push Tokens Table',
      test: () => supabase.from('user_push_tokens').select('count').limit(1),
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const { data, error } = await test.test();
      if (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      } else {
        console.log(`✅ ${test.name}: OK`);
        passedTests++;
      }
    } catch (err) {
      console.log(`❌ ${test.name}: ${err.message}`);
    }
  }

  console.log(`\n📊 Database Health: ${passedTests}/${totalTests} tests passed`);

  // Test key database functions
  console.log('\n🔧 Testing database functions...');
  
  const functionTests = [
    {
      name: 'get_recycler_total_earnings',
      test: () => supabase.rpc('get_recycler_total_earnings', { p_recycler_id: '00000000-0000-0000-0000-000000000000' }),
    },
    {
      name: 'get_customer_total_stats', 
      test: () => supabase.rpc('get_customer_total_stats', { p_customer_id: '00000000-0000-0000-0000-000000000000' }),
    },
    {
      name: 'can_customer_place_request',
      test: () => supabase.rpc('can_customer_place_request', { p_customer_id: '00000000-0000-0000-0000-000000000000' }),
    }
  ];

  let passedFunctions = 0;
  let totalFunctions = functionTests.length;

  for (const test of functionTests) {
    try {
      const { data, error } = await test.test();
      if (error && error.code === 'PGRST204') {
        console.log(`✅ ${test.name}: Function exists (expected error for test data)`);
        passedFunctions++;
      } else if (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      } else {
        console.log(`✅ ${test.name}: OK`);
        passedFunctions++;
      }
    } catch (err) {
      console.log(`❌ ${test.name}: ${err.message}`);
    }
  }

  console.log(`\n📊 Database Functions: ${passedFunctions}/${totalFunctions} tests passed`);

  // Overall health score
  const overallScore = Math.round(((passedTests + passedFunctions) / (totalTests + totalFunctions)) * 100);
  console.log(`\n🎯 Overall Database Health: ${overallScore}%`);

  if (overallScore >= 90) {
    console.log('🟢 Database is in excellent health!');
  } else if (overallScore >= 70) {
    console.log('🟡 Database is in good health with minor issues');
  } else {
    console.log('🔴 Database has significant issues that need attention');
  }

  return overallScore >= 70;
}

testDatabaseHealth()
  .then((healthy) => {
    if (healthy) {
      console.log('\n✅ Database health check completed successfully!');
    } else {
      console.log('\n❌ Database health check failed - issues detected');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Database health check error:', error);
    process.exit(1);
  });
