import api from './api';

export const resumeService = {
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total);
        onProgress?.(percent);
      },
    });
  },
  getATSReport:  () => api.get('/resume/ats-report'),
  reanalyze:     () => api.post('/resume/reanalyze'),
  getJobStatus:  (jobId) => api.get(`/resume/status/${jobId}`),
  stopAnalysis:  () => api.post('/resume/stop'),
};

export default resumeService;
