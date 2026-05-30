// App-wide constants

export const APP_NAME = 'InternIQ';
export const APP_VERSION = '1.0.0';

export const ROLES = {
  STUDENT:   'student',
  ADMIN:     'admin',
  RECRUITER: 'recruiter',
};

export const JOB_STATUS = {
  PENDING:    'pending',
  PROCESSING: 'processing',
  COMPLETE:   'complete',
  FAILED:     'failed',
};

export const INTERNSHIP_MODES = [
  { value: 'remote',  label: 'Remote' },
  { value: 'onsite',  label: 'On-site' },
  { value: 'hybrid',  label: 'Hybrid' },
];

export const INTERNSHIP_TYPES = [
  { value: 'any',    label: 'Any' },
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const SKILL_DOMAINS = [
  'Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps',
  'Data Science', 'Machine Learning', 'UI/UX Design',
  'Cloud', 'Cybersecurity', 'Blockchain', 'Game Dev',
];

export const CODING_LANGUAGES = [
  { value: 'python',     label: 'Python',     icon: '🐍' },
  { value: 'javascript', label: 'JavaScript',  icon: '⚡' },
  { value: 'java',       label: 'Java',        icon: '☕' },
  { value: 'cpp',        label: 'C++',         icon: '⚙️' },
  { value: 'c',          label: 'C',           icon: '🔧' },
  { value: 'go',         label: 'Go',          icon: '🐹' },
  { value: 'rust',       label: 'Rust',        icon: '🦀' },
];

export const RECOMMENDATION_TYPES = {
  STRONGLY:  'Strongly Recommended',
  RECOMMENDED:'Recommended',
  STRETCH:   'Stretch Goal',
};

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD:      65,
  AVERAGE:   50,
  POOR:      35,
};

export const MAX_FILE_SIZE_MB = 50;
export const ALLOWED_RESUME_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const ROUTES = {
  HOME:              '/',
  LOGIN:             '/login',
  REGISTER:          '/register',
  FORGOT_PASSWORD:   '/forgot-password',
  RESET_PASSWORD:    '/reset-password',
  VERIFY_EMAIL:      '/verify-email',
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_RESUME:    '/student/resume',
  STUDENT_TEST:      '/student/test',
  STUDENT_INTERNSHIPS:'/student/internships',
  STUDENT_PROFILE:   '/profile',
  ADMIN_DASHBOARD:   '/admin/dashboard',
  ADMIN_USERS:       '/admin/users',
  ADMIN_INTERNSHIPS: '/admin/internships',
  RECRUITER_POST:    '/recruiter/post',
};
