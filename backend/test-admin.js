require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Supabase Admin Client...');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📊 Project URL:', supabaseUrl);
console.log('🔑 Service Key:', supabaseServiceKey ? 'SET' : 'NOT SET');

if (!supabaseServiceKey) {
  console.error('❌ SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminAccess() {
  try {
    console.log('🔄 Testing admin database access...');
    
    // Try to insert a test record
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: crypto.randomUUID(), // Use proper UUID format
        email: 'test@admin.com',
        username: 'testadmin',
        role: 'customer',
        email_verified: false
      })
      .select();

    if (error) {
      console.error('❌ Admin insert error:', error);
    } else {
      console.log('✅ Admin insert successful:', data);
    }

    // Try to read from the table
    const { data: readData, error: readError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);

    if (readError) {
      console.error('❌ Admin read error:', readError);
    } else {
      console.log('✅ Admin read successful:', readData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminAccess(); 