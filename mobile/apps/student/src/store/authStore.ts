import { create } from 'zustand';
import { storage } from '../utils/storage';
import { User, StudentProfile } from '../types';

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  studentProfile: StudentProfile | null;
  token: string | null;
  
  // Actions
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<StudentProfile>) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: true,
  user: null,
  studentProfile: null,
  token: null,

  // Initialize authentication state from storage
  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      
      const token = await storage.getItem('auth_token');
      const userData = await storage.getItem('user_data');
      const profileData = await storage.getItem('student_profile');
      
      if (token && userData && profileData) {
        const user = JSON.parse(userData);
        const studentProfile = JSON.parse(profileData);
        
        set({
          isAuthenticated: true,
          token,
          user,
          studentProfile,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },

  // Login function
  login: async (email: string, password: string): Promise<boolean> => {
    try {
      set({ isLoading: true });
      
      // TODO: Replace with actual API call
      // For now, simulate login with mock data
      const mockUser: User = {
        id: '1',
        email: email,
        firstName: 'Alex',
        lastName: 'Johnson',
        avatar: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockProfile: StudentProfile = {
        id: '1',
        userId: '1',
        level: 12,
        points: 2847,
        coins: 156,
        rank: 8,
        totalStudents: 245,
        attendancePercentage: 94,
        averageGrade: 87,
        streak: 12,
        achievements: [],
        preferences: {
          language: 'en',
          theme: 'light',
          notifications: {
            lessons: true,
            homework: true,
            achievements: true,
            reminders: true,
          },
          audio: {
            effects: true,
            music: true,
            volume: 80,
          },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockToken = 'mock_jwt_token_123';

      // Store in storage
      await storage.setItem('auth_token', mockToken);
      await storage.setItem('user_data', JSON.stringify(mockUser));
      await storage.setItem('student_profile', JSON.stringify(mockProfile));

      set({
        isAuthenticated: true,
        user: mockUser,
        studentProfile: mockProfile,
        token: mockToken,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  // Logout function
  logout: async () => {
    try {
      set({ isLoading: true });
      
      // Clear storage
      await storage.removeItem('auth_token');
      await storage.removeItem('user_data');
      await storage.removeItem('student_profile');

      set({
        isAuthenticated: false,
        user: null,
        studentProfile: null,
        token: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({ isLoading: false });
    }
  },

  // Update profile function
  updateProfile: async (updates: Partial<StudentProfile>) => {
    try {
      const currentProfile = get().studentProfile;
      if (!currentProfile) return;

      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await storage.setItem('student_profile', JSON.stringify(updatedProfile));

      set({ studentProfile: updatedProfile });
    } catch (error) {
      console.error('Profile update error:', error);
    }
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));