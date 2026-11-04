import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Pharmacy SPA session — separate origin storage from aurent.uz. */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      _hasHydrated: false,

      setAuth: (token, user) => set({ token, user }),
      setToken: (token) => set({ token }),
      logout: () => set({ token: null, user: null }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'pharmacy-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
