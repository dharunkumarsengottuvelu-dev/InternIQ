import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/index.jsx';
import authService from '@/services/authService';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/\d/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter',       ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter',       ok: /[a-z]/.test(password) },
    { label: 'Number',                 ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-danger-500', 'bg-warning-500', 'bg-warning-500', 'bg-success-500', 'bg-success-500'];

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-surface-700'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(({ label, ok }) => (
          <div key={label} className={`flex items-center gap-1 text-xs transition-colors ${ok ? 'text-success-500' : 'text-slate-500'}`}>
            <CheckCircle className="w-3 h-3 flex-shrink-0" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');

  const onSubmit = async (data) => {
    if (!token || !email) {
      toast.error('Invalid password reset link. Please request a new one.');
      return;
    }

    try {
      const res = await authService.resetPassword({
        token,
        email,
        password: data.password,
      });

      if (res.data.success) {
        toast.success('Password reset successfully!');
        setSuccess(true);
      } else {
        toast.error(res.data.message || 'Failed to reset password.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired reset token.');
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card p-10 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-danger-500/15 flex items-center justify-center">
            <Lock className="w-8 h-8 text-danger-500" />
          </div>
          <h2 className="text-2xl font-black text-foreground">Invalid Link</h2>
          <p className="text-muted">
            This password reset link is invalid or incomplete. Please request a new one from the Forgot Password page.
          </p>
          <Link to="/forgot-password">
            <Button size="lg" className="w-full">Request New Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-card p-10 text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-success-500/15 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
          <h2 className="text-2xl font-black text-foreground">Password Reset</h2>
          <p className="text-muted">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <Link to="/login">
            <Button size="lg" className="w-full">Sign In</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-500/15 flex items-center justify-center mb-6">
            <Lock className="w-7 h-7 text-brand-400" />
          </div>
          <h2 className="text-3xl font-black text-foreground">Reset Password</h2>
          <p className="text-muted mt-2">Enter a new secure password for your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} id="reset-password-form" className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="reset-password" className="block text-sm font-medium text-foreground">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none z-10" />
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create new password"
                className="w-full pl-10 pr-10 py-3 bg-subtle border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all"
                {...register('password')}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-danger-500">{errors.password.message}</p>}
            <PasswordStrength password={password} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-foreground">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none z-10" />
              <input
                id="reset-confirm-password"
                type="password"
                placeholder="Confirm your password"
                className="w-full pl-10 pr-4 py-3 bg-subtle border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all"
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-danger-500">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" size="lg" className="w-full group" loading={isSubmitting} id="reset-submit-btn">
            Reset Password
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
