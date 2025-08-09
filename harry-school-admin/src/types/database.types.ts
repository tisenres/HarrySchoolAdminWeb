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
      discounts: {
        Row: {
          amount: number | null
          applicable_groups: string[] | null
          applies_to: string
          auto_apply: boolean | null
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          id: string
          is_active: boolean | null
          min_enrollment_count: number | null
          name: string
          organization_id: string
          percentage: number | null
          stackable: boolean | null
          updated_at: string | null
          updated_by: string | null
          usage_count: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          amount?: number | null
          applicable_groups?: string[] | null
          applies_to?: string
          auto_apply?: boolean | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          id?: string
          is_active?: boolean | null
          min_enrollment_count?: number | null
          name: string
          organization_id: string
          percentage?: number | null
          stackable?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          amount?: number | null
          applicable_groups?: string[] | null
          applies_to?: string
          auto_apply?: boolean | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          id?: string
          is_active?: boolean | null
          min_enrollment_count?: number | null
          name?: string
          organization_id?: string
          percentage?: number | null
          stackable?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          account_code: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          deleted_at: string | null
          deleted_by: string | null
          description: string
          group_id: string | null
          id: string
          invoice_id: string | null
          metadata: Json | null
          organization_id: string
          payment_id: string | null
          requires_approval: boolean | null
          running_balance: number | null
          student_balance_after: number | null
          student_id: string | null
          subcategory: string | null
          tags: string[] | null
          transaction_date: string | null
          transaction_number: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          account_code?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          group_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          organization_id: string
          payment_id?: string | null
          requires_approval?: boolean | null
          running_balance?: number | null
          student_balance_after?: number | null
          student_id?: string | null
          subcategory?: string | null
          tags?: string[] | null
          transaction_date?: string | null
          transaction_number: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          account_code?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          group_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          organization_id?: string
          payment_id?: string | null
          requires_approval?: boolean | null
          running_balance?: number | null
          student_balance_after?: number | null
          student_id?: string | null
          subcategory?: string | null
          tags?: string[] | null
          transaction_date?: string | null
          transaction_number?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      invoice_line_items: {
        Row: {
          created_at: string | null
          description: string
          discount_amount: number | null
          discount_id: string | null
          group_id: string | null
          id: string
          invoice_id: string
          item_type: string
          line_total: number
          organization_id: string
          original_amount: number | null
          period_end: string | null
          period_start: string | null
          quantity: number
          tax_amount: number | null
          tax_rate: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          discount_amount?: number | null
          discount_id?: string | null
          group_id?: string | null
          id?: string
          invoice_id: string
          item_type: string
          line_total: number
          organization_id: string
          original_amount?: number | null
          period_end?: string | null
          period_start?: string | null
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          discount_amount?: number | null
          discount_id?: string | null
          group_id?: string | null
          id?: string
          invoice_id?: string
          item_type?: string
          line_total?: number
          organization_id?: string
          original_amount?: number | null
          period_end?: string | null
          period_start?: string | null
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          attachment_urls: string[] | null
          billing_address: Json | null
          created_at: string | null
          created_by: string | null
          currency: string
          deleted_at: string | null
          deleted_by: string | null
          discount_amount: number | null
          due_date: string
          email_sent_count: number | null
          first_payment_at: string | null
          group_id: string | null
          id: string
          internal_notes: string | null
          invoice_date: string
          invoice_number: string
          last_reminder_sent: string | null
          late_fee_applied: number | null
          notes: string | null
          organization_id: string
          paid_amount: number | null
          paid_at: string | null
          payment_schedule_id: string | null
          payment_terms: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          student_id: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          updated_by: string | null
          viewed_at: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          billing_address?: Json | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          discount_amount?: number | null
          due_date: string
          email_sent_count?: number | null
          first_payment_at?: string | null
          group_id?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number: string
          last_reminder_sent?: string | null
          late_fee_applied?: number | null
          notes?: string | null
          organization_id: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_schedule_id?: string | null
          payment_terms?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          student_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          updated_by?: string | null
          viewed_at?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          billing_address?: Json | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          discount_amount?: number | null
          due_date?: string
          email_sent_count?: number | null
          first_payment_at?: string | null
          group_id?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number?: string
          last_reminder_sent?: string | null
          late_fee_applied?: number | null
          notes?: string | null
          organization_id?: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_schedule_id?: string | null
          payment_terms?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          student_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          updated_by?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_schedule_id_fkey"
            columns: ["payment_schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      payment_installments: {
        Row: {
          amount_due: number
          created_at: string | null
          created_by: string | null
          due_date: string
          id: string
          installment_number: number
          invoice_id: string | null
          late_fee_amount: number | null
          late_fee_applied_at: string | null
          notes: string | null
          organization_id: string
          paid_amount: number | null
          paid_at: string | null
          payment_ids: string[] | null
          payment_schedule_id: string
          status: Database["public"]["Enums"]["installment_status"] | null
          student_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount_due: number
          created_at?: string | null
          created_by?: string | null
          due_date: string
          id?: string
          installment_number: number
          invoice_id?: string | null
          late_fee_amount?: number | null
          late_fee_applied_at?: string | null
          notes?: string | null
          organization_id: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_ids?: string[] | null
          payment_schedule_id: string
          status?: Database["public"]["Enums"]["installment_status"] | null
          student_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount_due?: number
          created_at?: string | null
          created_by?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          invoice_id?: string | null
          late_fee_amount?: number | null
          late_fee_applied_at?: string | null
          notes?: string | null
          organization_id?: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_ids?: string[] | null
          payment_schedule_id?: string
          status?: Database["public"]["Enums"]["installment_status"] | null
          student_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_installments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_payment_schedule_id_fkey"
            columns: ["payment_schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          api_credentials: Json | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          display_order: number | null
          fees: Json | null
          gateway_config: Json | null
          id: string
          is_active: boolean | null
          limits: Json | null
          method_type: Database["public"]["Enums"]["payment_method"]
          name: string
          organization_id: string
          settings: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          api_credentials?: Json | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          display_order?: number | null
          fees?: Json | null
          gateway_config?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          method_type: Database["public"]["Enums"]["payment_method"]
          name: string
          organization_id: string
          settings?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          api_credentials?: Json | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          display_order?: number | null
          fees?: Json | null
          gateway_config?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          method_type?: Database["public"]["Enums"]["payment_method"]
          name?: string
          organization_id?: string
          settings?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          auto_generate_invoices: boolean | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          due_day_of_month: number | null
          grace_period_days: number | null
          id: string
          installments_count: number
          is_active: boolean | null
          late_fee_amount: number | null
          late_fee_percentage: number | null
          name: string
          organization_id: string
          reminder_days_before: number[] | null
          schedule_type: string
          send_reminders: boolean | null
          start_date: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          auto_generate_invoices?: boolean | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          due_day_of_month?: number | null
          grace_period_days?: number | null
          id?: string
          installments_count?: number
          is_active?: boolean | null
          late_fee_amount?: number | null
          late_fee_percentage?: number | null
          name: string
          organization_id: string
          reminder_days_before?: number[] | null
          schedule_type: string
          send_reminders?: boolean | null
          start_date: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          auto_generate_invoices?: boolean | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          due_day_of_month?: number | null
          grace_period_days?: number | null
          id?: string
          installments_count?: number
          is_active?: boolean | null
          late_fee_amount?: number | null
          late_fee_percentage?: number | null
          name?: string
          organization_id?: string
          reminder_days_before?: number[] | null
          schedule_type?: string
          send_reminders?: boolean | null
          start_date?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          attachment_urls: string[] | null
          bank_details: Json | null
          bank_statement_ref: string | null
          cleared_at: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          deleted_at: string | null
          deleted_by: string | null
          exchange_rate: number | null
          external_reference: string | null
          gateway_response: Json | null
          id: string
          internal_notes: string | null
          invoice_id: string | null
          net_amount: number | null
          notes: string | null
          organization_id: string
          payer_contact: Json | null
          payer_name: string | null
          payment_date: string | null
          payment_method_id: string | null
          payment_method_type: Database["public"]["Enums"]["payment_method"]
          payment_number: string
          processed_at: string | null
          receipt_number: string | null
          receipt_url: string | null
          reconciled: boolean | null
          reconciled_at: string | null
          reconciled_by: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          student_id: string | null
          transaction_fee: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount: number
          attachment_urls?: string[] | null
          bank_details?: Json | null
          bank_statement_ref?: string | null
          cleared_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          exchange_rate?: number | null
          external_reference?: string | null
          gateway_response?: Json | null
          id?: string
          internal_notes?: string | null
          invoice_id?: string | null
          net_amount?: number | null
          notes?: string | null
          organization_id: string
          payer_contact?: Json | null
          payer_name?: string | null
          payment_date?: string | null
          payment_method_id?: string | null
          payment_method_type: Database["public"]["Enums"]["payment_method"]
          payment_number: string
          processed_at?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          reconciled?: boolean | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          student_id?: string | null
          transaction_fee?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number
          attachment_urls?: string[] | null
          bank_details?: Json | null
          bank_statement_ref?: string | null
          cleared_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          exchange_rate?: number | null
          external_reference?: string | null
          gateway_response?: Json | null
          id?: string
          internal_notes?: string | null
          invoice_id?: string | null
          net_amount?: number | null
          notes?: string | null
          organization_id?: string
          payer_contact?: Json | null
          payer_name?: string | null
          payment_date?: string | null
          payment_method_id?: string | null
          payment_method_type?: Database["public"]["Enums"]["payment_method"]
          payment_number?: string
          processed_at?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          reconciled?: boolean | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          student_id?: string | null
          transaction_fee?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      scholarships: {
        Row: {
          academic_year: string | null
          amount: number | null
          application_deadline: string | null
          application_required: boolean | null
          available_slots: number | null
          awarded_count: number | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          eligibility_criteria: Json | null
          household_income_limit: number | null
          id: string
          is_active: boolean | null
          min_grade_requirement: number | null
          name: string
          organization_id: string
          percentage: number | null
          renewable: boolean | null
          renewal_criteria: Json | null
          required_documents: string[] | null
          review_process: Json | null
          scholarship_type: Database["public"]["Enums"]["scholarship_type"]
          updated_at: string | null
          updated_by: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          academic_year?: string | null
          amount?: number | null
          application_deadline?: string | null
          application_required?: boolean | null
          available_slots?: number | null
          awarded_count?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          household_income_limit?: number | null
          id?: string
          is_active?: boolean | null
          min_grade_requirement?: number | null
          name: string
          organization_id: string
          percentage?: number | null
          renewable?: boolean | null
          renewal_criteria?: Json | null
          required_documents?: string[] | null
          review_process?: Json | null
          scholarship_type: Database["public"]["Enums"]["scholarship_type"]
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          academic_year?: string | null
          amount?: number | null
          application_deadline?: string | null
          application_required?: boolean | null
          available_slots?: number | null
          awarded_count?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          household_income_limit?: number | null
          id?: string
          is_active?: boolean | null
          min_grade_requirement?: number | null
          name?: string
          organization_id?: string
          percentage?: number | null
          renewable?: boolean | null
          renewal_criteria?: Json | null
          required_documents?: string[] | null
          review_process?: Json | null
          scholarship_type?: Database["public"]["Enums"]["scholarship_type"]
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scholarships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarships_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarships_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_accounts: {
        Row: {
          account_hold: boolean | null
          auto_pay_enabled: boolean | null
          billing_cycle: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          current_balance: number | null
          days_overdue: number | null
          hold_placed_at: string | null
          hold_placed_by: string | null
          hold_reason: string | null
          id: string
          last_payment_amount: number | null
          last_payment_date: string | null
          organization_id: string
          payment_schedule_id: string | null
          payment_status: string | null
          preferred_payment_method_id: string | null
          reminder_preferences: Json | null
          statement_delivery_method: string | null
          student_id: string
          total_charged: number | null
          total_credits: number | null
          total_paid: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          account_hold?: boolean | null
          auto_pay_enabled?: boolean | null
          billing_cycle?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          days_overdue?: number | null
          hold_placed_at?: string | null
          hold_placed_by?: string | null
          hold_reason?: string | null
          id?: string
          last_payment_amount?: number | null
          last_payment_date?: string | null
          organization_id: string
          payment_schedule_id?: string | null
          payment_status?: string | null
          preferred_payment_method_id?: string | null
          reminder_preferences?: Json | null
          statement_delivery_method?: string | null
          student_id: string
          total_charged?: number | null
          total_credits?: number | null
          total_paid?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          account_hold?: boolean | null
          auto_pay_enabled?: boolean | null
          billing_cycle?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          days_overdue?: number | null
          hold_placed_at?: string | null
          hold_placed_by?: string | null
          hold_reason?: string | null
          id?: string
          last_payment_amount?: number | null
          last_payment_date?: string | null
          organization_id?: string
          payment_schedule_id?: string | null
          payment_status?: string | null
          preferred_payment_method_id?: string | null
          reminder_preferences?: Json | null
          statement_delivery_method?: string | null
          student_id?: string
          total_charged?: number | null
          total_credits?: number | null
          total_paid?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_accounts_hold_placed_by_fkey"
            columns: ["hold_placed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_accounts_payment_schedule_id_fkey"
            columns: ["payment_schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_accounts_preferred_payment_method_id_fkey"
            columns: ["preferred_payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_accounts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_accounts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      group_revenue_analysis: {
        Row: {
          avg_invoice_amount: number | null
          group_id: string | null
          group_name: string | null
          invoice_count: number | null
          organization_id: string | null
          outstanding_amount: number | null
          student_count: number | null
          total_collected: number | null
          total_discounts: number | null
          total_invoiced: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      outstanding_balances: {
        Row: {
          balance: number | null
          first_name: string | null
          last_name: string | null
          last_payment_date: string | null
          organization_id: string | null
          primary_phone: string | null
          risk_level: string | null
          student_id: string | null
          total_invoiced: number | null
          total_paid: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history_summary: {
        Row: {
          avg_payment_amount: number | null
          first_payment: string | null
          last_payment: string | null
          organization_id: string | null
          payment_methods_used: string | null
          student_id: string | null
          student_name: string | null
          total_paid: number | null
          total_payments: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_summary: {
        Row: {
          average_payment: number | null
          currency: string | null
          gross_revenue: number | null
          month: string | null
          net_revenue: number | null
          organization_id: string | null
          total_fees: number | null
          total_payments: number | null
          unique_students: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      anonymize_student_data: {
        Args: { student_id: string }
        Returns: undefined
      }
      apply_late_fees: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_invoice_totals: {
        Args: { inv_id: string }
        Returns: undefined
      }
      calculate_student_balance: {
        Args: { student_uuid: string; org_uuid: string }
        Returns: {
          current_balance: number
          total_charged: number
          total_paid: number
          total_credits: number
          overdue_amount: number
          next_due_date: string
        }[]
      }
      can_modify: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_default_payment_methods: {
        Args: { org_id: string }
        Returns: undefined
      }
      create_default_payment_schedule: {
        Args: { org_id: string }
        Returns: string
      }
      create_finance_test_data: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
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
      }
      generate_finance_module_report: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_organization: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: { required_roles: string[] }
        Returns: boolean
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      refresh_finance_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_finance_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          operation: string
          duration_ms: number
          status: string
        }[]
      }
      validate_finance_data_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          test_name: string
          status: string
          details: string
        }[]
      }
    }
    Enums: {
      discount_type: "percentage" | "fixed_amount"
      installment_status: "pending" | "due" | "paid" | "overdue" | "cancelled"
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "paid"
        | "partially_paid"
        | "overdue"
        | "cancelled"
        | "refunded"
      payment_method:
        | "cash"
        | "card"
        | "bank_transfer"
        | "online"
        | "mobile_money"
        | "crypto"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "refunded"
      scholarship_type: "full" | "partial" | "need_based" | "merit_based"
      transaction_type:
        | "income"
        | "expense"
        | "refund"
        | "adjustment"
        | "fee"
        | "discount"
        | "scholarship"
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
      discount_type: ["percentage", "fixed_amount"],
      installment_status: ["pending", "due", "paid", "overdue", "cancelled"],
      invoice_status: [
        "draft",
        "sent",
        "viewed",
        "paid",
        "partially_paid",
        "overdue",
        "cancelled",
        "refunded",
      ],
      payment_method: [
        "cash",
        "card",
        "bank_transfer",
        "online",
        "mobile_money",
        "crypto",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      scholarship_type: ["full", "partial", "need_based", "merit_based"],
      transaction_type: [
        "income",
        "expense",
        "refund",
        "adjustment",
        "fee",
        "discount",
        "scholarship",
      ],
      user_role: ["superadmin", "admin", "viewer"],
    },
  },
} as const