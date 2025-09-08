import { create } from 'zustand';
import { User } from '@/types';

interface AuthUserLike {
  id: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  authUser: AuthUserLike | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setAuthUser: (authUser: AuthUserLike | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signIn: (_credentials: { email: string; password: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthUser: (authUser) => set({ authUser, isAuthenticated: !!authUser }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  signIn: async () => false,
  signOut: async () => {
    set({ user: null, authUser: null, isAuthenticated: false, isLoading: false, error: null });
  },
  initializeAuth: async () => {
    set({ user: null, authUser: null, isAuthenticated: false, isLoading: false });
  },
  logout: () => {
    set({ user: null, authUser: null, isAuthenticated: false, isLoading: false, error: null });
  },
}));