const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Load environment variables manually
const fs = require('fs');
const path = require('path');

// Read .env file manually with UTF8 encoding
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();
      envVars[key] = value;
    }
  }
});

console.log('🔍 Parsed environment variables:', Object.keys(envVars));
console.log('🔍 SUPABASE_URL key exists:', 'SUPABASE_URL' in envVars);
console.log('🔍 SUPABASE_SERVICE_ROLE_KEY key exists:', 'SUPABASE_SERVICE_ROLE_KEY' in envVars);

const supabaseUrl = envVars.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Database Connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'SET' : 'NOT_SET');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  try {
    console.log('\n📊 Testing verification_attempts table...');
    
    // Check if table exists and has data
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_attempts')
      .select('*')
      .limit(5);
    
    if (verificationError) {
      console.error('❌ Error accessing verification_attempts:', verificationError);
    } else {
      console.log('✅ verification_attempts table accessible');
      console.log('📊 Records found:', verificationData?.length || 0);
      
      if (verificationData && verificationData.length > 0) {
        console.log('📋 Sample data:', verificationData[0]);
      }
    }
    
    // Check for SMS verifications specifically
    console.log('\n📱 Checking SMS verifications...');
    const { data: smsVerifications, error: smsError } = await supabase
      .from('verification_attempts')
      .select('*')
      .eq('verification_type', 'sms')
      .limit(5);
    
    if (smsError) {
      console.error('❌ Error accessing SMS verifications:', smsError);
    } else {
      console.log('✅ SMS verifications found:', smsVerifications?.length || 0);
      
      if (smsVerifications && smsVerifications.length > 0) {
        console.log('📋 SMS verification data:', smsVerifications[0]);
      }
    }
    
    // Check for the specific phone number
    console.log('\n🔍 Checking for phone number: +233546732719');
    const { data: phoneVerifications, error: phoneError } = await supabase
      .from('verification_attempts')
      .select('*')
      .eq('contact_info', '+233546732719')
      .eq('verification_type', 'sms');
    
    if (phoneError) {
      console.error('❌ Error checking phone verifications:', phoneError);
    } else {
      console.log('✅ Phone verifications found:', phoneVerifications?.length || 0);
      
      if (phoneVerifications && phoneVerifications.length > 0) {
        phoneVerifications.forEach((v, i) => {
          console.log(`📱 Verification ${i + 1}:`, {
            id: v.id,
            code: v.verification_code,
            successful: v.is_successful,
            verified_at: v.verified_at,
            expires_at: v.expires_at
          });
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Database test failed:', error);
  }
}

testDatabase();
