import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight, Chrome } from 'lucide-react';
import { Button, Input } from '@/components/ui/index.jsx';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorType = searchParams.get('error');
    if (errorType === 'oauth') {
      toast.error('Google authentication failed. Please try again.');
    } else if (errorType === 'blocked') {
      toast.error('Your account has been suspended. Contact support.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleDefaults = {
        admin:     '/admin/dashboard',
        recruiter: '/recruiter/dashboard',
        student:   '/student/dashboard',
      };
      const redirectTo = location.state?.from || roleDefaults[user.role] || '/student/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      toast.success('Welcome back!');
      // Redirect based on role — never use a hardcoded path
      const roleDefaults = {
        admin:     '/admin/dashboard',
        recruiter: '/recruiter/dashboard',
        student:   '/student/dashboard',
      };
      const redirectTo = location.state?.from || roleDefaults[result.role] || '/student/dashboard';
      navigate(redirectTo, { replace: true });
    } else {
      toast.error(result.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-dark" />
        <div className="orb orb-1 top-10 right-10" />
        <div className="orb orb-2 bottom-20 left-10" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#16a34a 1px, transparent 1px), linear-gradient(to right, #16a34a 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 text-center space-y-8 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-brand flex items-center justify-center shadow-glow-lg animate-float">
            <Zap className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-4xl font-black">
            Your AI-powered
            <br /><span className="gradient-text">career co-pilot</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Upload your resume, take AI assessments, and discover perfectly matched internships — all in one platform.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Resume AI', 'Instant ATS scoring'],
              ['Smart Tests', 'Skill-based MCQ + Code'],
              ['Matched Jobs', 'Semantic matching'],
              ['Real-time', 'WebSocket updates'],
            ].map(([title, desc]) => (
              <div key={title} className="glass-card p-4 text-left">
                <div className="text-sm font-bold text-white">{title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-black text-xl text-foreground">Intern<span className="gradient-text">IQ</span></span>
          </div>

          <div>
            <h2 className="text-3xl font-black text-foreground">Welcome back</h2>
            <p className="text-muted mt-2">Sign in to your account to continue</p>
          </div>

          {/* Google OAuth */}
          <a
            href="/api/v1/auth/google"
            id="google-oauth-btn"
            className="flex w-full items-center justify-center gap-3 px-4 py-3 bg-subtle hover:bg-muted/10 border border-border rounded-xl text-sm font-medium text-foreground transition-all"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </a>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="login-form">
            <Input
              id="login-email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-medium text-foreground">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 bg-subtle border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger-500">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full group"
              loading={isLoading}
              id="login-submit-btn"
            >
              Sign In
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
