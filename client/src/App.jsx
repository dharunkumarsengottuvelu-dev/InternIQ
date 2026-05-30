import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import PageLoader from '@/components/common/PageLoader';
import useAuthStore from '@/store/authStore';
import useResumeStore from '@/store/resumeStore';
import useNotificationStore from '@/store/notificationStore';

// ─── Lazy-loaded pages ────────────────────────────────────────
const Landing         = lazy(() => import('@/pages/Landing'));
const Login           = lazy(() => import('@/pages/auth/Login'));
const Register        = lazy(() => import('@/pages/auth/Register'));
const AdminLogin      = lazy(() => import('@/pages/auth/AdminLogin'));
const ForgotPassword  = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword   = lazy(() => import('@/pages/auth/ResetPassword'));
const VerifyEmail     = lazy(() => import('@/pages/auth/VerifyEmail'));
const NotFound        = lazy(() => import('@/pages/NotFound'));
const ExternalRedirect = lazy(() => import('@/pages/ExternalRedirect'));

// Student pages
const Dashboard       = lazy(() => import('@/pages/student/Dashboard'));
const ResumePage      = lazy(() => import('@/pages/student/Resume'));
const CodingTest      = lazy(() => import('@/pages/student/CodingTest'));
const Internships     = lazy(() => import('@/pages/student/Internships'));
const Profile         = lazy(() => import('@/pages/student/Profile'));

// Admin pages
const AdminDashboard  = lazy(() => import('@/pages/admin/Dashboard'));
const AdminUsers      = lazy(() => import('@/pages/admin/Users'));
const AdminInternships= lazy(() => import('@/pages/admin/Internships'));

// Recruiter pages
const RecruiterDashboard  = lazy(() => import('@/pages/recruiter/Dashboard'));
const RecruiterPost       = lazy(() => import('@/pages/recruiter/PostInternship'));
const RecruiterCandidates = lazy(() => import('@/pages/recruiter/Candidates'));

