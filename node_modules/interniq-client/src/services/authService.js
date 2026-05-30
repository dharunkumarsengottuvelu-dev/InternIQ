import api from './api';

export const authService = {
  register:        (data) => api.post('/auth/register', data),
  login:           (data) => api.post('/auth/login', data),
  logout:          ()     => api.post('/auth/logout'),
  verifyEmail:     (data) => api.post('/auth/verify-email', data),
  forgotPassword:  (data) => api.post('/auth/forgot-password', data),
  resetPassword:   (data) => api.post('/auth/reset-password', data),
  refreshToken:    ()     => api.post('/auth/refresh-token'),
  getMe:           ()     => api.get('/auth/me'),
  updateProfile:   (data) => api.put('/auth/profile', data),
  googleLoginUrl:  ()     => '/api/v1/auth/google',
};

export default authService;
