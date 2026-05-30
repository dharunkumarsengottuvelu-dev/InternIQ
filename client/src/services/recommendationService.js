import api from './api';

const recommendationService = {
  /**
   * Fetch personalized internship recommendations for the logged-in student.
   */
  getRecommendations: () => api.get('/recommendations'),
};

export default recommendationService;
