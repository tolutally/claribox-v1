#!/usr/bin/env node
/**
 * Complete Email Classification Microservice Test Suite
 * Tests both the core logic and API endpoints
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// Configuration
const SERVER_PORT = 3000;
const SERVER_TIMEOUT = 10000; // 10 seconds
const BACKEND_PATH = path.join(__dirname, 'backend');

// Test scenarios
const TEST_EMAILS = [
  {
    name: 'Newsletter/Marketing Email',
    email: {
      id: 'test-1',
      subject: 'Weekly Newsletter - Latest Updates from TechCorp',
      from: 'newsletter@techcorp.com',
      body: 'Here are the latest updates from our team. Subscribe for more weekly content.',
      date: new Date().toISOString(),
      isRead: false,
      labels: [],
      threadId: 'thread-1'
    },
    expectedCategory: 'NOISE',
    expectedReason: 'newsletter'
  },
  {
    name: 'Urgent Work Email',
    email: {
      id: 'test-2', 
      subject: 'URGENT: Production Server Down',
      from: 'alerts@company.com',
      body: 'Critical system failure detected. Immediate action required. All services affected.',
      date: new Date().toISOString(),
      isRead: false,
      labels: ['URGENT'],
      threadId: 'thread-2'
    },
    expectedCategory: 'IMPORTANT',
    expectedReason: 'urgent'
  },
  {
    name: 'Follow-up Email',
    email: {
      id: 'test-3',
      subject: 'Re: Meeting Follow-up',
      from: 'john@company.com', 
      body: 'Following up on our discussion from yesterday. Please let me know your thoughts.',
      date: new Date().toISOString(),
      isRead: false,
      labels: [],
      threadId: 'thread-3'
    },
    expectedCategory: 'FOLLOW_UP',
    expectedReason: 'follow-up'
  },
  {
    name: 'Promotional Email',
    email: {
      id: 'test-4',
      subject: 'Save 50% Today Only! Limited Time Offer',
      from: 'deals@store.com',
      body: 'Don\'t miss out! Huge savings on all items. Shop now before this offer expires!',
      date: new Date().toISOString(),
      isRead: false,
      labels: [],
      threadId: 'thread-4'
    },
    expectedCategory: 'NOISE',
    expectedReason: 'promotional'
  }
];

class EmailClassificationTester {
  constructor() {
    this.serverProcess = null;
    this.results = {
      healthCheck: null,
      classifications: [],
      errors: []
    };
  }

  async startServer() {
    console.log('🚀 Starting backend server...');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: BACKEND_PATH,
        stdio: 'pipe'
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Server failed to start within timeout'));
        }
      }, SERVER_TIMEOUT);

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Server:', output.trim());
        
        if (output.includes('Server listening at') && !serverReady) {
          serverReady = true;
          clearTimeout(timeout);
          setTimeout(resolve, 2000); // Give server extra time to fully initialize
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error('Server Error:', data.toString());
      });

      this.serverProcess.on('error', reject);
    });
  }

  stopServer() {
    if (this.serverProcess) {
      console.log('🛑 Stopping server...');
      this.serverProcess.kill('SIGTERM');
      this.serverProcess = null;
    }
  }

  async makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: SERVER_PORT,
        path: path,
        method: method,
        headers: {}
      };

      if (data) {
        const postData = JSON.stringify(data);
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const response = {
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData ? JSON.parse(responseData) : null
            };
            resolve(response);
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData,
              parseError: e.message
            });
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async testHealthEndpoint() {
    console.log('🔍 Testing health endpoint...');
    
    try {
      const response = await this.makeRequest('/internal/ai/health');
      
      if (response.statusCode === 200 && response.data) {
        console.log('✅ Health check passed:', response.data);
        this.results.healthCheck = { success: true, data: response.data };
        return true;
      } else {
        console.log('❌ Health check failed:', response);
        this.results.healthCheck = { success: false, error: 'Invalid response' };
        return false;
      }
    } catch (error) {
      console.error('❌ Health check error:', error.message);
      this.results.healthCheck = { success: false, error: error.message };
      return false;
    }
  }

  async testClassificationEndpoint() {
    console.log('🔍 Testing email classification endpoint...');
    
    for (const testCase of TEST_EMAILS) {
      try {
        console.log(`\n📧 Testing: ${testCase.name}`);
        
        const response = await this.makeRequest(
          '/internal/ai/classify-email', 
          'POST', 
          testCase.email
        );

        if (response.statusCode === 200 && response.data) {
          const result = response.data;
          console.log(`✅ Classification: ${result.category} (confidence: ${result.confidence}, reason: ${result.reason})`);
          
          this.results.classifications.push({
            testCase: testCase.name,
            expected: testCase.expectedCategory,
            actual: result.category,
            confidence: result.confidence,
            reason: result.reason,
            success: result.category === testCase.expectedCategory
          });
        } else {
          console.log(`❌ Classification failed:`, response);
          this.results.errors.push({
            testCase: testCase.name,
            error: 'Invalid response',
            response: response
          });
        }
      } catch (error) {
        console.error(`❌ Classification error for ${testCase.name}:`, error.message);
        this.results.errors.push({
          testCase: testCase.name,
          error: error.message
        });
      }
    }
  }

  printSummary() {
    console.log('\n\n📊 TEST RESULTS SUMMARY');
    console.log('========================\n');

    // Health Check
    if (this.results.healthCheck) {
      console.log(`🏥 Health Check: ${this.results.healthCheck.success ? '✅ PASSED' : '❌ FAILED'}`);
      if (!this.results.healthCheck.success) {
        console.log(`   Error: ${this.results.healthCheck.error}`);
      }
    }

    // Classifications
    const successful = this.results.classifications.filter(r => r.success);
    const failed = this.results.classifications.filter(r => !r.success);
    
    console.log(`\n🤖 Email Classifications: ${successful.length}/${this.results.classifications.length} passed`);
    
    if (successful.length > 0) {
      console.log('\n✅ Successful Classifications:');
      successful.forEach(result => {
        console.log(`   ${result.testCase}: ${result.actual} (confidence: ${result.confidence})`);
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed Classifications:');
      failed.forEach(result => {
        console.log(`   ${result.testCase}: Expected ${result.expected}, got ${result.actual}`);
      });
    }

    // Errors
    if (this.results.errors.length > 0) {
      console.log('\n🚨 Errors:');
      this.results.errors.forEach(error => {
        console.log(`   ${error.testCase}: ${error.error}`);
      });
    }

    const overallSuccess = this.results.healthCheck?.success && 
                          this.results.classifications.every(r => r.success) && 
                          this.results.errors.length === 0;

    console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 Email Classification Microservice is working correctly!');
      console.log('✨ Ready for production use with rule-based pre-filtering and LLM fallback.');
    }
  }

  async runAllTests() {
    console.log('🧪 Email Classification Microservice Test Suite');
    console.log('================================================\n');

    try {
      // Start server
      await this.startServer();
      
      // Run tests
      const healthOK = await this.testHealthEndpoint();
      if (healthOK) {
        await this.testClassificationEndpoint();
      }
      
      // Print results
      this.printSummary();
      
    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
      this.results.errors.push({ testCase: 'Test Suite', error: error.message });
    } finally {
      this.stopServer();
    }
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test terminated');
  process.exit(0);
});

// Run tests
const tester = new EmailClassificationTester();
tester.runAllTests().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});