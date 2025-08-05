const fs = require('fs');

console.log('🔧 EcoWasteGo Environment Setup');
console.log('===============================\n');

console.log('📋 Current .env file:');
console.log('===============================');
const envContent = fs.readFileSync('.env', 'utf8');
console.log(envContent);
console.log('===============================\n');

console.log('🔑 You need to update these values:');
console.log('1. SUPABASE_URL - Your Supabase project URL');
console.log('2. SUPABASE_ANON_KEY - Your Supabase anon key');
console.log('3. SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key\n');

console.log('📝 Instructions:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to Settings → API');
console.log('3. Copy your Project URL and API Keys');
console.log('4. Edit the .env file and replace the placeholder values\n');

console.log('💡 Example:');
console.log('SUPABASE_URL=https://esyardsjumxqwstdoaod.supabase.co');
console.log('SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
console.log('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n');

console.log('✅ After updating, test with:');
console.log('npm run dev');
console.log('curl http://localhost:3000/health'); 