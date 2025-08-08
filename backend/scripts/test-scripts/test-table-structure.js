require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Table Structure and Permissions...');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testTableStructure() {
  try {
    console.log('🔄 Testing table structure...');
    
    // Try to get table info
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(0);

    if (tableError) {
      console.error('❌ Table access error:', tableError);
    } else {
      console.log('✅ Table accessible');
    }

    // Try to check if table exists
    const { data: columns, error: columnError } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'users' });

    if (columnError) {
      console.log('❌ Column info error:', columnError);
      console.log('🔄 Trying alternative approach...');
      
      // Try a simple select to see what happens
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, username')
        .limit(1);
      
      if (error) {
        console.error('❌ Simple select error:', error);
      } else {
        console.log('✅ Simple select works:', data);
      }
    } else {
      console.log('✅ Column info:', columns);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTableStructure(); 