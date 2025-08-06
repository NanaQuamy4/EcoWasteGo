require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Access to Other Tables...');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testOtherTables() {
  try {
    console.log('🔄 Testing access to different tables...');
    
    // Test waste_collections table
    console.log('📦 Testing waste_collections table...');
    const { data: wasteData, error: wasteError } = await supabaseAdmin
      .from('waste_collections')
      .select('*')
      .limit(1);

    if (wasteError) {
      console.error('❌ waste_collections error:', wasteError);
    } else {
      console.log('✅ waste_collections accessible');
    }

    // Test payments table
    console.log('💰 Testing payments table...');
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .limit(1);

    if (paymentError) {
      console.error('❌ payments error:', paymentError);
    } else {
      console.log('✅ payments accessible');
    }

    // Test if we can create a simple test table
    console.log('🧪 Testing if we can create a test table...');
    const { data: createData, error: createError } = await supabaseAdmin
      .rpc('exec_sql', { sql: 'CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name TEXT)' });

    if (createError) {
      console.error('❌ Create table error:', createError);
    } else {
      console.log('✅ Can create tables');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOtherTables(); 