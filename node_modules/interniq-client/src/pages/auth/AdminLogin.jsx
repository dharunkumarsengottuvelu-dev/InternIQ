import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/index.jsx';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

const adminLoginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(`/${user.role}/dashboard`, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      if (result.role !== 'admin') {
        // Not an admin — reject and log out
        await useAuthStore.getState().logout();
        toast.error('Access denied. This portal is for administrators only.');
        return;
      }
      toast.success('Welcome, Admin!');
      navigate('/admin/dashboard', { replace: true });
    } else {
      toast.error(result.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(#818cf8 1px, transparent 1px), linear-gradient(to right, #818cf8 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Orbs */}
        <div
          style={{
            position: 'absolute',
            top: '10%', right: '5%',
            width: '320px', height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '15%', left: '5%',
            width: '280px', height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="relative z-10 text-center space-y-8 max-w-md">
          {/* Shield logo */}
          <div
            className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-2xl animate-float"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            <Shield className="w-12 h-12 text-white" fill="rgba(255,255,255,0.2)" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white mb-3">
              Admin<br />
              <span style={{ background: 'linear-gradient(135deg, #818cf8, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Control Panel
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Restricted access for InternIQ administrators. Manage users, internships, and platform analytics.
            </p>
          </div>

          {/* Warning badge */}
          <div
            className="flex items-center gap-3 mx-auto max-w-xs px-4 py-3 rounded-xl text-left"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300 leading-snug">
              This is a restricted area. Unauthorized access is prohibited and logged.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ['User Management', 'Block, promote, manage'],
              ['Internship Control', 'Post, edit, delete listings'],
              ['Analytics', 'Platform-wide insights'],
              ['Access Control', 'Role-based permissions'],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="p-4 text-left rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="text-sm font-bold text-white">{title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-2 justify-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl text-foreground">
              Intern<span style={{ background: 'linear-gradient(135deg, #818cf8, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>IQ</span>
            </span>
          </div>

          {/* Admin badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <Shield size={12} />
            ADMIN PORTAL
          </div>

          <div>
            <h2 className="text-3xl font-black text-foreground">Administrator Sign In</h2>
            <p className="text-muted mt-2">Enter your admin credentials to access the control panel</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="admin-login-form">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-sm font-medium text-foreground">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@interniq.in"
                  className="w-full pl-10 pr-4 py-3 bg-subtle border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none transition-all"
                  style={{ '--tw-ring-color': '#6366f1' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.2)'; }}
                  onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-danger-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-10 py-3 bg-subtle border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none transition-all"
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.2)'; }}
                  onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
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

            <button
              type="submit"
              id="admin-login-btn"
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{
                background: isLoading ? '#4f46e5' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                boxShadow: '0 0 24px rgba(99,102,241,0.35)',
              }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Admin Panel
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            Not an admin?{' '}
            <Link to="/login" className="font-semibold transition-colors" style={{ color: '#818cf8' }}>
              Go to Student / Recruiter Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
