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
      actual_expenses: {
        Row: {
          account_name: string | null
          account_provider: string | null
          amount: number
          category: string | null
          created_at: string
          currency: string
          description: string | null
          external_id: string
          id: string
          merchant: string | null
          notes: string | null
          posted_on: string
          raw: Json | null
          source: string
          space_id: string | null
          status: string | null
          sub_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_provider?: string | null
          amount: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_id?: string
          id?: string
          merchant?: string | null
          notes?: string | null
          posted_on: string
          raw?: Json | null
          source?: string
          space_id?: string | null
          status?: string | null
          sub_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_provider?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_id?: string
          id?: string
          merchant?: string | null
          notes?: string | null
          posted_on?: string
          raw?: Json | null
          source?: string
          space_id?: string | null
          status?: string | null
          sub_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      allowed_emails: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          note: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          note?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      app_features: {
        Row: {
          category: string
          compliance_notes: string | null
          created_at: string
          current_terms_version: string
          description: string | null
          disclaimer: string | null
          icon: string | null
          id: string
          is_available: boolean
          is_core: boolean
          is_regulated: boolean
          key: string
          name: string
          requires_approval: boolean
          route: string | null
          sort_order: number
          terms_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          compliance_notes?: string | null
          created_at?: string
          current_terms_version?: string
          description?: string | null
          disclaimer?: string | null
          icon?: string | null
          id?: string
          is_available?: boolean
          is_core?: boolean
          is_regulated?: boolean
          key: string
          name: string
          requires_approval?: boolean
          route?: string | null
          sort_order?: number
          terms_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          compliance_notes?: string | null
          created_at?: string
          current_terms_version?: string
          description?: string | null
          disclaimer?: string | null
          icon?: string | null
          id?: string
          is_available?: boolean
          is_core?: boolean
          is_regulated?: boolean
          key?: string
          name?: string
          requires_approval?: boolean
          route?: string | null
          sort_order?: number
          terms_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bank_receipts: {
        Row: {
          amount: number
          counterparty: string | null
          created_at: string
          currency: string
          description: string | null
          external_id: string | null
          id: string
          match_confidence: number | null
          match_status: string
          matched_invoice_id: string | null
          posted_on: string
          raw: Json | null
          reference: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          counterparty?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_id?: string | null
          id?: string
          match_confidence?: number | null
          match_status?: string
          matched_invoice_id?: string | null
          posted_on: string
          raw?: Json | null
          reference?: string | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          counterparty?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_id?: string | null
          id?: string
          match_confidence?: number | null
          match_status?: string
          matched_invoice_id?: string | null
          posted_on?: string
          raw?: Json | null
          reference?: string | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_receipts_matched_invoice_id_fkey"
            columns: ["matched_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_entities: {
        Row: {
          address_lines: string | null
          bank_details: string | null
          created_at: string
          default_currency: string
          default_payment_link: string | null
          default_payment_provider: string | null
          default_terms: string | null
          default_vat_rate: number
          email: string | null
          id: string
          invoice_number_prefix: string | null
          is_default: boolean
          logo_url: string | null
          name: string
          next_invoice_seq: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address_lines?: string | null
          bank_details?: string | null
          created_at?: string
          default_currency?: string
          default_payment_link?: string | null
          default_payment_provider?: string | null
          default_terms?: string | null
          default_vat_rate?: number
          email?: string | null
          id?: string
          invoice_number_prefix?: string | null
          is_default?: boolean
          logo_url?: string | null
          name: string
          next_invoice_seq?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address_lines?: string | null
          bank_details?: string | null
          created_at?: string
          default_currency?: string
          default_payment_link?: string | null
          default_payment_provider?: string | null
          default_terms?: string | null
          default_vat_rate?: number
          email?: string | null
          id?: string
          invoice_number_prefix?: string | null
          is_default?: boolean
          logo_url?: string | null
          name?: string
          next_invoice_seq?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean
          created_at: string | null
          deleted_at: string | null
          description: string | null
          end_time: string
          etag: string | null
          google_calendar_id: string | null
          google_event_id: string | null
          id: string
          last_synced_at: string | null
          location: string | null
          meeting_url: string | null
          space_id: string | null
          start_time: string
          sync_source: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          all_day?: boolean
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          end_time: string
          etag?: string | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          location?: string | null
          meeting_url?: string | null
          space_id?: string | null
          start_time: string
          sync_source?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          all_day?: boolean
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          end_time?: string
          etag?: string | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          location?: string | null
          meeting_url?: string | null
          space_id?: string | null
          start_time?: string
          sync_source?: string | null
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
      consent_audit_log: {
        Row: {
          action: string
          created_at: string
          feature_key: string | null
          id: string
          ip_address: string | null
          payload: Json | null
          performed_by: string | null
          signature_hash: string | null
          terms_version: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          feature_key?: string | null
          id?: string
          ip_address?: string | null
          payload?: Json | null
          performed_by?: string | null
          signature_hash?: string | null
          terms_version?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          feature_key?: string | null
          id?: string
          ip_address?: string | null
          payload?: Json | null
          performed_by?: string | null
          signature_hash?: string | null
          terms_version?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
      credit_scores: {
        Row: {
          created_at: string
          id: string
          max_score: number
          notes: string | null
          provider: string
          rating: string | null
          score: number
          score_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_score?: number
          notes?: string | null
          provider: string
          rating?: string | null
          score: number
          score_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_score?: number
          notes?: string | null
          provider?: string
          rating?: string | null
          score?: number
          score_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address_lines: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          next_invoice_seq: number
          notes: string | null
          phone: string | null
          reference_code: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_lines?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          next_invoice_seq?: number
          notes?: string | null
          phone?: string | null
          reference_code?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_lines?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          next_invoice_seq?: number
          notes?: string | null
          phone?: string | null
          reference_code?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      echo_entries: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          entry_date: string
          entry_time: string | null
          goal_id: string | null
          id: string
          metadata: Json
          project_id: string | null
          raw_voice_text: string | null
          space_id: string | null
          task_id: string | null
          title: string
          type: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_time?: string | null
          goal_id?: string | null
          id?: string
          metadata?: Json
          project_id?: string | null
          raw_voice_text?: string | null
          space_id?: string | null
          task_id?: string | null
          title: string
          type: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_time?: string | null
          goal_id?: string | null
          id?: string
          metadata?: Json
          project_id?: string | null
          raw_voice_text?: string | null
          space_id?: string | null
          task_id?: string | null
          title?: string
          type?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "echo_entries_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echo_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echo_entries_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echo_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
      feature_approval_queue: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: []
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
      google_calendar_channels: {
        Row: {
          account_id: string | null
          calendar_id: string
          channel_id: string
          created_at: string
          expiration: string
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          calendar_id?: string
          channel_id: string
          created_at?: string
          expiration: string
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          calendar_id?: string
          channel_id?: string
          created_at?: string
          expiration?: string
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_connections: {
        Row: {
          access_token: string
          created_at: string
          google_email: string | null
          id: string
          last_sync_at: string | null
          primary_calendar_id: string | null
          refresh_token: string
          scope: string | null
          sync_token: string | null
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          google_email?: string | null
          id?: string
          last_sync_at?: string | null
          primary_calendar_id?: string | null
          refresh_token: string
          scope?: string | null
          sync_token?: string | null
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          google_email?: string | null
          id?: string
          last_sync_at?: string | null
          primary_calendar_id?: string | null
          refresh_token?: string
          scope?: string | null
          sync_token?: string | null
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_subscriptions: {
        Row: {
          account_id: string | null
          background_color: string | null
          created_at: string
          enabled: boolean
          foreground_color: string | null
          google_calendar_id: string
          id: string
          is_primary: boolean
          last_sync_at: string | null
          summary: string | null
          sync_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          background_color?: string | null
          created_at?: string
          enabled?: boolean
          foreground_color?: string | null
          google_calendar_id: string
          id?: string
          is_primary?: boolean
          last_sync_at?: string | null
          summary?: string | null
          sync_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          background_color?: string | null
          created_at?: string
          enabled?: boolean
          foreground_color?: string | null
          google_calendar_id?: string
          id?: string
          is_primary?: boolean
          last_sync_at?: string | null
          summary?: string | null
          sync_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          active_minutes: number | null
          avg_heart_rate: number | null
          calories_burned: number | null
          created_at: string
          distance_meters: number | null
          id: string
          max_heart_rate: number | null
          metric_date: string
          provider: string | null
          raw: Json | null
          resting_heart_rate: number | null
          sleep_minutes: number | null
          sleep_quality: number | null
          source: string
          steps: number | null
          updated_at: string
          user_id: string
          water_ml: number | null
          weight_kg: number | null
        }
        Insert: {
          active_minutes?: number | null
          avg_heart_rate?: number | null
          calories_burned?: number | null
          created_at?: string
          distance_meters?: number | null
          id?: string
          max_heart_rate?: number | null
          metric_date: string
          provider?: string | null
          raw?: Json | null
          resting_heart_rate?: number | null
          sleep_minutes?: number | null
          sleep_quality?: number | null
          source?: string
          steps?: number | null
          updated_at?: string
          user_id: string
          water_ml?: number | null
          weight_kg?: number | null
        }
        Update: {
          active_minutes?: number | null
          avg_heart_rate?: number | null
          calories_burned?: number | null
          created_at?: string
          distance_meters?: number | null
          id?: string
          max_heart_rate?: number | null
          metric_date?: string
          provider?: string | null
          raw?: Json | null
          resting_heart_rate?: number | null
          sleep_minutes?: number | null
          sleep_quality?: number | null
          source?: string
          steps?: number | null
          updated_at?: string
          user_id?: string
          water_ml?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      impact_filters: {
        Row: {
          action_required_only: boolean
          brands: string[]
          created_at: string
          handles: string[]
          id: string
          keywords: string[]
          min_score: number
          people: string[]
          realtime_enabled: boolean
          sources: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          action_required_only?: boolean
          brands?: string[]
          created_at?: string
          handles?: string[]
          id?: string
          keywords?: string[]
          min_score?: number
          people?: string[]
          realtime_enabled?: boolean
          sources?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          action_required_only?: boolean
          brands?: string[]
          created_at?: string
          handles?: string[]
          id?: string
          keywords?: string[]
          min_score?: number
          people?: string[]
          realtime_enabled?: boolean
          sources?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      impact_messages: {
        Row: {
          action_required: boolean
          author: string | null
          author_handle: string | null
          created_at: string
          external_id: string | null
          full_content: string | null
          id: string
          is_archived: boolean
          is_read: boolean
          matched_filters: string[]
          message_at: string
          preview: string
          reason: string | null
          score: number
          scored_at: string
          source: string
          urgency: string
          url: string | null
          user_id: string
        }
        Insert: {
          action_required?: boolean
          author?: string | null
          author_handle?: string | null
          created_at?: string
          external_id?: string | null
          full_content?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          matched_filters?: string[]
          message_at?: string
          preview: string
          reason?: string | null
          score?: number
          scored_at?: string
          source: string
          urgency?: string
          url?: string | null
          user_id: string
        }
        Update: {
          action_required?: boolean
          author?: string | null
          author_handle?: string | null
          created_at?: string
          external_id?: string | null
          full_content?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          matched_filters?: string[]
          message_at?: string
          preview?: string
          reason?: string | null
          score?: number
          scored_at?: string
          source?: string
          urgency?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invite_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          meta: string | null
          position: number
          qty: number
          rate: number
          service: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          meta?: string | null
          position?: number
          qty?: number
          rate?: number
          service?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          meta?: string | null
          position?: number
          qty?: number
          rate?: number
          service?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          bank_receipt_id: string | null
          created_at: string
          id: string
          invoice_id: string
          method: string | null
          notes: string | null
          paid_on: string
          reference: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bank_receipt_id?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          method?: string | null
          notes?: string | null
          paid_on?: string
          reference?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bank_receipt_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string | null
          notes?: string | null
          paid_on?: string
          reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          balance_due: number
          billing_entity_id: string | null
          client_address_lines: string | null
          client_name: string | null
          cost_centre: string | null
          created_at: string
          currency: string
          customer_id: string | null
          due_date: string | null
          email_body: string | null
          email_subject: string | null
          expected_payment_days: number | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          other_charge: number
          paid_at: string | null
          payment_link: string | null
          payment_provider: string | null
          project_id: string | null
          seller_address_lines: string | null
          seller_bank_details: string | null
          seller_name: string | null
          sent_at: string | null
          space_id: string | null
          status: string
          subtotal: number
          terms: string | null
          total: number
          updated_at: string
          user_id: string
          vat_amount: number
          vat_rate: number
          viewed_at: string | null
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          billing_entity_id?: string | null
          client_address_lines?: string | null
          client_name?: string | null
          cost_centre?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          due_date?: string | null
          email_body?: string | null
          email_subject?: string | null
          expected_payment_days?: number | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          other_charge?: number
          paid_at?: string | null
          payment_link?: string | null
          payment_provider?: string | null
          project_id?: string | null
          seller_address_lines?: string | null
          seller_bank_details?: string | null
          seller_name?: string | null
          sent_at?: string | null
          space_id?: string | null
          status?: string
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          user_id: string
          vat_amount?: number
          vat_rate?: number
          viewed_at?: string | null
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          billing_entity_id?: string | null
          client_address_lines?: string | null
          client_name?: string | null
          cost_centre?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          due_date?: string | null
          email_body?: string | null
          email_subject?: string | null
          expected_payment_days?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          other_charge?: number
          paid_at?: string | null
          payment_link?: string | null
          payment_provider?: string | null
          project_id?: string | null
          seller_address_lines?: string | null
          seller_bank_details?: string | null
          seller_name?: string | null
          sent_at?: string | null
          space_id?: string | null
          status?: string
          subtotal?: number
          terms?: string | null
          total?: number
          updated_at?: string
          user_id?: string
          vat_amount?: number
          vat_rate?: number
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_billing_entity_id_fkey"
            columns: ["billing_entity_id"]
            isOneToOne: false
            referencedRelation: "billing_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
          currency: string
          handle: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          currency?: string
          handle?: string | null
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          currency?: string
          handle?: string | null
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
          goal_id: string | null
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
          goal_id?: string | null
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
          goal_id?: string | null
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
            foreignKeyName: "projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          cost_centre: string | null
          created_at: string
          currency: string
          default_qty: number
          default_rate: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          project_id: string | null
          space_id: string | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_centre?: string | null
          created_at?: string
          currency?: string
          default_qty?: number
          default_rate?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          project_id?: string | null
          space_id?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_centre?: string | null
          created_at?: string
          currency?: string
          default_qty?: number
          default_rate?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          project_id?: string | null
          space_id?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          completion_percent: number
          created_at: string | null
          description: string | null
          due_date: string | null
          end_date: string | null
          feature_id: string | null
          id: string
          priority: string | null
          project_id: string | null
          start_date: string | null
          status: string | null
          team_id: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          completion_percent?: number
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          feature_id?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          team_id?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          completion_percent?: number
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          feature_id?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          start_date?: string | null
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
      terra_connections: {
        Row: {
          created_at: string
          id: string
          last_sync_at: string | null
          last_webhook_at: string | null
          provider: string | null
          reference_id: string | null
          scopes: string | null
          status: string
          terra_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_webhook_at?: string | null
          provider?: string | null
          reference_id?: string | null
          scopes?: string | null
          status?: string
          terra_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_webhook_at?: string | null
          provider?: string | null
          reference_id?: string | null
          scopes?: string | null
          status?: string
          terra_user_id?: string | null
          updated_at?: string
          user_id?: string
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
      user_agreements: {
        Row: {
          agreement_version: string
          created_at: string
          email_sent_at: string | null
          id: string
          ip_address: string | null
          pdf_url: string | null
          selected_features: string[]
          signature_hash: string
          signed_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          agreement_version?: string
          created_at?: string
          email_sent_at?: string | null
          id?: string
          ip_address?: string | null
          pdf_url?: string | null
          selected_features?: string[]
          signature_hash: string
          signed_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          agreement_version?: string
          created_at?: string
          email_sent_at?: string | null
          id?: string
          ip_address?: string | null
          pdf_url?: string | null
          selected_features?: string[]
          signature_hash?: string
          signed_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_feature_subscriptions: {
        Row: {
          accepted_at: string | null
          accepted_terms_version: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          feature_key: string
          id: string
          revoke_reason: string | null
          revoked_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_terms_version?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          feature_key: string
          id?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_terms_version?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          feature_key?: string
          id?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
      find_user_by_handle: {
        Args: { _handle: string }
        Returns: {
          avatar_url: string
          handle: string
          id: string
          name: string
        }[]
      }
      has_feature_access: {
        Args: { _feature_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_email_allowed: { Args: { _email: string }; Returns: boolean }
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
