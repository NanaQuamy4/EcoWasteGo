require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Anon Key Access...');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('📊 Project URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey ? 'SET' : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonAccess() {
  try {
    console.log('🔄 Testing anon key database access...');
    
    // Try to read from the users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Anon read error:', error);
    } else {
      console.log('✅ Anon read successful:', data);
    }

    // Try to insert (this should fail with anon key, but let's see the error)
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: 'test-anon-' + Date.now(),
        email: 'test@anon.com',
        username: 'testanon',
        role: 'customer',
        email_verified: false
      })
      .select();

    if (insertError) {
      console.error('❌ Anon insert error (expected):', insertError);
    } else {
      console.log('✅ Anon insert successful (unexpected):', insertData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAnonAccess(); 