import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui/index.jsx';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:           z.string().email('Invalid email address'),
  role:            z.enum(['student', 'recruiter']),
  password:        z.string()
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

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isLoading, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleDefaults = {
        admin:     '/admin/dashboard',
        recruiter: '/recruiter/dashboard',
        student:   '/student/dashboard',
      };
      const redirectTo = roleDefaults[user.role] || '/student/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  const onSubmit = async (data) => {
    const result = await registerUser({ name: data.name, email: data.email, password: data.password, role: data.role });
    if (result.success) {
      toast.success('Account created successfully! Welcome to InternIQ.');
      const roleDefaults = {
        admin:     '/admin/dashboard',
        recruiter: '/recruiter/dashboard',
        student:   '/student/dashboard',
      };
      const userRole = result.user?.role || 'student';
      const redirectTo = roleDefaults[userRole] || '/student/dashboard';
      navigate(redirectTo, { replace: true });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-black text-xl text-foreground">Intern<span className="gradient-text">IQ</span></span>
          </Link>
          <h2 className="text-3xl font-black text-foreground">Create your account</h2>
          <p className="text-muted mt-2">Start your AI-powered internship journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} id="register-form" className="space-y-5">
          <Input
            id="reg-name"
            label="Full name"
            placeholder="Priya Sharma"
            icon={User}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            id="reg-email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1.5">
            <label htmlFor="reg-role" className="block text-sm font-medium text-foreground">
              Register as
            </label>
            <select
              id="reg-role"
              className="w-full h-[50px] px-4 rounded-xl bg-subtle border border-border text-sm text-foreground focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all cursor-pointer"
              {...register('role')}
              defaultValue="student"
            >
              <option value="student" className="bg-card text-foreground">Student</option>
              <option value="recruiter" className="bg-card text-foreground">Recruiter</option>
            </select>
            {errors.role && <p className="text-xs text-danger-500">{errors.role.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none z-10" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
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

          <Input
            id="reg-confirm-password"
            label="Confirm password"
            type="password"
            placeholder="Re-enter password"
            icon={Lock}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <p className="text-xs text-muted">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-brand-400 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-brand-400 hover:underline">Privacy Policy</Link>.
          </p>

          <Button type="submit" size="lg" className="w-full group" loading={isLoading} id="register-submit-btn">
            Create Account
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
