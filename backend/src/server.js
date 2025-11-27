const { fastify } = require('fastify');
require('dotenv').config();

// Create Fastify instance
const server = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
});

// Health check endpoint
server.get('/health', async () => {
  return { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Claribox backend is running!',
    environment: process.env.NODE_ENV || 'development'
  };
});

// Basic API routes
server.get('/api/summary/today', async () => {
  return {
    date: new Date().toISOString().split('T')[0],
    importantCount: 0,
    followUpCount: 0,
    noiseCount: 0,
    missedImportantCount: 0,
    message: 'Ready to connect to Supabase!'
  };
});

server.get('/api/test', async () => {
  return {
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    supabase: {
      url: process.env.SUPABASE_URL ? 'configured' : 'not configured',
      status: 'ready for setup'
    }
  };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || 'localhost';
    
    await server.listen({ port, host });
    
    console.log('🚀 Claribox API server ready!');
    console.log(`📊 Health check: http://${host}:${port}/health`);
    console.log(`🧪 Test endpoint: http://${host}:${port}/api/test`);
    console.log(`📚 Ready for Supabase integration!`);
    
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down server...');
  process.exit(0);
});

start();