const App = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setIsAuthingViaUrl = useAuthStore((state) => state.setIsAuthingViaUrl);

  useEffect(() => {
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    const token = searchParams.get('token');

    if (email || password || token) {
      // Set global flag to let ProtectedRoute know URL auth is active
      setIsAuthingViaUrl(true);

      // Clear query parameters immediately from URL to clean address bar and prevent loops
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('email');
      newParams.delete('password');
      newParams.delete('token');
      setSearchParams(newParams);

      if (email && password) {
        const doLogin = async () => {
          const loadingToast = toast.loading('Logging in via URL...');
          const res = await login({ email, password });
          toast.dismiss(loadingToast);
          setIsAuthingViaUrl(false);
          if (res.success) {
            toast.success('Successfully logged in via URL!');
          } else {
            toast.error(res.message || 'URL login failed');
          }
        };
        doLogin();
      } else if (token) {
        const doTokenLogin = async () => {
          const loadingToast = toast.loading('Logging in with token...');
          setAccessToken(token);
          try {
            await refreshUser();
            toast.dismiss(loadingToast);
            setIsAuthingViaUrl(false);
            toast.success('Successfully authenticated via URL token!');
          } catch (err) {
            toast.dismiss(loadingToast);
            setIsAuthingViaUrl(false);
            toast.error('Token authentication failed');
          }
        };
        doTokenLogin();
      }
    }
  }, [searchParams, login, setAccessToken, refreshUser, setSearchParams, setIsAuthingViaUrl]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('🔌 Global WebSocket connected');
    });

    socket.on('job:progress', ({ progress, status, message }) => {
      useResumeStore.getState().setJobProgress(progress, status, message);
    });

    socket.on('ats:complete', ({ atsReport, atsScore }) => {
      useResumeStore.getState().setATSReport(atsReport, atsScore);
      useAuthStore.getState().updateUser({ atsScore });
      useNotificationStore.getState().addNotification({
        title: 'Resume ATS Analysis Complete! 🎉',
        description: `Your resume has been parsed and scored ${atsScore}/100.`,
        type: 'success',
        link: '/student/resume',
      });
      toast.success(`Resume ATS analysis complete! Score: ${atsScore}/100`);
    });

    socket.on('ats:failed', ({ message }) => {
      useResumeStore.getState().setJobProgress(0, 'failed', message);
      useNotificationStore.getState().addNotification({
        title: 'Resume Analysis Failed ❌',
        description: message || 'An error occurred during resume analysis.',
        type: 'error',
        link: '/student/resume',
      });
      toast.error('Resume analysis failed.');
    });

    socket.on('test:complete', ({ message, testId }) => {
      useAuthStore.getState().updateUser({ activeTestId: testId });
      useNotificationStore.getState().addNotification({
        title: 'AI Skill Assessment Ready! 🧠',
        description: message || 'Your customized MCQ and coding test is ready.',
        type: 'success',
        link: '/student/test',
      });
      toast.success('AI Skill Assessment is ready!');
    });

    socket.on('test:error', ({ message }) => {
      useNotificationStore.getState().addNotification({
        title: 'Assessment Generation Failed ❌',
        description: message || 'An error occurred during test generation.',
        type: 'error',
        link: '/student/test',
      });
      toast.error('AI Assessment generation failed.');
    });

    return () => socket.disconnect();
  }, [isAuthenticated]);

  return (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ─── Public routes ──────────────────────────────── */}
      <Route path="/"                 element={<Landing />} />
      <Route path="/login"            element={<Login />} />
      <Route path="/register"         element={<Register />} />
      <Route path="/admin-login"      element={<AdminLogin />} />
      <Route path="/forgot-password"  element={<ForgotPassword />} />
      <Route path="/verify-email"     element={<VerifyEmail />} />
      <Route path="/reset-password"    element={<ResetPassword />} />
      <Route path="/redirect"         element={<ExternalRedirect />} />

      {/* ─── Student routes ─────────────────────────────── */}
      <Route path="/student" element={
        <ProtectedRoute requiredRole="student">
          <Navigate to="/student/dashboard" replace />
        </ProtectedRoute>
      } />
      <Route path="/student/dashboard" element={
        <ProtectedRoute requiredRole="student"><Dashboard /></ProtectedRoute>
      } />
      <Route path="/student/resume" element={
        <ProtectedRoute requiredRole="student"><ResumePage /></ProtectedRoute>
      } />
      <Route path="/student/test" element={
        <ProtectedRoute requiredRole="student"><CodingTest /></ProtectedRoute>
      } />
      <Route path="/student/internships" element={
        <ProtectedRoute requiredRole="student"><Internships /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />

      {/* ─── Admin routes ──────────────────── */}
      {/* /admin shows the admin panel directly (no redirect) */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin" loginRedirect="/admin-login"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin" loginRedirect="/admin-login"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requiredRole="admin" loginRedirect="/admin-login"><AdminUsers /></ProtectedRoute>
      } />
      <Route path="/admin/internships" element={
        <ProtectedRoute requiredRole="admin" loginRedirect="/admin-login"><AdminInternships /></ProtectedRoute>
      } />

      {/* ─── Recruiter routes ───────────────────────────── */}
      <Route path="/recruiter" element={
        <ProtectedRoute requiredRole="recruiter">
          <Navigate to="/recruiter/dashboard" replace />
        </ProtectedRoute>
      } />
      <Route path="/recruiter/dashboard" element={
        <ProtectedRoute requiredRole="recruiter"><RecruiterDashboard /></ProtectedRoute>
      } />
      <Route path="/recruiter/post" element={
        <ProtectedRoute requiredRole="recruiter"><RecruiterPost /></ProtectedRoute>
      } />
      <Route path="/recruiter/candidates" element={
        <ProtectedRoute requiredRole="recruiter"><RecruiterCandidates /></ProtectedRoute>
      } />

      {/* ─── Catch-all ──────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
  );
};

export default App;
