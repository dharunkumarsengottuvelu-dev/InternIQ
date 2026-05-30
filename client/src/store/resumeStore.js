import { create } from 'zustand';
import resumeService from '@/services/resumeService';
import useAuthStore from './authStore';

const useResumeStore = create((set, get) => ({
  resumeUrl:      null,
  atsReport:      null,
  atsScore:       null,
  parsedResume:   null,
  uploadProgress: 0,
  jobId:          null,
  jobStatus:      'idle', // idle | uploading | parsing | analyzing | complete | failed
  jobMessage:     '',

  // Allow progress updates from WebSocket UNLESS analysis is already complete.
  // Previously this blocked ALL updates from idle/failed — which caused WS events
  // arriving right after upload to be silently dropped.
  setJobProgress: (progress, status, message = '') => {
    const currentStatus = get().jobStatus;
    // Never regress from 'complete'
    if (currentStatus === 'complete') return;
    set({ uploadProgress: progress, jobStatus: status, jobMessage: message });
  },

  setATSReport: (report, score) =>
    set({ atsReport: report, atsScore: score, jobStatus: 'complete', uploadProgress: 100 }),

  setResumeUrl: (url) => set({ resumeUrl: url }),

  setJobId: (jobId) => set({ jobId }),

  reset: () => set({
    uploadProgress: 0,
    jobId:          null,
    jobStatus:      'idle',
    jobMessage:     '',
    resumeUrl:      null,
    atsReport:      null,
    atsScore:       null,
    parsedResume:   null,
  }),

  // Upload resume and begin analysis pipeline
  uploadResume: async (file) => {
    set({ jobStatus: 'uploading', uploadProgress: 0, atsReport: null, atsScore: null, parsedResume: null });
    try {
      const { data } = await resumeService.upload(file, (pct) => {
        set({ uploadProgress: pct });
      });
      set({
        resumeUrl:  data.data.resumeUrl,
        jobId:      data.data.jobId,
        jobStatus:  'parsing',
        jobMessage: 'Resume uploaded. AI analysis starting...',
        uploadProgress: 0,
      });
      return { success: true, jobId: data.data.jobId };
    } catch (err) {
      set({ jobStatus: 'failed', jobMessage: err.response?.data?.message || 'Upload failed. Please try again.' });
      return { success: false, message: err.response?.data?.message || 'Upload failed. Please try again.' };
    }
  },

  // Fetch existing ATS report on page load — handles all states correctly
  fetchATSReport: async () => {
    try {
      const { data } = await resumeService.getATSReport();
      const d = data.data;

      if (d.status === 'complete') {
        set({
          resumeUrl:    d.resumeUrl,
          atsScore:     d.atsScore,
          atsReport:    d.atsReport,
          parsedResume: d.parsedResume,
          jobStatus:    'complete',
          uploadProgress: 100,
          jobMessage:   '',
        });
      } else if (d.status === 'pending') {
        // Job is still actively running in the queue
        set({
          resumeUrl:    d.resumeUrl,
          atsScore:     d.atsScore ?? null,
          jobStatus:    'analyzing',
          uploadProgress: d.progress ?? 50,
          jobMessage:   'AI is still analyzing your resume…',
        });
      } else {
        // status === 'failed' or anything unexpected — reset to idle so user can re-upload
        set({
          resumeUrl:      d.resumeUrl ?? null,
          atsReport:      null,
          atsScore:       null,
          parsedResume:   null,
          jobStatus:      'idle',
          uploadProgress: 0,
          jobMessage:     '',
        });
      }
    } catch (err) {
      // 404 means no resume uploaded yet — fully idle
      const status = err?.response?.status;
      if (status === 404 || status === 403) {
        set({
          resumeUrl:      null,
          atsReport:      null,
          atsScore:       null,
          parsedResume:   null,
          jobStatus:      'idle',
          uploadProgress: 0,
          jobMessage:     '',
        });
      }
      // Any other error — leave state as-is
    }
  },

  // Stop active analysis and fully clear state
  stopAnalysis: async () => {
    set({
      uploadProgress: 0,
      jobId:          null,
      jobStatus:      'idle',
      jobMessage:     '',
      resumeUrl:      null,
      atsReport:      null,
      atsScore:       null,
      parsedResume:   null,
    });
    useAuthStore.getState().updateUser({
      atsScore:     null,
      activeTestId: null,
    });

    try {
      await resumeService.stopAnalysis();
      return { success: true };
    } catch (err) {
      const status = err.response?.status;
      if (status === 404 || status === 400) {
        return { success: true };
      }
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to stop analysis',
      };
    }
  },
}));

export default useResumeStore;
