import nodemailer from 'nodemailer';
import logger from '../../utils/logger.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  // Use Gmail if configured, fallback to Ethereal for testing
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    logger.info('📧 Email provider: Gmail (development)');
  } else {
    // Ethereal fallback for testing (no real emails sent)
    logger.warn('⚠️  No email provider configured — using Ethereal test account');
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: 'ethereal@example.com', pass: 'ethereal' },
    });
  }

  return transporter;
};

const FROM = `"${process.env.FROM_NAME || 'InternIQ'}" <${process.env.FROM_EMAIL || 'noreply@interniq.ai'}>`;

const sendMail = async (to, subject, html) => {
  try {
    const info = await getTransporter().sendMail({ from: FROM, to, subject, html });
    logger.info(`📬 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`❌ Email send failed: ${err.message}`);
    // Non-fatal — don't throw, just log
  }
};

// ─── Email Templates ──────────────────────────────────────────
export const sendVerificationEmail = async (user, otp) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:40px;border-radius:16px;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="color:#6366f1;font-size:28px;margin:0;">InternIQ</h1>
        <p style="color:#94a3b8;margin:8px 0 0;">AI-Powered Internship Platform</p>
      </div>
      <h2 style="color:#f1f5f9;">Verify your email address</h2>
      <p style="color:#94a3b8;">Hi ${user.name}, welcome to InternIQ! Use the OTP below to verify your email. It expires in <strong style="color:#f1f5f9;">10 minutes</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:36px;font-weight:800;letter-spacing:12px;padding:20px 40px;border-radius:12px;">
          ${otp}
        </div>
      </div>
      <p style="color:#64748b;font-size:14px;">If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `;
  await sendMail(user.email, 'Verify your InternIQ account', html);
};

export const sendPasswordResetEmail = async (user, resetLink) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:40px;border-radius:16px;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="color:#6366f1;font-size:28px;margin:0;">InternIQ</h1>
      </div>
      <h2 style="color:#f1f5f9;">Reset your password</h2>
      <p style="color:#94a3b8;">Hi ${user.name}, click the button below to reset your password. This link expires in <strong style="color:#f1f5f9;">1 hour</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;">
          Reset Password
        </a>
      </div>
      <p style="color:#64748b;font-size:13px;">If you didn't request a password reset, please ignore this email. Your account is safe.</p>
    </div>
  `;
  await sendMail(user.email, 'Reset your InternIQ password', html);
};

export const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:40px;border-radius:16px;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="color:#6366f1;font-size:28px;margin:0;">InternIQ</h1>
      </div>
      <h2 style="color:#f1f5f9;">Welcome aboard, ${user.name}! 🎉</h2>
      <p style="color:#94a3b8;">Your account is verified. Here's what to do next:</p>
      <ol style="color:#94a3b8;line-height:2;">
        <li>Upload your resume to get your ATS score</li>
        <li>Take the AI-generated skill assessment</li>
        <li>Get personalized internship recommendations</li>
      </ol>
      <div style="text-align:center;margin:32px 0;">
        <a href="${process.env.FRONTEND_URL}/student/resume" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:600;">
          Upload Resume →
        </a>
      </div>
    </div>
  `;
  await sendMail(user.email, 'Welcome to InternIQ — Get started now!', html);
};

export default { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail };
