const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema issues...\n');

  try {
    // Test connection first
    console.log('🔗 Testing connection...');
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return false;
    }
    console.log('✅ Connected to Supabase');

    console.log('\n📋 Database schema fix instructions:');
    console.log('');
    console.log('Go to your Supabase dashboard SQL editor and run these commands:');
    console.log('');
    
    console.log('-- Fix payment_summaries table');
    console.log(`ALTER TABLE payment_summaries 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));`);
    console.log('');
    
    console.log('-- Fix subscription_fees table');
    console.log(`ALTER TABLE subscription_fees 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;`);
    console.log('');
    
    console.log('-- Check and fix foreign key constraint');
    console.log(`-- First, check if recyclers table exists and has the right structure`);
    console.log(`SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'recyclers' AND column_name = 'id';`);
    console.log('');
    
    console.log('-- If needed, fix the foreign key constraint');
    console.log(`ALTER TABLE subscription_fees 
DROP CONSTRAINT IF EXISTS subscription_fees_recycler_id_fkey;
ALTER TABLE subscription_fees 
ADD CONSTRAINT subscription_fees_recycler_id_fkey 
FOREIGN KEY (recycler_id) REFERENCES recyclers(id) ON DELETE CASCADE;`);
    console.log('');

    console.log('-- Verify the fixes');
    console.log(`SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_summaries' AND column_name = 'payment_status';`);
    console.log('');
    console.log(`SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subscription_fees' AND column_name = 'amount';`);
    console.log('');

    console.log('✅ After running these commands, your database schema will be fixed!');
    console.log('');
    console.log('📊 Expected results:');
    console.log('- payment_summaries.payment_status column will exist');
    console.log('- subscription_fees.amount column will exist');
    console.log('- Foreign key constraints will be properly configured');

    return true;

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

fixDatabaseSchema()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Database schema fix instructions completed!');
      console.log('🔧 Please run the SQL commands in your Supabase dashboard');
    } else {
      console.log('\n❌ Failed to generate fix instructions');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
