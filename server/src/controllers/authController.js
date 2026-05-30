import crypto from 'crypto';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import {
  generateAccessToken, generateRefreshToken,
  storeRefreshToken, getStoredRefreshToken, deleteRefreshToken,
  generateEmailVerificationToken, generatePasswordResetToken, hashToken,
  recordFailedLogin, isAccountLocked, resetLoginAttempts,
} from '../services/auth/tokenService.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../services/auth/emailService.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── Register ─────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists', 'EMAIL_EXISTS');

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'student',
    isEmailVerified: true,
  });

  await sendWelcomeEmail(user);

  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user._id);
  await storeRefreshToken(user._id, refreshToken);

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  return ApiResponse.created(res, 'Account created successfully', {
    accessToken,
    user,
  });
});

// ─── Verify Email ─────────────────────────────────────────────
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({
    email,
    emailVerificationToken: otp,
    emailVerificationExpiry: { $gt: new Date() },
  });

  if (!user) throw ApiError.badRequest('Invalid or expired OTP', 'INVALID_OTP');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save();

  await sendWelcomeEmail(user);

  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user._id);
  await storeRefreshToken(user._id, refreshToken);

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  return ApiResponse.success(res, 'Email verified successfully', { accessToken, user });
});

// ─── Login ────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Brute-force check
  const locked = await isAccountLocked(email);
  if (locked) {
    throw ApiError.tooManyRequests('Account temporarily locked due to multiple failed attempts. Try again in 15 minutes.');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password) {
    await recordFailedLogin(email);
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const attempts = await recordFailedLogin(email);
    const remaining = Math.max(0, 5 - attempts);
    throw ApiError.unauthorized(
      remaining > 0
        ? `Invalid password. ${remaining} attempt(s) remaining.`
        : 'Account locked for 15 minutes due to failed attempts.',
      'INVALID_CREDENTIALS'
    );
  }

  if (user.isBlocked) throw ApiError.forbidden('Your account has been suspended. Contact support.');

  if (!user.isEmailVerified) {
    throw ApiError.forbidden(
      'Please verify your email before logging in. Check your inbox for the OTP we sent during registration.',
      'EMAIL_NOT_VERIFIED'
    );
  }

  await resetLoginAttempts(email);
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user._id);
  await storeRefreshToken(user._id, refreshToken);

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  return ApiResponse.success(res, 'Login successful', { accessToken, user });
});

// ─── Logout ───────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (userId) await deleteRefreshToken(userId);
  res.clearCookie('refreshToken');
  return ApiResponse.success(res, 'Logged out successfully');
});

// ─── Refresh Token ────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token provided');

  let decoded;
  try {
    const jwt = await import('jsonwebtoken');
    decoded = jwt.default.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token', 'TOKEN_EXPIRED');
  }

  const stored = await getStoredRefreshToken(decoded.id);
  if (!stored || stored !== token) throw ApiError.unauthorized('Refresh token has been revoked', 'TOKEN_REVOKED');

  const user = await User.findById(decoded.id);
  if (!user || user.isBlocked) throw ApiError.unauthorized('User not found or blocked');

  // Rotate: invalidate old, issue new
  const newRefreshToken = generateRefreshToken(user._id);
  await storeRefreshToken(user._id, newRefreshToken);
  const accessToken = generateAccessToken(user);

  res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
  return ApiResponse.success(res, 'Token refreshed', { accessToken });
});

// ─── Forgot Password ──────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  // Always return 200 to prevent user enumeration
  if (!user) return ApiResponse.success(res, 'If that email is registered, a reset link has been sent.');

  const { token, expiry } = generatePasswordResetToken();
  const hashed = hashToken(token);

  user.passwordResetToken = hashed;
  user.passwordResetExpiry = expiry;
  await user.save();

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${email}`;
  await sendPasswordResetEmail(user, resetLink);

  return ApiResponse.success(res, 'If that email is registered, a reset link has been sent.');
});

// ─── Reset Password ───────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, password } = req.body;

  const hashed = hashToken(token);
  const user = await User.findOne({
    email,
    passwordResetToken: hashed,
    passwordResetExpiry: { $gt: new Date() },
  });

  if (!user) throw ApiError.badRequest('Invalid or expired reset token', 'INVALID_TOKEN');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();

  // Invalidate all sessions
  await deleteRefreshToken(user._id);

  return ApiResponse.success(res, 'Password reset successfully. Please log in.');
});

// ─── Google OAuth Callback ────────────────────────────────────
export const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw ApiError.unauthorized('Google authentication failed');

  if (user.isBlocked) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=blocked`);
  }

  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user._id);
  await storeRefreshToken(user._id, refreshToken);

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  // Redirect to frontend login route with query token
  res.redirect(`${process.env.FRONTEND_URL}/login?token=${accessToken}`);
});

// ─── Get Current User ─────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return ApiResponse.success(res, 'User profile', { user });
});

// ─── Update Profile ───────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, role, preferences } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (role && ['student', 'admin', 'recruiter'].includes(role)) {
    user.role = role;
  }
  if (preferences) {
    if (preferences.domain !== undefined) user.preferences.domain = preferences.domain;
    if (preferences.location !== undefined) user.preferences.location = preferences.location;
    if (preferences.internshipType !== undefined) user.preferences.internshipType = preferences.internshipType;
    if (preferences.preferredLanguages !== undefined) user.preferences.preferredLanguages = preferences.preferredLanguages;
  }

  await user.save();
  return ApiResponse.success(res, 'Profile updated successfully', { user });
});
