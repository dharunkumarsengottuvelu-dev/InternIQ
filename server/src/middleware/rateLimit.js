import rateLimit from 'express-rate-limit';
import { getRedisClient } from '../config/redis.js';

// Simple in-memory store fallback if Redis isn't available yet
const createLimiter = (options) => rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      error: { code: 'RATE_LIMITED' },
      data: null,
    });
  },
  ...options,
});

// Global limiter: 100 req / 15 min per IP
export const globalLimiter = createLimiter({
  windowMs: parseInt(process.env.GLOBAL_RATE_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.GLOBAL_RATE_LIMIT) || 100,
  message:  'Too many requests from this IP',
});

// Auth routes: 5 req / 1 min per IP (brute-force protection)
export const authLimiter = createLimiter({
  windowMs: parseInt(process.env.AUTH_RATE_WINDOW_MS) || 60 * 1000,
  max:      parseInt(process.env.AUTH_RATE_LIMIT) || 5,
  message:  'Too many authentication attempts. Please wait 1 minute.',
  skipSuccessfulRequests: true, // only count failed attempts
});

// Resume upload: 3 uploads / 10 min per user
export const uploadLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.user?.id || req.ip,
});

// AI generation: 2 test generations / hour per user
export const aiGenerationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 2,
  keyGenerator: (req) => req.user?.id || req.ip,
});

export default { globalLimiter, authLimiter, uploadLimiter, aiGenerationLimiter };
