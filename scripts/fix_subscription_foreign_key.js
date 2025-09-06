const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixSubscriptionForeignKey() {
  console.log('🔧 Fixing Subscription Foreign Key Issues...\n');

  try {
    // Test connection first
    console.log('🔗 Testing connection...');
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return false;
    }
    console.log('✅ Connected to Supabase');

    console.log('\n📋 Subscription Foreign Key Fix Instructions:');
    console.log('==============================================');
    console.log('');
    console.log('Go to your Supabase dashboard SQL editor and run these commands:');
    console.log('');
    
    console.log('-- 1. Check if recyclers table exists and has correct structure');
    console.log(`SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'recyclers' AND column_name = 'id';`);
    console.log('');
    
    console.log('-- 2. Check subscription_fees table foreign key constraint');
    console.log(`SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='subscription_fees';`);
    console.log('');
    
    console.log('-- 3. If needed, fix the foreign key constraint');
    console.log(`-- Drop existing constraint if it exists
ALTER TABLE subscription_fees 
DROP CONSTRAINT IF EXISTS subscription_fees_recycler_id_fkey;

-- Recreate the constraint with proper references
ALTER TABLE subscription_fees 
ADD CONSTRAINT subscription_fees_recycler_id_fkey 
FOREIGN KEY (recycler_id) REFERENCES recyclers(id) ON DELETE CASCADE;`);
    console.log('');
    
    console.log('-- 4. Alternative: If recyclers table doesn\'t exist, create it');
    console.log(`CREATE TABLE IF NOT EXISTS recyclers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    email TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
    console.log('');
    
    console.log('-- 5. Check if recycler_earnings table exists');
    console.log(`SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'recycler_earnings' AND column_name = 'recycler_id';`);
    console.log('');
    
    console.log('-- 6. If recycler_earnings doesn\'t exist, create it');
    console.log(`CREATE TABLE IF NOT EXISTS recycler_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recycler_id UUID NOT NULL REFERENCES recyclers(id) ON DELETE CASCADE,
    request_id UUID NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
    console.log('');
    
    console.log('-- 7. Verify the fix');
    console.log(`SELECT COUNT(*) as subscription_fees_count FROM subscription_fees;
SELECT COUNT(*) as recyclers_count FROM recyclers;
SELECT COUNT(*) as recycler_earnings_count FROM recycler_earnings;`);
    console.log('');

    console.log('✅ After running these commands, your subscription system will be fixed!');
    console.log('');
    console.log('📊 Expected results:');
    console.log('- subscription_fees table will have proper foreign key constraint');
    console.log('- recyclers table will exist with correct structure');
    console.log('- recycler_earnings table will exist for fee calculations');
    console.log('- All subscription functions will work properly');

    return true;

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

fixSubscriptionForeignKey()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Subscription foreign key fix instructions completed!');
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
