const fetch = require('node-fetch').default;

async function testMNotifyDirectly() {
  console.log('🧪 Testing mNotify API directly...');
  
  const apiKey = 'PBl6mS2sJUMaQLEfq8ulCqb32'; // Using the newer API key
  const baseUrl = 'https://api.mnotify.com';
  const phoneNumber = '233546732719'; // Your target number in international format
  
  console.log('📱 Testing SMS to:', phoneNumber);
  console.log('🔑 API Key:', apiKey);
  console.log('🌐 Base URL:', baseUrl);
  
  try {
    // Test sending a real SMS
    const smsPayload = {
      recipient: [phoneNumber],
      sender: 'EcoWasteGo',
      message: 'Test SMS from EcoWasteGo - Please confirm if you receive this message.',
      is_schedule: false,
      schedule_date: ''
    };
    
    console.log('📤 SMS Payload:', JSON.stringify(smsPayload, null, 2));
    
    // Test API v2.0 endpoint
    console.log('\n🔍 Testing API v2.0 endpoint...');
    const responseV2 = await fetch(`${baseUrl}/api/sms/quick`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(smsPayload)
    });
    
    console.log('📊 v2.0 Response Status:', responseV2.status, responseV2.statusText);
    const responseTextV2 = await responseV2.text();
    console.log('📄 v2.0 Raw Response:', responseTextV2);
    
    // Test API v1.0 endpoint
    console.log('\n🔍 Testing API v1.0 endpoint...');
    const response = await fetch(`${baseUrl}/api/sms/quick`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(smsPayload)
    });
    
    console.log('📊 v1.0 Response Status:', response.status, response.statusText);
    const responseTextV1 = await response.text();
    console.log('📄 v1.0 Raw Response:', responseTextV1);
    
    // Test with different payload format
    console.log('\n🔍 Testing with different payload format...');
    const smsPayloadAlt = {
      to: [phoneNumber],
      from: 'EcoWasteGo',
      sms: 'Test SMS from EcoWasteGo - Please confirm if you receive this message.',
      type: 'text'
    };
    
    const responseAlt = await fetch(`${baseUrl}/api/sms/quick`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(smsPayloadAlt)
    });
    
    console.log('📊 Alt Format Response Status:', responseAlt.status, responseAlt.statusText);
    const responseTextAlt = await responseAlt.text();
    console.log('📄 Alt Format Raw Response:', responseTextAlt);
    
  } catch (error) {
    console.error('💥 Error testing mNotify API:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}

testMNotifyDirectly();
