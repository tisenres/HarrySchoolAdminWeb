import { create } from 'zustand';

interface AppState {
  language: 'en' | 'ru' | 'uz';
  theme: 'light' | 'dark';
  notifications: boolean;
  soundEnabled: boolean;
  setLanguage: (language: 'en' | 'ru' | 'uz') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setNotifications: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'en',
  theme: 'light',
  notifications: true,
  soundEnabled: true,
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  setNotifications: (notifications) => set({ notifications }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
}));