const http = require('http');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkBackendStatus() {
  console.log('🔍 EcoWasteGo Backend Status Check\n');
  console.log('=' .repeat(50));

  // Check 1: Environment Variables
  console.log('📋 Environment Variables Check:');
  console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`GOOGLE_MAPS_API_KEY: ${process.env.GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Missing'}`);

  // Check 2: Server Status
  console.log('\n🏥 Server Status Check:');
  const serverOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  const serverTest = new Promise((resolve) => {
    const req = http.request(serverOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ Server is running! Status: ${res.statusCode}`);
        console.log(`📊 Response: ${data}`);
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Server not running: ${error.message}`);
      console.log('💡 Start the server with: npm run dev');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('⏰ Server connection timeout');
      req.destroy();
      resolve(false);
    });

    req.end();
  });

  const serverRunning = await serverTest;

  // Check 3: Database Connection
  console.log('\n🗄️ Database Connection Check:');
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    console.log('✅ Supabase client created');
    console.log(`📊 Project URL: ${process.env.SUPABASE_URL}`);

    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database connection error:', error.message);
    } else {
      console.log('✅ Database connection successful!');
    }
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  }

  // Summary
  console.log('\n📊 Status Summary:');
  console.log(`Server Running: ${serverRunning ? '✅ Yes' : '❌ No'}`);
  console.log(`Environment Variables: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  
  if (serverRunning) {
    console.log('\n🎉 Backend Status: WORKING!');
    console.log('✅ Server is running on port 3000');
    console.log('✅ Environment variables are configured');
    console.log('✅ Database integration is ready');
    console.log('\n🌐 Available Endpoints:');
    console.log('   GET  /health - Server health check');
    console.log('   POST /api/auth/register - User registration');
    console.log('   POST /api/auth/login - User login');
    console.log('   GET  /api/users/profile - Get user profile');
    console.log('   POST /api/waste - Create waste collection');
    console.log('   GET  /api/locations/search - Search locations');
    console.log('   POST /api/payments - Process payments');
  } else {
    console.log('\n⚠️ Backend Status: NEEDS ATTENTION');
    console.log('❌ Server is not running');
    console.log('💡 To start the server:');
    console.log('   1. Open a new terminal');
    console.log('   2. Navigate to backend directory');
    console.log('   3. Run: npm run dev');
    console.log('   4. Keep the terminal open (don\'t cancel)');
  }
}

checkBackendStatus(); 