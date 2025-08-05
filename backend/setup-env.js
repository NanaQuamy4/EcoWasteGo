const fs = require('fs');

console.log('🔧 EcoWasteGo Environment Setup');
console.log('===============================\n');

// Read the current .env file
const envContent = fs.readFileSync('.env', 'utf8');
console.log('Current .env file:');
console.log(envContent);
console.log('\n===============================\n');

console.log('📋 To complete setup, you need to:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to Settings → API');
console.log('3. Copy your Project URL and API Keys');
console.log('4. Update the .env file with your actual values\n');

console.log('🔑 Required values to update:');
console.log('- SUPABASE_URL: Your Supabase project URL');
console.log('- SUPABASE_ANON_KEY: Your Supabase anon key');
console.log('- SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key');
console.log('- JWT_SECRET: A secure random string\n');

console.log('💡 Quick steps:');
console.log('1. Open .env file in your editor');
console.log('2. Replace placeholder values with your actual Supabase credentials');
console.log('3. Save the file');
console.log('4. Run: npm run dev\n');

console.log('✅ After updating, test with:');
console.log('curl http://localhost:3000/health'); 