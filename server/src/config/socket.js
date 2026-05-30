import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

let io = null;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          process.env.NODE_ENV !== 'production' &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        const allowed = process.env.FRONTEND_URL || 'http://localhost:5173';
        if (origin === allowed) return callback(null, true);
        callback(new Error(`Socket CORS blocked: ${origin}`));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // JWT auth middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication token required'));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Join personal room for targeted events
    socket.join(`user:${socket.userId}`);
    socket.join(socket.userId.toString());

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id} — ${reason}`);
    });
  });

  return io;
};

/**
 * Emit an event to a specific user's room
 */
export const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit job progress update to user
 */
export const emitJobProgress = (userId, jobId, progress, status, data = {}) => {
  emitToUser(userId, 'job:progress', { jobId, progress, status, ...data });
};

/**
 * Emit job completion to user
 */
export const emitJobComplete = (userId, jobId, result) => {
  emitToUser(userId, 'job:complete', { jobId, result });
};

export const getIO = () => io;

export default { initializeSocket, emitToUser, emitJobProgress, emitJobComplete, getIO };
