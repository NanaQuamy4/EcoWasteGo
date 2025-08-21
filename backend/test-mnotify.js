const fetch = require('node-fetch').default;

async function testMNotifyAPI() {
  const apiKey = 'kydQP0b7Kcfc2c0VUfRLnwbx1';
  const baseUrl = 'https://api.mnotify.com';
  
  console.log('🧪 Testing mNotify API directly...');
  console.log('🔑 API Key:', apiKey);
  console.log('🌐 Base URL:', baseUrl);
  
  try {
    // Test 1: Try to get account balance (if this endpoint exists)
    console.log('\n📊 Test 1: Checking account balance...');
    const balanceResponse = await fetch(`${baseUrl}/api/balance`, {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Balance Response Status:', balanceResponse.status);
    const balanceText = await balanceResponse.text();
    console.log('Balance Response:', balanceText);
    
    // Test 2: Try to send a test SMS
    console.log('\n📱 Test 2: Sending test SMS...');
    const smsPayload = {
      recipient: ['233123456789'],
      sender: 'EcoWasteGo',
      message: 'Test message from EcoWasteGo',
      is_schedule: false,
      schedule_date: ''
    };
    
    const smsResponse = await fetch(`${baseUrl}/api/sms/send`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(smsPayload)
    });
    
    console.log('SMS Response Status:', smsResponse.status);
    const smsText = await smsResponse.text();
    console.log('SMS Response:', smsText);
    
  } catch (error) {
    console.error('💥 Error testing mNotify API:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}

testMNotifyAPI();
