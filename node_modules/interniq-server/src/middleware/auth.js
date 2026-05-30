import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getRedisClient } from '../config/redis.js';

// ─── Authenticate JWT ──────────────────────────────────────────
export const authenticateToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No access token provided');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw ApiError.unauthorized('Access token expired', 'TOKEN_EXPIRED');
    throw ApiError.unauthorized('Invalid access token', 'TOKEN_INVALID');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (user.isBlocked) throw ApiError.forbidden('Account has been suspended. Contact support.');

  req.user = user;
  next();
});

// ─── Email Verification Check ─────────────────────────────────
export const checkEmailVerified = asyncHandler(async (req, res, next) => {
  if (!req.user.isEmailVerified) {
    throw ApiError.forbidden('Please verify your email address before accessing this resource.', 'EMAIL_NOT_VERIFIED');
  }
  next();
});

// ─── Role-based Access Control ────────────────────────────────
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden(`Role '${req.user.role}' is not authorized for this action`);
  }
  next();
};

// ─── Profile Complete Check ───────────────────────────────────
export const checkProfileComplete = asyncHandler(async (req, res, next) => {
  if (!req.user.resumeUrl || !req.user.parsedResume) {
    throw ApiError.badRequest('Please upload your resume to access this feature.', 'PROFILE_INCOMPLETE');
  }
  next();
});

// ─── Optional Auth (attach user if token present, don't fail) ─
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    if (user && !user.isBlocked) req.user = user;
  } catch {
    // Swallow — optional auth doesn't block
  }
  next();
});
