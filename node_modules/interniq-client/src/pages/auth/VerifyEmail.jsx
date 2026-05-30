import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/index.jsx';
import authService from '@/services/authService';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const { setUser, setAccessToken } = useAuthStore();

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) setOtp(paste.split(''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) return toast.error('Please enter the complete 6-digit OTP');

    setLoading(true);
    try {
      const { data } = await authService.verifyEmail({ email, otp: otpStr });
      const user = data.data.user;
      setUser(user);
      setAccessToken(data.data.accessToken);
      toast.success('Email verified! Welcome to InternIQ 🎉');
      // Role-based redirect
      const roleRoutes = { admin: '/admin/dashboard', recruiter: '/recruiter/dashboard', student: '/student/dashboard' };
      navigate(roleRoutes[user?.role] || '/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 text-center"
      >
        <div>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-500/15 flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-3xl font-black text-foreground">Verify your email</h2>
          <p className="text-muted mt-2">
            Enter the 6-digit OTP sent to <strong className="text-foreground">{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} id="verify-email-form" className="space-y-6">
          {/* OTP input boxes */}
          <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="w-12 h-14 text-center text-2xl font-black bg-subtle border border-border rounded-xl text-foreground focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all"
              />
            ))}
          </div>

          <Button type="submit" size="lg" className="w-full group" loading={loading} id="verify-otp-btn">
            Verify Email
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>

        <div className="flex items-center justify-center gap-2 text-sm text-muted">
          <span>Didn't receive the OTP?</span>
          <button className="text-brand-400 font-medium flex items-center gap-1 hover:text-brand-300 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Resend
          </button>
        </div>

        <Link to="/login" className="block text-sm text-muted hover:text-foreground transition-colors">
          ← Back to sign in
        </Link>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
