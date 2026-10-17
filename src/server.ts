import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastify from 'fastify';
import rawBody from 'fastify-raw-body';
import { registerAdminRoutes } from './admin/routes.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { checkDatabaseHealth } from './db/client.js';
import { followUpScheduler } from './jobs/scheduler.js';
import { queueWorker } from './queue/worker.js';
import { registerCalWebhookRoutes } from './integrations/cal/webhook.js';
import { registerWebhookRoutes } from './whatsapp/webhook.js';

export async function buildServer() {
  const app = fastify({
    loggerInstance: logger as any,
  });

  // 1. Raw body preservation for WhatsApp HMAC-SHA256 verification
  await app.register(rawBody, {
    field: 'rawBody',
    global: true,
    encoding: false, // returns Buffer
    runFirst: true,
  });

  // 2. CORS setup
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // 3. Rate limiting (protection against DDoS / brute force)
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // 4. Health Check Endpoint
  app.get('/health', async (_req, reply) => {
    const isDbConnected = await checkDatabaseHealth();
    return reply.status(isDbConnected ? 200 : 503).send({
      status: isDbConnected ? 'healthy' : 'degraded',
      service: 'whatsapp-ai-lead-agent',
      version: '1.0.0',
      database_connected: isDbConnected,
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
    });
  });

  // 5. Register WhatsApp Webhook routes
  await app.register(registerWebhookRoutes);

  // 6. Register Cal.com Webhook routes
  await app.register(registerCalWebhookRoutes);

  // 7. Register Admin REST API routes with /admin prefix
  await app.register(registerAdminRoutes, { prefix: '/admin' });

  return app;
}

async function start() {
  try {
    const app = await buildServer();

    // Start background queue worker
    queueWorker.start();

    // Start follow-up & reminder scheduler
    followUpScheduler.start();

    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
    logger.info(`📡 Public Webhook URL: ${env.PUBLIC_BASE_URL}/webhook`);
    logger.info(`🛠️ Admin API Base: http://${env.HOST}:${env.PORT}/admin`);

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      queueWorker.stop();
      followUpScheduler.stop();
      await app.close();
      logger.info('Server and background jobs closed cleanly');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Auto-run if executed directly
if (process.env.NODE_ENV !== 'test') {
  start();
}
