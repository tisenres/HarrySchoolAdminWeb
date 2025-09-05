export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string | null
          description: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string
          resource_id: string | null
          resource_name: string | null
          resource_type: string
          session_id: string | null
          success: boolean | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
          resource_id?: string | null
          resource_name?: string | null
          resource_type: string
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          classroom: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          current_enrollment: number | null
          curriculum: Json | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          duration_weeks: number | null
          end_date: string | null
          group_code: string | null
          group_type: string | null
          id: string
          is_active: boolean | null
          level: string | null
          max_students: number
          name: string
          notes: string | null
          online_meeting_url: string | null
          organization_id: string
          payment_frequency: string | null
          price_per_student: number | null
          required_materials: Json | null
          schedule: Json
          start_date: string
          status: string | null
          subject: string
          updated_at: string | null
          updated_by: string | null
          waiting_list_count: number | null
        }
        Insert: {
          classroom?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_enrollment?: number | null
          curriculum?: Json | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          duration_weeks?: number | null
          end_date?: string | null
          group_code?: string | null
          group_type?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          max_students?: number
          name: string
          notes?: string | null
          online_meeting_url?: string | null
          organization_id: string
          payment_frequency?: string | null
          price_per_student?: number | null
          required_materials?: Json | null
          schedule: Json
          start_date: string
          status?: string | null
          subject: string
          updated_at?: string | null
          updated_by?: string | null
          waiting_list_count?: number | null
        }
        Update: {
          classroom?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_enrollment?: number | null
          curriculum?: Json | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          duration_weeks?: number | null
          end_date?: string | null
          group_code?: string | null
          group_type?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          max_students?: number
          name?: string
          notes?: string | null
          online_meeting_url?: string | null
          organization_id?: string
          payment_frequency?: string | null
          price_per_student?: number | null
          required_materials?: Json | null
          schedule?: Json
          start_date?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
          updated_by?: string | null
          waiting_list_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          delivery_method: string[] | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          organization_id: string
          priority: string | null
          read_at: string | null
          related_group_id: string | null
          related_student_id: string | null
          related_teacher_id: string | null
          role_target: string[] | null
          scheduled_for: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_method?: string[] | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          organization_id: string
          priority?: string | null
          read_at?: string | null
          related_group_id?: string | null
          related_student_id?: string | null
          related_teacher_id?: string | null
          role_target?: string[] | null
          scheduled_for?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_method?: string[] | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          organization_id?: string
          priority?: string | null
          read_at?: string | null
          related_group_id?: string | null
          related_student_id?: string | null
          related_teacher_id?: string | null
          role_target?: string[] | null
          scheduled_for?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_group_id_fkey"
            columns: ["related_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_student_id_fkey"
            columns: ["related_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_teacher_id_fkey"
            columns: ["related_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: Json | null
          contact_info: Json | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          logo_url: string | null
          max_groups: number | null
          max_students: number | null
          max_teachers: number | null
          name: string
          settings: Json | null
          slug: string
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: Json | null
          contact_info?: Json | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          logo_url?: string | null
          max_groups?: number | null
          max_students?: number | null
          max_teachers?: number | null
          name: string
          settings?: Json | null
          slug: string
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: Json | null
          contact_info?: Json | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          logo_url?: string | null
          max_groups?: number | null
          max_students?: number | null
          max_teachers?: number | null
          name?: string
          settings?: Json | null
          slug?: string
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string
          full_name: string
          id: string
          language_preference: string | null
          last_login_at: string | null
          login_count: number | null
          notification_preferences: Json | null
          organization_id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          timezone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          full_name: string
          id: string
          language_preference?: string | null
          last_login_at?: string | null
          login_count?: number | null
          notification_preferences?: Json | null
          organization_id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          full_name?: string
          id?: string
          language_preference?: string | null
          last_login_at?: string | null
          login_count?: number | null
          notification_preferences?: Json | null
          organization_id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_versions: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          description: string | null
          version: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          description?: string | null
          version: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          description?: string | null
          version?: string
        }
        Relationships: []
      }
      student_group_enrollments: {
        Row: {
          amount_paid: number | null
          attendance_rate: number | null
          certificate_issued: boolean | null
          certificate_number: string | null
          completion_date: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          end_date: string | null
          enrollment_date: string
          final_grade: string | null
          group_id: string
          id: string
          notes: string | null
          organization_id: string
          payment_status: string | null
          progress_notes: string | null
          start_date: string
          status: string | null
          student_id: string
          tuition_amount: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount_paid?: number | null
          attendance_rate?: number | null
          certificate_issued?: boolean | null
          certificate_number?: string | null
          completion_date?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          end_date?: string | null
          enrollment_date?: string
          final_grade?: string | null
          group_id: string
          id?: string
          notes?: string | null
          organization_id: string
          payment_status?: string | null
          progress_notes?: string | null
          start_date: string
          status?: string | null
          student_id: string
          tuition_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount_paid?: number | null
          attendance_rate?: number | null
          certificate_issued?: boolean | null
          certificate_number?: string | null
          completion_date?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          end_date?: string | null
          enrollment_date?: string
          final_grade?: string | null
          group_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          payment_status?: string | null
          progress_notes?: string | null
          start_date?: string
          status?: string | null
          student_id?: string
          tuition_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_group_enrollments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_group_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_group_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: Json | null
          allergies: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          date_of_birth: string
          deleted_at: string | null
          deleted_by: string | null
          documents: Json | null
          email: string | null
          emergency_contacts: Json | null
          enrollment_date: string
          enrollment_status: string | null
          family_notes: string | null
          first_name: string
          full_name: string | null
          gender: string | null
          grade_level: string | null
          id: string
          is_active: boolean | null
          last_name: string
          medical_notes: string | null
          nationality: string | null
          notes: string | null
          organization_id: string
          parent_guardian_info: Json | null
          payment_plan: string | null
          payment_status: string | null
          previous_education: Json | null
          primary_phone: string | null
          profile_image_url: string | null
          secondary_phone: string | null
          special_needs: string | null
          student_id: string | null
          tuition_fee: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: Json | null
          allergies?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          date_of_birth: string
          deleted_at?: string | null
          deleted_by?: string | null
          documents?: Json | null
          email?: string | null
          emergency_contacts?: Json | null
          enrollment_date?: string
          enrollment_status?: string | null
          family_notes?: string | null
          first_name: string
          full_name?: string | null
          gender?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          medical_notes?: string | null
          nationality?: string | null
          notes?: string | null
          organization_id: string
          parent_guardian_info?: Json | null
          payment_plan?: string | null
          payment_status?: string | null
          previous_education?: Json | null
          primary_phone?: string | null
          profile_image_url?: string | null
          secondary_phone?: string | null
          special_needs?: string | null
          student_id?: string | null
          tuition_fee?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: Json | null
          allergies?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          date_of_birth?: string
          deleted_at?: string | null
          deleted_by?: string | null
          documents?: Json | null
          email?: string | null
          emergency_contacts?: Json | null
          enrollment_date?: string
          enrollment_status?: string | null
          family_notes?: string | null
          first_name?: string
          full_name?: string | null
          gender?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          medical_notes?: string | null
          nationality?: string | null
          notes?: string | null
          organization_id?: string
          parent_guardian_info?: Json | null
          payment_plan?: string | null
          payment_status?: string | null
          previous_education?: Json | null
          primary_phone?: string | null
          profile_image_url?: string | null
          secondary_phone?: string | null
          special_needs?: string | null
          student_id?: string | null
          tuition_fee?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          data_type: string | null
          description: string | null
          id: string
          is_encrypted: boolean | null
          is_public: boolean | null
          key: string
          organization_id: string | null
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          data_type?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_public?: boolean | null
          key: string
          organization_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          data_type?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_public?: boolean | null
          key?: string
          organization_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_group_assignments: {
        Row: {
          compensation_rate: number | null
          compensation_type: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          end_date: string | null
          group_id: string
          id: string
          notes: string | null
          organization_id: string
          role: string | null
          start_date: string
          status: string | null
          teacher_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          compensation_rate?: number | null
          compensation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          end_date?: string | null
          group_id: string
          id?: string
          notes?: string | null
          organization_id: string
          role?: string | null
          start_date?: string
          status?: string | null
          teacher_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          compensation_rate?: number | null
          compensation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          end_date?: string | null
          group_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          role?: string | null
          start_date?: string
          status?: string | null
          teacher_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_group_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_group_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_group_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address: Json | null
          certifications: Json | null
          contract_type: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          deleted_by: string | null
          documents: Json | null
          email: string | null
          emergency_contact: Json | null
          employee_id: string | null
          employment_status: string | null
          first_name: string
          full_name: string | null
          gender: string | null
          hire_date: string
          id: string
          is_active: boolean | null
          languages_spoken: string[] | null
          last_name: string
          notes: string | null
          organization_id: string
          phone: string
          profile_image_url: string | null
          qualifications: Json | null
          salary_amount: number | null
          salary_currency: string | null
          specializations: string[] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: Json | null
          certifications?: Json | null
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          documents?: Json | null
          email?: string | null
          emergency_contact?: Json | null
          employee_id?: string | null
          employment_status?: string | null
          first_name: string
          full_name?: string | null
          gender?: string | null
          hire_date?: string
          id?: string
          is_active?: boolean | null
          languages_spoken?: string[] | null
          last_name: string
          notes?: string | null
          organization_id: string
          phone: string
          profile_image_url?: string | null
          qualifications?: Json | null
          salary_amount?: number | null
          salary_currency?: string | null
          specializations?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: Json | null
          certifications?: Json | null
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          documents?: Json | null
          email?: string | null
          emergency_contact?: Json | null
          employee_id?: string | null
          employment_status?: string | null
          first_name?: string
          full_name?: string | null
          gender?: string | null
          hire_date?: string
          id?: string
          is_active?: boolean | null
          languages_spoken?: string[] | null
          last_name?: string
          notes?: string | null
          organization_id?: string
          phone?: string
          profile_image_url?: string | null
          qualifications?: Json | null
          salary_amount?: number | null
          salary_currency?: string | null
          specializations?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_student_data: {
        Args: { student_id: string }
        Returns: undefined
      }
      get_user_organization: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "superadmin" | "admin" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["superadmin", "admin", "viewer"],
    },
  },
} as const

// Helper type for extracting specific table types
export type Teacher = Tables<"teachers">
export type Student = Tables<"students">
export type Group = Tables<"groups">
export type Organization = Tables<"organizations">
export type Profile = Tables<"profiles">
export type TeacherGroupAssignment = Tables<"teacher_group_assignments">
export type StudentGroupEnrollment = Tables<"student_group_enrollments">
export type Notification = Tables<"notifications">
export type ActivityLog = Tables<"activity_logs">
export type SystemSetting = Tables<"system_settings">

// Insert types
export type TeacherInsert = TablesInsert<"teachers">
export type StudentInsert = TablesInsert<"students">
export type GroupInsert = TablesInsert<"groups">
export type OrganizationInsert = TablesInsert<"organizations">
export type ProfileInsert = TablesInsert<"profiles">

// Update types
export type TeacherUpdate = TablesUpdate<"teachers">
export type StudentUpdate = TablesUpdate<"students">
export type GroupUpdate = TablesUpdate<"groups">
export type OrganizationUpdate = TablesUpdate<"organizations">
export type ProfileUpdate = TablesUpdate<"profiles">

// Enum types
export type UserRole = Enums<"user_role">