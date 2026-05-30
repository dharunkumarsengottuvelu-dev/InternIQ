import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import { globalLimiter } from './middleware/rateLimit.js';
import v1Router from './routes/v1/index.js';
import { ApiError } from './utils/ApiError.js';
import ApiResponse from './utils/ApiResponse.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── Static Files (Local Fallback) ────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Security Headers ─────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // configured at nginx level in prod
}));

// ─── CORS ─────────────────────────────────────────────────────
const getAllowedOrigins = () => {
  const origins = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
  ]);
  // Add any env-configured frontend URL (for production / staging)
  if (process.env.FRONTEND_URL) origins.add(process.env.FRONTEND_URL);
  return origins;
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin header)
    if (!origin) return callback(null, true);
    const allowed = getAllowedOrigins();
    // In development, allow any localhost / 127.0.0.1 port
    if (
      process.env.NODE_ENV !== 'production' &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    if (allowed.has(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── HTTP Logging ─────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─── Global Rate Limit ────────────────────────────────────────
app.use(globalLimiter);

// ─── Passport ─────────────────────────────────────────────────
app.use(passport.initialize());

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/v1', v1Router);

// ─── Root Health Check ────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ name: 'InternIQ API', version: '1.0.0', status: 'healthy' });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  ApiResponse.error(res, 404, `Route ${req.method} ${req.originalUrl} not found`, 'ROUTE_NOT_FOUND');
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack, url: req.originalUrl });

  // Handle known operational errors
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.statusCode, err.message, err.errorCode, err.details);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
    return ApiResponse.error(res, 400, 'Validation failed', 'VALIDATION_ERROR', details);
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.error(res, 409, `${field} already exists`, 'DUPLICATE_KEY');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 401, 'Invalid token', 'TOKEN_INVALID');
  }

  // Multer errors
  if (err.name === 'MulterError') {
    return ApiResponse.error(res, 400, err.message, 'UPLOAD_ERROR');
  }

  // Unknown errors — don't leak internals in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  ApiResponse.error(res, 500, message, 'INTERNAL_ERROR');
});

export default app;
// Trigger restart 5
