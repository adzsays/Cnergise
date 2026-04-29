export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounting_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_closed: boolean
          name: string
          space_id: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_closed?: boolean
          name: string
          space_id?: string | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_closed?: boolean
          name?: string
          space_id?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_periods_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_search_history: {
        Row: {
          created_at: string
          id: string
          metadata_ids: string[] | null
          query: string
          results: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata_ids?: string[] | null
          query: string
          results?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata_ids?: string[] | null
          query?: string
          results?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          location: string | null
          space_id: string | null
          start_time: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          space_id?: string | null
          start_time: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          space_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_private: boolean | null
          name: string
          space_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          space_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          space_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string | null
          content: string
          created_at: string
          id: string
          sender_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          content: string
          created_at?: string
          id?: string
          sender_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string | null
          content?: string
          created_at?: string
          id?: string
          sender_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          space_id: string | null
          telegram_username: string | null
          title: string | null
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          space_id?: string | null
          telegram_username?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          space_id?: string | null
          telegram_username?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          body: string
          created_at: string | null
          from_email: string | null
          id: string
          sent_at: string | null
          space_id: string | null
          status: string | null
          subject: string
          to_email: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          from_email?: string | null
          id?: string
          sent_at?: string | null
          space_id?: string | null
          status?: string | null
          subject: string
          to_email: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          from_email?: string | null
          id?: string
          sent_at?: string | null
          space_id?: string | null
          status?: string | null
          subject?: string
          to_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          component: string | null
          created_at: string
          error_context: Json | null
          error_message: string
          error_stack: string | null
          id: string
          severity: string
          url: string | null
          user_id: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string
          error_context?: Json | null
          error_message: string
          error_stack?: string | null
          id?: string
          severity?: string
          url?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string
          error_context?: Json | null
          error_message?: string
          error_stack?: string | null
          id?: string
          severity?: string
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      external_messages: {
        Row: {
          contact_id: string | null
          content: string
          created_at: string
          direction: string
          external_message_id: string | null
          id: string
          platform: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          content: string
          created_at?: string
          direction: string
          external_message_id?: string | null
          id?: string
          platform: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          content?: string
          created_at?: string
          direction?: string
          external_message_id?: string | null
          id?: string
          platform?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "features_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          account_class: string | null
          account_code: string | null
          balance: number
          category: string | null
          cost_centre: string | null
          created_at: string
          credit_limit: number | null
          currency: string
          group_name: string
          id: string
          interest_rate: number | null
          last_payment_applied_date: string | null
          loan_start_date: string | null
          monthly_payment: number | null
          name: string
          opening_balance: number
          opening_balance_date: string | null
          original_principal: number | null
          payment_day: number | null
          space_id: string | null
          term_months: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_class?: string | null
          account_code?: string | null
          balance?: number
          category?: string | null
          cost_centre?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string
          group_name: string
          id?: string
          interest_rate?: number | null
          last_payment_applied_date?: string | null
          loan_start_date?: string | null
          monthly_payment?: number | null
          name: string
          opening_balance?: number
          opening_balance_date?: string | null
          original_principal?: number | null
          payment_day?: number | null
          space_id?: string | null
          term_months?: number | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_class?: string | null
          account_code?: string | null
          balance?: number
          category?: string | null
          cost_centre?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string
          group_name?: string
          id?: string
          interest_rate?: number | null
          last_payment_applied_date?: string | null
          loan_start_date?: string | null
          monthly_payment?: number | null
          name?: string
          opening_balance?: number
          opening_balance_date?: string | null
          original_principal?: number | null
          payment_day?: number | null
          space_id?: string | null
          term_months?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          cost_centre: string | null
          created_at: string
          daily: number
          date: number
          end_date: string | null
          frequency: string | null
          group_name: string
          id: string
          monthly: number
          percentage: number
          projections: Json
          space_id: string | null
          start_date: string | null
          subcategory: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          cost_centre?: string | null
          created_at?: string
          daily?: number
          date: number
          end_date?: string | null
          frequency?: string | null
          group_name: string
          id?: string
          monthly: number
          percentage?: number
          projections?: Json
          space_id?: string | null
          start_date?: string | null
          subcategory: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          cost_centre?: string | null
          created_at?: string
          daily?: number
          date?: number
          end_date?: string | null
          frequency?: string | null
          group_name?: string
          id?: string
          monthly?: number
          percentage?: number
          projections?: Json
          space_id?: string | null
          start_date?: string | null
          subcategory?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string
          completed_date: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          progress: number
          space_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          completed_date?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          progress?: number
          space_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed_date?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          progress?: number
          space_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          description: string | null
          entry_date: string
          id: string
          is_opening_balance: boolean
          reference_number: string | null
          space_id: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entry_date: string
          id?: string
          is_opening_balance?: boolean
          reference_number?: string | null
          space_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          is_opening_balance?: boolean
          reference_number?: string | null
          space_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          created_at: string
          credit_amount: number
          debit_amount: number
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit_amount?: number
          debit_amount?: number
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit_amount?: number
          debit_amount?: number
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_courses: {
        Row: {
          certificate_url: string | null
          completed_at: string | null
          course_url: string | null
          created_at: string
          description: string | null
          estimated_hours: number | null
          external_course_id: string | null
          id: string
          image_url: string | null
          instructor: string | null
          last_synced_at: string | null
          progress_percent: number | null
          provider: string
          space_id: string | null
          started_at: string | null
          status: string
          synced_from_provider: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string | null
          course_url?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          external_course_id?: string | null
          id?: string
          image_url?: string | null
          instructor?: string | null
          last_synced_at?: string | null
          progress_percent?: number | null
          provider?: string
          space_id?: string | null
          started_at?: string | null
          status?: string
          synced_from_provider?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string | null
          course_url?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          external_course_id?: string | null
          id?: string
          image_url?: string | null
          instructor?: string | null
          last_synced_at?: string | null
          progress_percent?: number | null
          provider?: string
          space_id?: string | null
          started_at?: string | null
          status?: string
          synced_from_provider?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_courses_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_rate_terms: {
        Row: {
          account_id: string
          created_at: string
          id: string
          interest_rate: number
          notes: string | null
          payment_override: number | null
          rate_type: string
          sequence: number
          start_date: string
          term_months: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          interest_rate?: number
          notes?: string | null
          payment_override?: number | null
          rate_type?: string
          sequence?: number
          start_date: string
          term_months?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          interest_rate?: number
          notes?: string | null
          payment_override?: number | null
          rate_type?: string
          sequence?: number
          start_date?: string
          term_months?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_rate_terms_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string
          error_message: string | null
          execution_time_ms: number
          id: string
          metadata: Json | null
          operation_name: string
          operation_type: string
          success: boolean
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_time_ms: number
          id?: string
          metadata?: Json | null
          operation_name: string
          operation_type: string
          success?: boolean
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number
          id?: string
          metadata?: Json | null
          operation_name?: string
          operation_type?: string
          success?: boolean
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      physical_assets: {
        Row: {
          asset_type: string
          created_at: string
          group_name: string
          id: string
          space_id: string | null
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          asset_type: string
          created_at?: string
          group_name: string
          id?: string
          space_id?: string | null
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          asset_type?: string
          created_at?: string
          group_name?: string
          id?: string
          space_id?: string | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "physical_assets_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          space_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          space_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          space_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          feature_id: string | null
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          team_id: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          feature_id?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          team_id?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          feature_id?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          role: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      unified_metadata: {
        Row: {
          ai_summary: string | null
          amount: number | null
          app_type: string | null
          created_at: string
          date_occurred: string | null
          description: string | null
          external_url: string | null
          id: string
          is_notification: boolean | null
          keywords: string[] | null
          notification_priority: string | null
          notification_read: boolean | null
          notification_read_at: string | null
          participants: string[] | null
          source_id: string
          source_table: string
          source_type: string
          space_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          amount?: number | null
          app_type?: string | null
          created_at?: string
          date_occurred?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          is_notification?: boolean | null
          keywords?: string[] | null
          notification_priority?: string | null
          notification_read?: boolean | null
          notification_read_at?: string | null
          participants?: string[] | null
          source_id: string
          source_table: string
          source_type: string
          space_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          amount?: number | null
          app_type?: string | null
          created_at?: string
          date_occurred?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          is_notification?: boolean | null
          keywords?: string[] | null
          notification_priority?: string | null
          notification_read?: boolean | null
          notification_read_at?: string | null
          participants?: string[] | null
          source_id?: string
          source_table?: string
          source_type?: string
          space_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_metadata_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_stats: {
        Row: {
          created_at: string
          date: string
          estimated_cost_units: number
          id: string
          operation_count: number
          operation_type: string
          total_time_ms: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          estimated_cost_units?: number
          id?: string
          operation_count?: number
          operation_type: string
          total_time_ms?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          estimated_cost_units?: number
          id?: string
          operation_count?: number
          operation_type?: string
          total_time_ms?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          broker_account_id: string | null
          broker_api_key: string | null
          broker_api_secret: string | null
          broker_name: string | null
          calendar_oauth_token: string | null
          calendar_provider: string | null
          calendar_refresh_token: string | null
          coursera_oauth_token: string | null
          coursera_refresh_token: string | null
          coursera_user_id: string | null
          created_at: string
          email_imap_host: string | null
          email_imap_port: number | null
          email_oauth_token: string | null
          email_provider: string | null
          email_smtp_host: string | null
          email_smtp_password: string | null
          email_smtp_port: number | null
          email_smtp_user: string | null
          id: string
          telegram_bot_token: string | null
          updated_at: string
          user_id: string
          whatsapp_access_token: string | null
          whatsapp_phone_number_id: string | null
        }
        Insert: {
          broker_account_id?: string | null
          broker_api_key?: string | null
          broker_api_secret?: string | null
          broker_name?: string | null
          calendar_oauth_token?: string | null
          calendar_provider?: string | null
          calendar_refresh_token?: string | null
          coursera_oauth_token?: string | null
          coursera_refresh_token?: string | null
          coursera_user_id?: string | null
          created_at?: string
          email_imap_host?: string | null
          email_imap_port?: number | null
          email_oauth_token?: string | null
          email_provider?: string | null
          email_smtp_host?: string | null
          email_smtp_password?: string | null
          email_smtp_port?: number | null
          email_smtp_user?: string | null
          id?: string
          telegram_bot_token?: string | null
          updated_at?: string
          user_id: string
          whatsapp_access_token?: string | null
          whatsapp_phone_number_id?: string | null
        }
        Update: {
          broker_account_id?: string | null
          broker_api_key?: string | null
          broker_api_secret?: string | null
          broker_name?: string | null
          calendar_oauth_token?: string | null
          calendar_provider?: string | null
          calendar_refresh_token?: string | null
          coursera_oauth_token?: string | null
          coursera_refresh_token?: string | null
          coursera_user_id?: string | null
          created_at?: string
          email_imap_host?: string | null
          email_imap_port?: number | null
          email_oauth_token?: string | null
          email_provider?: string | null
          email_smtp_host?: string | null
          email_smtp_password?: string | null
          email_smtp_port?: number | null
          email_smtp_user?: string | null
          id?: string
          telegram_bot_token?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_access_token?: string | null
          whatsapp_phone_number_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
