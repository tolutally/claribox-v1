#!/usr/bin/env node

const http = require('http');

const testEmail = {
  subject: "URGENT: Action Required",
  snippet: "Critical issue needs attention",
  fullBody: "Critical issue needs immediate attention. Please escalate ASAP.",
  from: "alerts@company.com",
  to: ["user@company.com"],
  cc: [],
  labels: ["URGENT"],
  isNewsletter: false,
  userEmail: "user@company.com",
  userWasLastSender: false,
  daysSinceLastMessage: 0,
  threadLength: 1
};

const postData = JSON.stringify(testEmail);

const req = http.request({
  hostname: '127.0.0.1',
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
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    try {
      const response = JSON.parse(data);
      console.log('Parsed response:', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('Failed to parse JSON');
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

console.log('Sending request:', JSON.stringify(testEmail, null, 2));
req.write(postData);
req.end();