import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '@/services/authService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isAuthingViaUrl: false,

      // ── Setters ────────────────────────────────────────────
      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setIsAuthingViaUrl: (val) => set({ isAuthingViaUrl: val }),

      // ── Login ──────────────────────────────────────────────
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await authService.login(credentials);
          const { user, accessToken } = data.data;
          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading:       false,
          });
          // Return role so Login.jsx can redirect to the correct dashboard
          return { success: true, role: user?.role };
        } catch (err) {
          set({ isLoading: false });
          const msg = err.response?.data?.message || 'Login failed. Please try again.';
          return { success: false, message: msg };
        }
      },

      // ── Register ───────────────────────────────────────────
      register: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await authService.register(userData);
          const { user, accessToken } = data.data;
          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading:       false,
          });
          return { success: true, user };
        } catch (err) {
          set({ isLoading: false });
          const msg = err.response?.data?.message || 'Registration failed. Please try again.';
          return { success: false, message: msg };
        }
      },

      // ── Logout ─────────────────────────────────────────────
      logout: async () => {
        try { await authService.logout(); } catch (err) { console.warn('Logout err:', err); }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      // ── Refresh user from server ───────────────────────────
      refreshUser: async () => {
        if (!get().accessToken) return;
        try {
          const { data } = await authService.getMe();
          set({ user: data.data.user });
        } catch {
          get().logout();
        }
      },

      // ── Update partial user fields ─────────────────────────
      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),

      // ── Update profile on server and sync store ────────────
      updateProfile: async (updates) => {
        set({ isLoading: true });
        try {
          const { data } = await authService.updateProfile(updates);
          const { user } = data.data;
          set({ user, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          const msg = err.response?.data?.message || 'Failed to update profile';
          return { success: false, message: msg };
        }
      },
    }),
    {
      name: 'interniq-auth',
      partialize: (state) => ({
        user:            state.user,
        accessToken:     state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
