import api from './api';

const adminService = {
  // Analytics
  getStats: () => api.get('/admin/stats'),
  getAtsDistribution: () => api.get('/admin/ats-distribution'),
  getSkillsDemand: () => api.get('/admin/skills-demand'),

  // Users
  getUsers: (page = 1, limit = 10) => api.get(`/admin/users?page=${page}&limit=${limit}`),
  toggleUserBlock: (userId) => api.patch(`/admin/users/${userId}/block`),

  // Internships
  getInternships: (page = 1, limit = 10) => api.get(`/admin/internships?page=${page}&limit=${limit}`),
  createInternship: (data) => api.post('/admin/internships', data),
  updateInternship: (id, data) => api.put(`/admin/internships/${id}`, data),
  deleteInternship: (id) => api.delete(`/admin/internships/${id}`),
};

export default adminService;
