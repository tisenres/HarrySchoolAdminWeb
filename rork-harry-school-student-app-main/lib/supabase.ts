import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseEnabled: boolean = Boolean(supabaseUrl && supabaseAnonKey);

const webStorage = {
  getItem: (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.log('[supabase] webStorage.getItem error', e);
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.log('[supabase] webStorage.setItem error', e);
    }
  },
  removeItem: (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.log('[supabase] webStorage.removeItem error', e);
    }
  },
};

const createNoopClient = () => {
  const noop = async (..._args: any[]) => ({ data: null, error: { message: 'supabase disabled' } });
  const chain = () => ({
    select: () => chain(),
    eq: () => chain(),
    order: () => chain(),
    limit: () => chain(),
    maybeSingle: () => chain(),
    single: () => chain(),
    insert: () => chain(),
    upsert: () => chain(),
    update: () => chain(),
    gte: () => chain(),
    lte: () => chain(),
    on: () => chain(),
    subscribe: () => ({ unsubscribe: () => {} }),
  });
  return {
    auth: {
      signInWithPassword: noop,
      signUp: noop,
      signOut: noop,
      getUser: noop,
      resend: noop,
      onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: (_table: string) => ({ ...chain(), then: undefined } as any),
    channel: (_name: string) => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
  } as any;
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: Platform.OS === 'web' ? (webStorage as any) : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : createNoopClient();

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string;
          phone?: string;
          role: 'student' | 'teacher' | 'admin';
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string;
          phone?: string;
          role?: 'student' | 'teacher' | 'admin';
          organization_id: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          avatar_url?: string;
          phone?: string;
          role?: 'student' | 'teacher' | 'admin';
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          email?: string;
          phone?: string;
          date_of_birth: string;
          enrollment_date: string;
          enrollment_status: 'active' | 'inactive' | 'graduated';
          grade_level?: string;
          profile_image_url?: string;
          streak_days: number;
          created_at: string;
          updated_at: string;
        };
      };
      student_rankings: {
        Row: {
          id: string;
          organization_id: string;
          student_id: string;
          total_points: number;
          available_coins: number;
          spent_coins: number;
          current_level: number;
          current_rank?: number;
          last_activity_at: string;
          created_at: string;
          updated_at: string;
        };
      };
      points_transactions: {
        Row: {
          id: string;
          organization_id: string;
          student_id: string;
          transaction_type: 'earned' | 'deducted' | 'bonus' | 'redeemed';
          points_amount: number;
          coins_earned: number;
          reason: string;
          category: string;
          created_at: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string;
          subject: string;
          grade_level: string;
          difficulty: 'easy' | 'medium' | 'hard';
          content: any;
          duration_minutes: number;
          points_reward: number;
          is_published: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          description: string;
          subject: string;
          grade_level: string;
          difficulty: 'easy' | 'medium' | 'hard';
          content: any;
          duration_minutes: number;
          points_reward: number;
          is_published?: boolean;
          created_by: string;
        };
        Update: {
          title?: string;
          description?: string;
          subject?: string;
          grade_level?: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          content?: any;
          duration_minutes?: number;
          points_reward?: number;
          is_published?: boolean;
          updated_at?: string;
        };
      };
      hometasks: {
        Row: {
          id: string;
          organization_id: string;
          lesson_id?: string;
          title: string;
          description: string;
          type: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing' | 'mixed';
          difficulty: 'easy' | 'medium' | 'hard';
          content: any;
          points_reward: number;
          time_limit?: number;
          due_date?: string;
          is_published: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          lesson_id?: string;
          title: string;
          description: string;
          type: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing' | 'mixed';
          difficulty: 'easy' | 'medium' | 'hard';
          content: any;
          points_reward: number;
          time_limit?: number;
          due_date?: string;
          is_published?: boolean;
          created_by: string;
        };
        Update: {
          lesson_id?: string;
          title?: string;
          description?: string;
          type?: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing' | 'mixed';
          difficulty?: 'easy' | 'medium' | 'hard';
          content?: any;
          points_reward?: number;
          time_limit?: number;
          due_date?: string;
          is_published?: boolean;
          updated_at?: string;
        };
      };
      student_hometask_submissions: {
        Row: {
          id: string;
          organization_id: string;
          student_id: string;
          hometask_id: string;
          submission_data: any;
          score?: number;
          max_score: number;
          percentage?: number;
          feedback?: string;
          is_completed: boolean;
          completed_at?: string;
          submitted_at: string;
          graded_at?: string;
          graded_by?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          student_id: string;
          hometask_id: string;
          submission_data: any;
          max_score: number;
          is_completed?: boolean;
          submitted_at?: string;
        };
        Update: {
          submission_data?: any;
          score?: number;
          percentage?: number;
          feedback?: string;
          is_completed?: boolean;
          completed_at?: string;
          graded_at?: string;
          graded_by?: string;
          updated_at?: string;
        };
      };
      vocabulary_words: {
        Row: {
          id: string;
          organization_id: string;
          word: string;
          translation: string;
          definition: string;
          pronunciation?: string;
          example_sentence?: string;
          image_url?: string;
          difficulty: 'easy' | 'medium' | 'hard';
          category?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          word: string;
          translation: string;
          definition: string;
          pronunciation?: string;
          example_sentence?: string;
          image_url?: string;
          difficulty: 'easy' | 'medium' | 'hard';
          category?: string;
          created_by: string;
        };
        Update: {
          word?: string;
          translation?: string;
          definition?: string;
          pronunciation?: string;
          example_sentence?: string;
          image_url?: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          category?: string;
          updated_at?: string;
        };
      };
      student_vocabulary_progress: {
        Row: {
          id: string;
          organization_id: string;
          student_id: string;
          vocabulary_word_id: string;
          mastery_level: number;
          is_favorite: boolean;
          last_reviewed?: string;
          review_count: number;
          correct_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          student_id: string;
          vocabulary_word_id: string;
          mastery_level?: number;
          is_favorite?: boolean;
          review_count?: number;
          correct_count?: number;
        };
        Update: {
          mastery_level?: number;
          is_favorite?: boolean;
          last_reviewed?: string;
          review_count?: number;
          correct_count?: number;
          updated_at?: string;
        };
      };
      schedules: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          subject: string;
          teacher: string;
          start_time: string;
          end_time: string;
          location: string;
          type: 'class' | 'homework' | 'exam' | 'event';
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          title: string;
          subject: string;
          teacher: string;
          start_time: string;
          end_time: string;
          location: string;
          type: 'class' | 'homework' | 'exam' | 'event';
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
        };
        Update: {
          title?: string;
          subject?: string;
          teacher?: string;
          start_time?: string;
          end_time?: string;
          location?: string;
          type?: 'class' | 'homework' | 'exam' | 'event';
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          description?: string;
          logo_url?: string;
          settings: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string;
          logo_url?: string;
          settings?: any;
        };
        Update: {
          name?: string;
          description?: string;
          logo_url?: string;
          settings?: any;
          updated_at?: string;
        };
      };
      referrals: {
        Row: {
          id: string;
          organization_id: string;
          referrer_student_id: string;
          referred_student_id?: string;
          referral_code: string;
          referral_link: string;
          status: 'pending' | 'completed' | 'expired';
          points_awarded: number;
          rank_bonus: number;
          completed_at?: string;
          expires_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          referrer_student_id: string;
          referred_student_id?: string;
          referral_code: string;
          referral_link: string;
          status?: 'pending' | 'completed' | 'expired';
          points_awarded?: number;
          rank_bonus?: number;
          completed_at?: string;
          expires_at?: string;
        };
        Update: {
          referred_student_id?: string;
          status?: 'pending' | 'completed' | 'expired';
          points_awarded?: number;
          rank_bonus?: number;
          completed_at?: string;
          expires_at?: string;
          updated_at?: string;
        };
      };
      referral_rewards: {
        Row: {
          id: string;
          organization_id: string;
          referral_id: string;
          student_id: string;
          reward_type: 'points' | 'rank_boost' | 'coins' | 'discount';
          reward_value: number;
          description: string;
          claimed_at?: string;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          referral_id: string;
          student_id: string;
          reward_type: 'points' | 'rank_boost' | 'coins' | 'discount';
          reward_value: number;
          description: string;
          claimed_at?: string;
        };
        Update: {
          claimed_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type StudentRanking = Database['public']['Tables']['student_rankings']['Row'];
export type PointsTransaction = Database['public']['Tables']['points_transactions']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type Hometask = Database['public']['Tables']['hometasks']['Row'];
export type StudentHometaskSubmission = Database['public']['Tables']['student_hometask_submissions']['Row'];
export type VocabularyWord = Database['public']['Tables']['vocabulary_words']['Row'];
export type StudentVocabularyProgress = Database['public']['Tables']['student_vocabulary_progress']['Row'];
export type Schedule = Database['public']['Tables']['schedules']['Row'];
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Referral = Database['public']['Tables']['referrals']['Row'];
export type ReferralReward = Database['public']['Tables']['referral_rewards']['Row'];