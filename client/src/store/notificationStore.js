import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultNotifications = [
  {
    id: 'welcome',
    title: 'Welcome to InternIQ! 👋',
    description: 'Your AI-powered career co-pilot is ready. Upload your resume to start matching with internships!',
    type: 'info',
    read: false,
    link: '/student/resume',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 'upload-resume',
    title: 'Step 1: Resume Upload',
    description: 'Get ATS score, skill extraction, and coding assessments by uploading your resume.',
    type: 'info',
    read: false,
    link: '/student/resume',
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
  }
];

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: defaultNotifications,

      addNotification: (notification) => {
        const newNotification = {
          id: Math.random().toString(36).substring(2, 9),
          read: false,
          createdAt: new Date().toISOString(),
          ...notification,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'interniq-notifications',
    }
  )
);

export default useNotificationStore;
