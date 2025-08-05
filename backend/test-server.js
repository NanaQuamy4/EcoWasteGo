const http = require('http');

function testServer() {
  console.log('🔍 Testing Server Connection...\n');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server is running! Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 Response:', data);
      console.log('🎉 Server is working perfectly!');
    });
  });

  req.on('error', (error) => {
    console.log('❌ Server connection failed:', error.message);
    console.log('💡 Make sure the server is running with: npm run dev');
  });

  req.end();
}

testServer(); 