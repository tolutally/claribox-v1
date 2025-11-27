const http = require('http');

// Test health endpoint
function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/internal/ai/health',
      method: 'GET',
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Health Check:', response);
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000);
    req.end();
  });
}

// Test classification endpoint
function testClassifyEndpoint() {
  return new Promise((resolve, reject) => {
    const testEmail = {
      id: 'test-email-123',
      subject: 'URGENT: Action Required - Server Outage',
      from: 'alerts@company.com',
      body: 'Critical server issue requires immediate attention. Please escalate ASAP.',
      date: new Date().toISOString(),
      isRead: false,
      labels: ['URGENT'],
      threadId: 'thread-123'
    };

    const postData = JSON.stringify(testEmail);
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/internal/ai/classify-email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Classification Response:', response);
          resolve(response);
        } catch (e) {
          console.log('Raw response:', data);
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing Email Classification API...\n');
  
  try {
    await testHealthEndpoint();
    await testClassifyEndpoint();
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running: npm run dev');
    }
  }
}

runTests();