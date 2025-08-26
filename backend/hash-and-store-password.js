const bcrypt = require('bcryptjs');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function hashAndStorePassword() {
  try {
    console.log('🔐 Migrating to database-only authentication...');
    
    // Get the original password from user input
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Ask for the original password
    const originalPassword = await new Promise((resolve) => {
      rl.question('🔑 Enter your original password: ', (password) => {
        rl.close();
        resolve(password);
      });
    });
    
    if (!originalPassword) {
      console.error('❌ No password provided');
      process.exit(1);
    }
    
    console.log('🔐 Original password received, hashing...');
    
    // Hash the password with bcrypt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(originalPassword, saltRounds);
    
    console.log('✅ Password hashed successfully');
    console.log('🔑 Hash:', hashedPassword.substring(0, 20) + '...');
    
    // Update the customer account with the hashed password
    console.log('💾 Storing hashed password in database...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('customers')
      .update({ password_hash: hashedPassword })
      .eq('email', 'nanaquamy4@gmail.com')
      .select();
    
    if (updateError) {
      console.error('❌ Error updating password:', updateError);
      process.exit(1);
    }
    
    console.log('✅ Password stored successfully in database');
    console.log('📧 Email:', 'nanaquamy4@gmail.com');
    console.log('🔑 Password: [your original password]');
    console.log('🔐 Hash stored: [bcrypt hash]');
    
    // Also update recycler account if it exists
    const { data: recyclerUpdate, error: recyclerError } = await supabase
      .from('recyclers')
      .update({ password_hash: hashedPassword })
      .eq('phone', '546732719')
      .select();
    
    if (recyclerError) {
      console.log('ℹ️ No recycler account found with that phone (this is normal)');
    } else {
      console.log('✅ Recycler password also updated');
    }
    
    console.log('\n🎉 Migration complete!');
    console.log('📱 You can now login with:');
    console.log('   Phone: 546732719');
    console.log('   Password: [your original password]');
    console.log('   Role: customer (or recycler if you have both)');
    console.log('\n🔐 Authentication is now 100% database-based');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

hashAndStorePassword();



