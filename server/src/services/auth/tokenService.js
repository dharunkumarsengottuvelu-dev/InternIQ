import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getRedisClient } from '../../config/redis.js';
import logger from '../../utils/logger.js';

const REFRESH_TOKEN_PREFIX = 'rt:';

// ─── Token Generation ─────────────────────────────────────────
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId.toString(), type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

// ─── Token Verification ───────────────────────────────────────
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// ─── Redis-backed Refresh Token Storage ───────────────────────
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export const storeRefreshToken = async (userId, token) => {
  try {
    const redis = getRedisClient();
    const key = `${REFRESH_TOKEN_PREFIX}${userId}`;
    await redis.setex(key, REFRESH_TTL_SECONDS, token);
  } catch (err) {
    logger.error(`❌ Failed to store refresh token in Redis: ${err.message}`);
  }
};

export const getStoredRefreshToken = async (userId) => {
  try {
    const redis = getRedisClient();
    return await redis.get(`${REFRESH_TOKEN_PREFIX}${userId}`);
  } catch (err) {
    logger.error(`❌ Failed to get refresh token from Redis: ${err.message}`);
    return null;
  }
};

export const deleteRefreshToken = async (userId) => {
  try {
    const redis = getRedisClient();
    await redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
  } catch (err) {
    logger.error(`❌ Failed to delete refresh token from Redis: ${err.message}`);
  }
};

/**
 * Rotate refresh token: invalidate old, store new.
 * Implements token rotation for security.
 */
export const rotateRefreshToken = async (userId) => {
  const newToken = generateRefreshToken(userId);
  await storeRefreshToken(userId, newToken);
  return newToken;
};

// ─── Email Verification Token ─────────────────────────────────
export const generateEmailVerificationToken = () => ({
  token: crypto.randomInt(100000, 999999).toString(), // 6-digit OTP
  expiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
});

// ─── Password Reset Token ─────────────────────────────────────
export const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    hashed: hashToken(token),
    expiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  };
};

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// ─── Brute Force Protection (Redis) ───────────────────────────
const LOGIN_ATTEMPTS_PREFIX = 'login:attempts:';
const LOCKOUT_PREFIX        = 'login:lock:';
const MAX_ATTEMPTS          = 5;
const LOCKOUT_DURATION      = 15 * 60; // 15 minutes in seconds

export const recordFailedLogin = async (email) => {
  try {
    const redis = getRedisClient();
    const key = `${LOGIN_ATTEMPTS_PREFIX}${email.toLowerCase()}`;
    const attempts = await redis.incr(key);
    if (attempts === 1) await redis.expire(key, LOCKOUT_DURATION);

    if (attempts >= MAX_ATTEMPTS) {
      const lockKey = `${LOCKOUT_PREFIX}${email.toLowerCase()}`;
      await redis.setex(lockKey, LOCKOUT_DURATION, '1');
      logger.warn(`🔒 Account locked: ${email} (${attempts} failed attempts)`);
    }
    return attempts;
  } catch (err) {
    logger.error(`❌ Redis error in recordFailedLogin: ${err.message}`);
    return 0;
  }
};

export const isAccountLocked = async (email) => {
  try {
    const redis = getRedisClient();
    const lockKey = `${LOCKOUT_PREFIX}${email.toLowerCase()}`;
    const locked = await redis.exists(lockKey);
    return locked === 1;
  } catch (err) {
    logger.error(`❌ Redis error in isAccountLocked: ${err.message}`);
    return false;
  }
};

export const resetLoginAttempts = async (email) => {
  try {
    const redis = getRedisClient();
    await redis.del(`${LOGIN_ATTEMPTS_PREFIX}${email.toLowerCase()}`);
    await redis.del(`${LOCKOUT_PREFIX}${email.toLowerCase()}`);
  } catch (err) {
    logger.error(`❌ Redis error in resetLoginAttempts: ${err.message}`);
  }
};
