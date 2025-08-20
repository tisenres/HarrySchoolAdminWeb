export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // Core entities
      organizations: {
        Row: {
          id: string
          name: string
          settings: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          settings?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          settings?: Json | null
          created_at?: string
          updated_at?: string | null
        }
      }
      
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: 'student' | 'teacher' | 'admin' | 'superadmin'
          avatar_url: string | null
          organization_id: string
          language_preference: string | null
          notification_preferences: Json | null
          app_preferences: Json | null
          created_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          role: 'student' | 'teacher' | 'admin' | 'superadmin'
          avatar_url?: string | null
          organization_id: string
          language_preference?: string | null
          notification_preferences?: Json | null
          app_preferences?: Json | null
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'student' | 'teacher' | 'admin' | 'superadmin'
          avatar_url?: string | null
          organization_id?: string
          language_preference?: string | null
          notification_preferences?: Json | null
          app_preferences?: Json | null
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
        }
      }

      students: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          date_of_birth: string | null
          group_ids: string[]
          ranking_points: number
          ranking_coins: number
          level: number
          avatar_url: string | null
          referral_code: string
          referrals_count: number
          organization_id: string
          created_at: string
          updated_at: string | null
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          date_of_birth?: string | null
          group_ids?: string[]
          ranking_points?: number
          ranking_coins?: number
          level?: number
          avatar_url?: string | null
          referral_code?: string
          referrals_count?: number
          organization_id: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          date_of_birth?: string | null
          group_ids?: string[]
          ranking_points?: number
          ranking_coins?: number
          level?: number
          avatar_url?: string | null
          referral_code?: string
          referrals_count?: number
          organization_id?: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_by?: string | null
        }
      }

      teachers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          specializations: string[]
          group_ids: string[]
          ranking_points: number
          level: number
          avatar_url: string | null
          organization_id: string
          created_at: string
          updated_at: string | null
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          specializations?: string[]
          group_ids?: string[]
          ranking_points?: number
          level?: number
          avatar_url?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          specializations?: string[]
          group_ids?: string[]
          ranking_points?: number
          level?: number
          avatar_url?: string | null
          organization_id?: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_by?: string | null
        }
      }

      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          level: string | null
          subject: string
          teacher_ids: string[]
          student_ids: string[]
          schedule: Json
          classroom: string | null
          max_students: number
          current_enrollment: number | null
          start_date: string
          end_date: string | null
          status: string | null
          organization_id: string
          created_at: string
          updated_at: string | null
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          level?: string | null
          subject: string
          teacher_ids?: string[]
          student_ids?: string[]
          schedule: Json
          classroom?: string | null
          max_students?: number
          current_enrollment?: number | null
          start_date: string
          end_date?: string | null
          status?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          level?: string | null
          subject?: string
          teacher_ids?: string[]
          student_ids?: string[]
          schedule?: Json
          classroom?: string | null
          max_students?: number
          current_enrollment?: number | null
          start_date?: string
          end_date?: string | null
          status?: string | null
          organization_id?: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_by?: string | null
        }
      }

      // Mobile-specific tables
      home_tasks: {
        Row: {
          id: string
          student_id: string
          title: string
          description: string
          task_type: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing'
          content: Json
          due_date: string
          completed_at: string | null
          score: number | null
          feedback: string | null
          organization_id: string
          created_at: string
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          student_id: string
          title: string
          description: string
          task_type: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing'
          content: Json
          due_date: string
          completed_at?: string | null
          score?: number | null
          feedback?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          title?: string
          description?: string
          task_type?: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing'
          content?: Json
          due_date?: string
          completed_at?: string | null
          score?: number | null
          feedback?: string | null
          organization_id?: string
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
        }
      }

      vocabulary_words: {
        Row: {
          id: string
          word: string
          translation: string
          pronunciation: string | null
          example_sentence: string | null
          difficulty_level: 1 | 2 | 3 | 4 | 5
          category: string
          audio_url: string | null
          image_url: string | null
          organization_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          word: string
          translation: string
          pronunciation?: string | null
          example_sentence?: string | null
          difficulty_level: 1 | 2 | 3 | 4 | 5
          category: string
          audio_url?: string | null
          image_url?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          word?: string
          translation?: string
          pronunciation?: string | null
          example_sentence?: string | null
          difficulty_level?: 1 | 2 | 3 | 4 | 5
          category?: string
          audio_url?: string | null
          image_url?: string | null
          organization_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }

      student_vocabulary: {
        Row: {
          id: string
          student_id: string
          word_id: string
          is_learned: boolean
          practice_count: number
          last_practiced: string | null
          mastery_level: 0 | 1 | 2 | 3
          organization_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          word_id: string
          is_learned?: boolean
          practice_count?: number
          last_practiced?: string | null
          mastery_level?: 0 | 1 | 2 | 3
          organization_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          word_id?: string
          is_learned?: boolean
          practice_count?: number
          last_practiced?: string | null
          mastery_level?: 0 | 1 | 2 | 3
          organization_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }

      attendance: {
        Row: {
          id: string
          student_id: string
          group_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          notes: string | null
          organization_id: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          student_id: string
          group_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          notes?: string | null
          organization_id: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          group_id?: string
          date?: string
          status?: 'present' | 'absent' | 'late' | 'excused'
          notes?: string | null
          organization_id?: string
          created_at?: string
          created_by?: string | null
        }
      }

      feedback: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          group_id: string | null
          feedback_type: 'positive' | 'constructive' | 'concern'
          subject: string
          content: string
          rating: number | null
          is_read: boolean
          is_anonymous: boolean
          organization_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          group_id?: string | null
          feedback_type: 'positive' | 'constructive' | 'concern'
          subject: string
          content: string
          rating?: number | null
          is_read?: boolean
          is_anonymous?: boolean
          organization_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          group_id?: string | null
          feedback_type?: 'positive' | 'constructive' | 'concern'
          subject?: string
          content?: string
          rating?: number | null
          is_read?: boolean
          is_anonymous?: boolean
          organization_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }

      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'ranking' | 'feedback' | 'task' | 'attendance' | 'general'
          data: Json | null
          is_read: boolean
          is_push_sent: boolean
          organization_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'ranking' | 'feedback' | 'task' | 'attendance' | 'general'
          data?: Json | null
          is_read?: boolean
          is_push_sent?: boolean
          organization_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'ranking' | 'feedback' | 'task' | 'attendance' | 'general'
          data?: Json | null
          is_read?: boolean
          is_push_sent?: boolean
          organization_id?: string
          created_at?: string
        }
      }

      rankings: {
        Row: {
          id: string
          user_id: string
          user_type: 'student' | 'teacher'
          points: number
          coins: number
          level: number
          rank: number
          organization_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          user_type: 'student' | 'teacher'
          points?: number
          coins?: number
          level?: number
          rank?: number
          organization_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          user_type?: 'student' | 'teacher'
          points?: number
          coins?: number
          level?: number
          rank?: number
          organization_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }

      rewards: {
        Row: {
          id: string
          name: string
          description: string
          cost_coins: number
          category: 'physical' | 'digital' | 'privilege'
          image_url: string | null
          is_available: boolean
          stock_quantity: number | null
          organization_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          cost_coins: number
          category: 'physical' | 'digital' | 'privilege'
          image_url?: string | null
          is_available?: boolean
          stock_quantity?: number | null
          organization_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          cost_coins?: number
          category?: 'physical' | 'digital' | 'privilege'
          image_url?: string | null
          is_available?: boolean
          stock_quantity?: number | null
          organization_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }

      student_rewards: {
        Row: {
          id: string
          student_id: string
          reward_id: string
          redeemed_at: string
          status: 'pending' | 'fulfilled' | 'cancelled'
          notes: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          student_id: string
          reward_id: string
          redeemed_at?: string
          status?: 'pending' | 'fulfilled' | 'cancelled'
          notes?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          student_id?: string
          reward_id?: string
          redeemed_at?: string
          status?: 'pending' | 'fulfilled' | 'cancelled'
          notes?: string | null
          organization_id?: string
        }
      }

      extra_lesson_requests: {
        Row: {
          id: string
          student_id: string
          teacher_id: string | null
          subject: string
          description: string
          preferred_schedule: Json
          status: 'pending' | 'approved' | 'declined' | 'scheduled' | 'completed'
          notes: string | null
          organization_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          teacher_id?: string | null
          subject: string
          description: string
          preferred_schedule: Json
          status?: 'pending' | 'approved' | 'declined' | 'scheduled' | 'completed'
          notes?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          teacher_id?: string | null
          subject?: string
          description?: string
          preferred_schedule?: Json
          status?: 'pending' | 'approved' | 'declined' | 'scheduled' | 'completed'
          notes?: string | null
          organization_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}