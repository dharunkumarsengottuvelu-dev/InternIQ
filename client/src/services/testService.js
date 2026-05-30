import api from './api';

const testService = {
  /**
   * Generates a new test based on skills
   * @param {Array<string>} skills 
   */
  generateTest: (skills) => api.post('/test/generate', { skills }),

  /**
   * Request a retest
   */
  requestRetest: () => api.post('/test/retest'),

  /**
   * Get the current active test for the logged-in user
   */
  getMyTest: () => api.get('/test/my-test'),

  /**
   * Run arbitrary code in the sandbox
   * @param {Object} payload { code, language, input }
   */
  runCode: (payload) => api.post('/test/run', payload),

  /**
   * Submit MCQ answers
   * @param {string} testId 
   * @param {Object} payload { answers, timeTakenTotal, tabSwitchCount }
   */
  submitMCQ: (testId, payload) => api.post(`/test/${testId}/mcq`, payload),

  /**
   * Submit Code answers
   * @param {string} testId 
   * @param {Object} payload { questionId, code, language }
   */
  submitCode: (testId, payload) => api.post(`/test/${testId}/code`, payload),
};

export default testService;
