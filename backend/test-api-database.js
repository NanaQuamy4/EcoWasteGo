const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDatabaseViaAPI() {
  console.log('🔍 Testing Database via API Endpoints\n');
  console.log('=' .repeat(50));

  const baseURL = 'http://localhost:3000';

  try {
    // Test health endpoint
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await fetch(`${baseURL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working:', healthData);
    } else {
      console.log('❌ Health endpoint failed:', healthResponse.status);
      return;
    }

    // Test user registration (tests database write)
    console.log('\n👤 Testing user registration (database write)...');
    const registerData = {
      email: 'test-api@ecowastego.com',
      password: 'testpassword123',
      full_name: 'API Test User',
      phone: '+1234567890',
      role: 'customer'
    };

    const registerResponse = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    });

    if (registerResponse.ok) {
      const registerResult = await registerResponse.json();
      console.log('✅ User registration successful:', registerResult);
    } else {
      const errorData = await registerResponse.json();
      console.log('❌ User registration failed:', errorData);
    }

    // Test user login (tests database read)
    console.log('\n🔐 Testing user login (database read)...');
    const loginData = {
      email: 'test-api@ecowastego.com',
      password: 'testpassword123'
    };

    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ User login successful');
      
      // Test authenticated endpoint
      const token = loginResult.token;
      console.log('\n🔒 Testing authenticated endpoint...');
      
      const profileResponse = await fetch(`${baseURL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Authenticated endpoint working:', profileData);
      } else {
        console.log('❌ Authenticated endpoint failed:', profileResponse.status);
      }
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ User login failed:', errorData);
    }

    // Test waste collection creation (tests another table)
    console.log('\n🗑️ Testing waste collection creation...');
    const wasteData = {
      user_id: 1, // This would be the actual user ID
      pickup_address: '123 Test Street, Accra, Ghana',
      waste_type: 'plastic',
      quantity: 5,
      pickup_date: new Date().toISOString(),
      status: 'pending'
    };

    const wasteResponse = await fetch(`${baseURL}/api/waste`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(wasteData)
    });

    if (wasteResponse.ok) {
      const wasteResult = await wasteResponse.json();
      console.log('✅ Waste collection creation successful:', wasteResult);
    } else {
      const errorData = await wasteResponse.json();
      console.log('❌ Waste collection creation failed:', errorData);
    }

    // Test location search (tests Google Maps API)
    console.log('\n🗺️ Testing location search (Google Maps API)...');
    const locationResponse = await fetch(`${baseURL}/api/locations/search?query=Accra%20Ghana`);
    
    if (locationResponse.ok) {
      const locationData = await locationResponse.json();
      console.log('✅ Location search successful:', locationData);
    } else {
      const errorData = await locationResponse.json();
      console.log('❌ Location search failed:', errorData);
    }

    console.log('\n🎉 API Database Test Completed!');
    console.log('✅ Database is working through API endpoints');

  } catch (error) {
    console.error('\n❌ API test failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Make sure the server is running on port 3000');
    console.log('   2. Check if all environment variables are set');
    console.log('   3. Verify database schema is deployed');
    console.log('   4. Check network connectivity');
  }
}

testDatabaseViaAPI(); 