import { Router } from 'express';
import { body } from 'express-validator';
import passport from 'passport';
import {
  register, login, logout, refreshToken,
  verifyEmail, forgotPassword, resetPassword,
  googleCallback, getMe, updateProfile,
} from '../../controllers/authController.js';
import { authenticateToken } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import validate from '../../middleware/validate.js';

const router = Router();

// ─── Validation Rules ─────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const verifyEmailRules = [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP'),
];

const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail(),
];

const resetPasswordRules = [
  body('token').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

// ─── Routes ───────────────────────────────────────────────────
router.post('/register',        authLimiter, registerRules,      validate, register);
router.post('/login',           authLimiter, loginRules,         validate, login);
router.post('/logout',          authenticateToken, logout);
router.post('/refresh-token',   refreshToken);
router.post('/verify-email',    verifyEmailRules,   validate, verifyEmail);
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password',  resetPasswordRules, validate, resetPassword);
router.get('/me',               authenticateToken, getMe);
router.put('/profile',          authenticateToken, updateProfile);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth` }),
  googleCallback
);

export default router;
