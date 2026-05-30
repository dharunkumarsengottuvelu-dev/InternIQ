import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { getRedisClient } from './src/config/redis.js';
import { initializeSocket } from './src/config/socket.js';
import { getQueues } from './src/config/queues.js';
import configurePassport from './src/config/passport.js';
import startResumeParserWorker from './src/workers/resumeParserWorker.js';
import startATSWorker from './src/workers/atsWorker.js';
import startScorerWorker from './src/workers/scorerWorker.js';
import { startTestGeneratorWorker } from './src/workers/testGeneratorWorker.js';
import { startCodeEvaluatorWorker } from './src/workers/codeEvaluatorWorker.js';
import { startEmbedderWorker } from './src/workers/embedderWorker.js';
import logger from './src/utils/logger.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // ── Connect services ──────────────────────────────────────
    await connectDB();
    getRedisClient(); // initializes connection
    configurePassport();

    // ── Create HTTP + Socket.IO server ────────────────────────
    const server = http.createServer(app);
    initializeSocket(server);

    // ── Initialize queues ─────────────────────────────────────
    getQueues();

    // ── Start BullMQ workers ──────────────────────────────────
    startResumeParserWorker();
    startATSWorker();
    startScorerWorker();
    startTestGeneratorWorker();
    startCodeEvaluatorWorker();
    startEmbedderWorker();

    // ── Start listening ───────────────────────────────────────
    server.listen(PORT, () => {
      logger.info(`🚀 InternIQ server running at http://localhost:${PORT}`);
      logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // ── Graceful shutdown ─────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`⚡ Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          const redis = getRedisClient();
          await redis.quit();
          const mongoose = (await import('mongoose')).default;
          await mongoose.connection.close();
          logger.info('✅ Graceful shutdown complete');
          process.exit(0);
        } catch (err) {
          logger.error(`❌ Shutdown error: ${err.message}`);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
      logger.error(`💥 Uncaught Exception: ${err.message}`, { stack: err.stack });
      process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
      logger.error(`💥 Unhandled Rejection: ${reason}`);
      process.exit(1);
    });

  } catch (err) {
    logger.error(`❌ Server startup failed: ${err.message}`);
    process.exit(1);
  }
};

start();
