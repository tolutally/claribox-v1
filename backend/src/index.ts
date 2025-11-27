import { fastify } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import rateLimit from '@fastify/rate-limit';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { checkSupabaseConnection } from './services/supabase';
import { emailClassifierPlugin } from './services/emailClassifier';
import * as path from 'path';

// Explicitly load .env file from backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debug: Log OAuth environment variables
console.log('🔧 Environment check:');
console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID?.slice(0, 20)}...`);
console.log(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '[SET]' : '[NOT SET]'}`);
console.log(`GOOGLE_REDIRECT_URI: ${process.env.GOOGLE_REDIRECT_URI}`);
console.log('---');

// Load environment variables
dotenv.config();

// Initialize Prisma
const prisma = new PrismaClient();

// Create Fastify instance
const server = fastify({
  logger: true
});

// Register plugins
async function build() {
  // CORS
  await server.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      // Allow chrome extensions
      if (origin.startsWith('chrome-extension://')) {
        return callback(null, true);
      }
      
      // Allow localhost for development
      if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
        return callback(null, true);
      }
      
      // Allow Gmail
      if (origin === 'https://mail.google.com') {
        return callback(null, true);
      }
      
      // Reject other origins
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000')
  });

  // JWT
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production'
  });

  // Swagger documentation
  await server.register(swagger, {
    swagger: {
      info: {
        title: 'Claribox API',
        description: 'Email insight API for Gmail sidebar extension',
        version: '1.0.0'
      },
      consumes: ['application/json'],
      produces: ['application/json']
    }
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    }
  });

  // Email Classification Service
  await server.register(emailClassifierPlugin);

  // Health check endpoint
  server.get('/health', async () => {
    try {
      // Check Supabase connection
      const supabaseHealthy = await checkSupabaseConnection();

      // Check Prisma connection (fallback)
      let prismaHealthy = false;
      try {
        await prisma.$queryRaw`SELECT 1`;
        prismaHealthy = true;
      } catch (error) {
        console.log('Prisma check failed:', error);
      }

      const status = supabaseHealthy ? 'healthy' : 'unhealthy';

      return {
        status,
        timestamp: new Date().toISOString(),
        services: {
          supabase: supabaseHealthy ? 'connected' : 'disconnected',
          prisma: prismaHealthy ? 'connected' : 'disconnected'
        },
        uptime: process.uptime()
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      };
    }
  });

  // Manual Email Processing - TODO: Remove detailed error responses before production
  server.post('/api/emails/refresh', {
    schema: {
      body: {
        type: 'object',
        additionalProperties: false,
        properties: {}
      }
    }
  }, async (request, reply) => {
    // TODO: Add JWT authentication once auth flow is fully tested
    const userId = 'temp-user-id'; // TODO: Extract from JWT token

    try {
      console.log(`[API] Manual email refresh requested for user: ${userId}`);
      
      const { emailProcessor } = await import('./workers/emailProcessor');
      
      // Get user tokens
      const userTokens = await emailProcessor.getUserTokens(userId);
      if (!userTokens) {
        return reply.code(401).send({ 
          error: 'User not authenticated or missing OAuth tokens',
          details: 'Please reconnect your Gmail account' // TODO: Remove detailed error before production
        });
      }

      // Process emails with full content analysis
      const result = await emailProcessor.processUserEmails(userTokens);
      
      if (!result.success && result.errors.length > 0) {
        return reply.code(500).send({
          error: 'Email processing failed',
          details: result.errors, // TODO: Remove detailed errors before production
          processed: result.processedCount,
          classified: result.classifiedCount
        });
      }

      return {
        success: true,
        message: 'Email processing completed',
        processed: result.processedCount,
        classified: result.classifiedCount,
        stored: result.storedCount,
        summary: result.summary,
        errors: result.errors.length > 0 ? result.errors : undefined // TODO: Remove error details before production
      };

    } catch (error: any) {
      console.error('[API] Email refresh failed:', error);
      return reply.code(500).send({ 
        error: 'Internal server error during email processing',
        details: error.message // TODO: Remove detailed error before production
      });
    }
  });

  // Basic API routes with mock data - TODO: Connect to real Supabase queries
  server.get('/api/summary/today', async (request, reply) => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      date: today,
      importantCount: 0,
      followUpCount: 0,
      noiseCount: 0,
      missedImportantCount: 0,
      message: 'Ready for email processing' // TODO: Remove when connected to real data
    };
  });

  server.get('/api/emails/important', async (request, reply) => {
    return {
      items: [],
      message: 'No classified emails yet - use /api/emails/refresh to process emails' // TODO: Remove when connected to real data
    };
  });

  server.get('/api/emails/followups', async (request, reply) => {
    return {
      items: [],
      message: 'No follow-ups detected yet - use /api/emails/refresh to process emails' // TODO: Remove when connected to real data
    };
  });

  server.get('/api/emails/noise', async (request, reply) => {
    return {
      count: 0,
      topSources: [],
      message: 'No noise filtered yet - use /api/emails/refresh to process emails' // TODO: Remove when connected to real data
    };
  });

  server.post('/api/classify', async (request, reply) => {
    const { subject, sender, body, snippet } = request.body as any;

    if (!subject || !sender) {
      return reply.code(400).send({ error: 'Missing subject or sender' });
    }

    try {
      // Dynamic import to avoid circular dependencies if any
      const { classifierService } = await import('./services/classifier');

      const result = await classifierService.classify({
        id: 'manual-test-' + Date.now(),
        subject,
        sender,
        body,
        snippet: snippet || body?.substring(0, 200) || '',
      });

      return result;
    } catch (error: any) {
      console.error('[API] Classification failed:', error);
      return reply.code(500).send({ 
        error: 'Classification failed',
        details: error.message // TODO: Remove detailed error before production
      });
    }
  });

  // OAuth Routes
  server.get('/auth/google', async (request, reply) => {
    const { extension_id } = request.query as { extension_id?: string };
    const { authService } = await import('./services/auth');
    // Pass extension_id as state so we know where to redirect back
    const url = authService.getAuthUrl(extension_id);
    return reply.redirect(url);
  });

  server.get('/auth/google/callback', async (request, reply) => {
    const query = request.query as { code: string, state?: string };
    console.log('Callback Query:', query);

    const { code, state } = query;

    if (!code) {
      return reply.code(400).send({ error: 'Missing code parameter' });
    }

    try {
      const { authService } = await import('./services/auth');
      const { user } = await authService.handleCallback(code);

      // If we have an extension ID (state), redirect back to the extension
      if (state) {
        console.log('Redirecting to extension:', state);
        const redirectUrl = `https://${state}.chromiumapp.org/?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`;
        return reply.redirect(redirectUrl);
      } else {
        console.log('No state found, showing HTML');
      }

      // Fallback for manual testing (HTML success page)
      reply.type('text/html');
      return `
        <!DOCTYPE html>
        <html>
        <body>
          <h1>Login Successful!</h1>
          <p>You can close this window.</p>
        </body>
        </html>
      `;
    } catch (error: any) {
      console.error('[API] OAuth callback error:', error);
      return reply.code(500).send({ 
        error: 'Authentication failed',
        details: error.message // TODO: Remove detailed error before production
      });
    }
  });

  // Authentication status endpoint
  server.get('/api/auth/status', async (request, reply) => {
    try {
      // For now, return authenticated status as false since we haven't implemented session management
      // This will be improved when proper session management is added
      return {
        isAuthenticated: false,
        user: null
      };
    } catch (error: any) {
      console.error('[API] Auth status check error:', error);
      return reply.code(500).send({ 
        error: 'Failed to check authentication status',
        details: error.message
      });
    }
  });

  // Logout endpoint
  server.post('/api/auth/logout', async (request, reply) => {
    try {
      // Clear any session data here when session management is implemented
      // For now, just return success
      return { success: true };
    } catch (error: any) {
      console.error('[API] Logout error:', error);
      return reply.code(500).send({ 
        error: 'Failed to logout',
        details: error.message
      });
    }
  });

  return server;
}

// Start server
const start = async () => {
  try {
    const app = await build();

    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || 'localhost';

    await app.listen({ port, host });

    console.log(`🚀 Claribox API server ready at http://${host}:${port}`);
    console.log(`📚 API docs available at http://${host}:${port}/docs`);
    console.log(`🔄 Test email processing at http://${host}:${port}/api/emails/refresh`);

  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

start();