const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test SMS verification flow
async function testSMSVerification() {
  console.log('🧪 Testing SMS Verification Flow...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Check if verification_attempts table exists
    console.log('1️⃣ Checking if verification_attempts table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('verification_attempts')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('❌ Table check error:', tableError.message);
      console.log('🔧 You may need to run the SMS verification migration script');
      return;
    }
    console.log('✅ verification_attempts table exists');

    // 2. Check what's in the table
    console.log('\n2️⃣ Checking verification_attempts table contents...');
    const { data: allVerifications, error: allError } = await supabase
      .from('verification_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.error('❌ Error fetching verifications:', allError.message);
    } else {
      console.log(`📊 Found ${allVerifications.length} verification records:`);
      allVerifications.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.contact_info} (${v.verification_type}) - Success: ${v.is_successful} - Created: ${v.created_at}`);
      });
    }

    // 3. Test phone number formatting
    console.log('\n3️⃣ Testing phone number formatting...');
    const testPhone = '546732719';
    
    // Simulate the formatPhoneNumber logic
    let cleaned = testPhone.replace(/\D/g, '');
    if (cleaned.length === 9) {
      cleaned = '233' + cleaned;
    }
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    console.log(`   Original: ${testPhone}`);
    console.log(`   Formatted: ${cleaned}`);

    // 4. Check for specific phone verification
    console.log('\n4️⃣ Checking for specific phone verification...');
    const { data: phoneVerifications, error: phoneError } = await supabase
      .from('verification_attempts')
      .select('*')
      .eq('contact_info', cleaned)
      .eq('verification_type', 'sms')
      .order('created_at', { ascending: false });

    if (phoneError) {
      console.error('❌ Error checking phone verifications:', phoneError.message);
    } else {
      console.log(`📱 Found ${phoneVerifications.length} verification records for ${cleaned}:`);
      phoneVerifications.forEach((v, i) => {
        console.log(`   ${i + 1}. Success: ${v.is_successful} - Verified: ${v.verified_at} - Created: ${v.created_at}`);
      });
    }

    // 5. Check if there are any successful verifications
    console.log('\n5️⃣ Checking for successful verifications...');
    const { data: successfulVerifications, error: successError } = await supabase
      .from('verification_attempts')
      .select('*')
      .eq('verification_type', 'sms')
      .eq('is_successful', true)
      .order('verified_at', { ascending: false });

    if (successError) {
      console.error('❌ Error checking successful verifications:', successError.message);
    } else {
      console.log(`✅ Found ${successfulVerifications.length} successful SMS verifications:`);
      successfulVerifications.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.contact_info} - Verified: ${v.verified_at}`);
      });
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testSMSVerification();

