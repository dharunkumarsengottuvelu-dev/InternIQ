import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import PageLoader from './PageLoader';

const ProtectedRoute = ({ children, requiredRole, loginRedirect = '/login' }) => {
  const { isAuthenticated, user, isAuthingViaUrl } = useAuthStore();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email');
  const password = searchParams.get('password');
  const token = searchParams.get('token');

  if (!isAuthenticated) {
    if (email || password || token || isAuthingViaUrl) {
      return <PageLoader />;
    }
    return <Navigate to={loginRedirect} state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={`/${user?.role}/dashboard`} replace />;
  }

  return children;
};

export default ProtectedRoute;
