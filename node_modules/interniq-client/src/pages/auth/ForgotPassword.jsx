import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui/index.jsx';
import authService from '@/services/authService';
import toast from 'react-hot-toast';

const schema = z.object({ email: z.string().email('Invalid email address') });

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }) => {
    try {
      await authService.forgotPassword({ email });
      setSentEmail(email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  if (sent) {
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
          <h2 className="text-2xl font-black text-foreground">Check your email</h2>
          <p className="text-muted">
            If <strong className="text-foreground">{sentEmail}</strong> is registered, you'll receive a password reset link shortly.
          </p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="w-full" id="back-to-login-btn">← Back to Sign In</Button>
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
            <Mail className="w-7 h-7 text-brand-400" />
          </div>
          <h2 className="text-3xl font-black text-foreground">Forgot password?</h2>
          <p className="text-muted mt-2">Enter your email and we'll send a reset link</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} id="forgot-password-form" className="space-y-5">
          <Input
            id="forgot-email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" size="lg" className="w-full group" loading={isSubmitting} id="forgot-submit-btn">
            Send Reset Link
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>

        <Link to="/login" className="block text-center text-sm text-muted hover:text-foreground transition-colors">
          ← Back to sign in
        </Link>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
