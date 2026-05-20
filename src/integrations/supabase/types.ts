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
          cost_centre: string | null
          created_at: string
          currency: string
          description: string | null
          external_id: string
          id: string
          mapped_cashflow_id: string | null
          mapping_confidence: number | null
          mapping_source: string | null
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
          cost_centre?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_id?: string
          id?: string
          mapped_cashflow_id?: string | null
          mapping_confidence?: number | null
          mapping_source?: string | null
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
          cost_centre?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_id?: string
          id?: string
          mapped_cashflow_id?: string | null
          mapping_confidence?: number | null
          mapping_source?: string | null
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
        Relationships: [
          {
            foreignKeyName: "actual_expenses_mapped_cashflow_id_fkey"
            columns: ["mapped_cashflow_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_brief_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          asked_at: string
          brief_id: string | null
          context: Json
          id: string
          question: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          asked_at?: string
          brief_id?: string | null
          context?: Json
          id?: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          asked_at?: string
          brief_id?: string | null
          context?: Json
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_brief_questions_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "ai_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_briefs: {
        Row: {
          actions: Json
          body: string
          confidence: number
          created_at: string
          dismissed_at: string | null
          generated_for_date: string
          headline: string
          id: string
          model: string | null
          related_ids: Json
          scope: string
          user_id: string
        }
        Insert: {
          actions?: Json
          body: string
          confidence?: number
          created_at?: string
          dismissed_at?: string | null
          generated_for_date?: string
          headline: string
          id?: string
          model?: string | null
          related_ids?: Json
          scope: string
          user_id: string
        }
        Update: {
          actions?: Json
          body?: string
          confidence?: number
          created_at?: string
          dismissed_at?: string | null
          generated_for_date?: string
          headline?: string
          id?: string
          model?: string | null
          related_ids?: Json
          scope?: string
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
      ai_trade_signals: {
        Row: {
          asset_class: string | null
          conviction: number | null
          created_at: string
          expires_at: string | null
          generated_at: string
          id: string
          rationale: string | null
          risk_assessment: Json | null
          side: string
          status: string
          strategy_id: string | null
          suggested_limit_price: number | null
          suggested_quantity: number | null
          suggested_stop_loss: number | null
          suggested_take_profit: number | null
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_class?: string | null
          conviction?: number | null
          created_at?: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          rationale?: string | null
          risk_assessment?: Json | null
          side: string
          status?: string
          strategy_id?: string | null
          suggested_limit_price?: number | null
          suggested_quantity?: number | null
          suggested_stop_loss?: number | null
          suggested_take_profit?: number | null
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_class?: string | null
          conviction?: number | null
          created_at?: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          rationale?: string | null
          risk_assessment?: Json | null
          side?: string
          status?: string
          strategy_id?: string | null
          suggested_limit_price?: number | null
          suggested_quantity?: number | null
          suggested_stop_loss?: number | null
          suggested_take_profit?: number | null
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_trade_signals_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "trading_strategies"
            referencedColumns: ["id"]
          },
        ]
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
      alpaca_connections: {
        Row: {
          api_key_id: string | null
          api_secret: string | null
          base_url: string | null
          created_at: string
          demo_mode: boolean
          environment: string
          id: string
          last_error: string | null
          last_synced_at: string | null
          nickname: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          api_secret?: string | null
          base_url?: string | null
          created_at?: string
          demo_mode?: boolean
          environment?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          nickname?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          api_secret?: string | null
          base_url?: string | null
          created_at?: string
          demo_mode?: boolean
          environment?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          nickname?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
      broker_orders: {
        Row: {
          account_id: string | null
          asset_class: string | null
          avg_fill_price: number | null
          broker: string
          broker_order_id: string | null
          created_at: string
          filled_at: string | null
          filled_quantity: number | null
          id: string
          limit_price: number | null
          order_type: string
          quantity: number
          rationale: string | null
          raw: Json | null
          side: string
          signal_id: string | null
          status: string
          stop_price: number | null
          strategy_id: string | null
          submitted_at: string | null
          symbol: string
          tif: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          asset_class?: string | null
          avg_fill_price?: number | null
          broker?: string
          broker_order_id?: string | null
          created_at?: string
          filled_at?: string | null
          filled_quantity?: number | null
          id?: string
          limit_price?: number | null
          order_type?: string
          quantity: number
          rationale?: string | null
          raw?: Json | null
          side: string
          signal_id?: string | null
          status?: string
          stop_price?: number | null
          strategy_id?: string | null
          submitted_at?: string | null
          symbol: string
          tif?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          asset_class?: string | null
          avg_fill_price?: number | null
          broker?: string
          broker_order_id?: string | null
          created_at?: string
          filled_at?: string | null
          filled_quantity?: number | null
          id?: string
          limit_price?: number | null
          order_type?: string
          quantity?: number
          rationale?: string | null
          raw?: Json | null
          side?: string
          signal_id?: string | null
          status?: string
          stop_price?: number | null
          strategy_id?: string | null
          submitted_at?: string | null
          symbol?: string
          tif?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      broker_positions: {
        Row: {
          account_id: string | null
          asset_class: string | null
          avg_cost: number | null
          broker: string
          created_at: string
          currency: string | null
          id: string
          market_price: number | null
          market_value: number | null
          quantity: number
          raw: Json | null
          realized_pnl: number | null
          symbol: string
          synced_at: string
          unrealized_pnl: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          asset_class?: string | null
          avg_cost?: number | null
          broker?: string
          created_at?: string
          currency?: string | null
          id?: string
          market_price?: number | null
          market_value?: number | null
          quantity?: number
          raw?: Json | null
          realized_pnl?: number | null
          symbol: string
          synced_at?: string
          unrealized_pnl?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          asset_class?: string | null
          avg_cost?: number | null
          broker?: string
          created_at?: string
          currency?: string | null
          id?: string
          market_price?: number | null
          market_value?: number | null
          quantity?: number
          raw?: Json | null
          realized_pnl?: number | null
          symbol?: string
          synced_at?: string
          unrealized_pnl?: number | null
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
      cashflow_mapping_rules: {
        Row: {
          account_id: string | null
          cashflow_id: string | null
          cost_centre: string | null
          created_at: string
          id: string
          last_applied_at: string | null
          match_type: string
          match_value: string
          max_amount: number | null
          min_amount: number | null
          priority: number
          times_applied: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          cashflow_id?: string | null
          cost_centre?: string | null
          created_at?: string
          id?: string
          last_applied_at?: string | null
          match_type?: string
          match_value: string
          max_amount?: number | null
          min_amount?: number | null
          priority?: number
          times_applied?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          cashflow_id?: string | null
          cost_centre?: string | null
          created_at?: string
          id?: string
          last_applied_at?: string | null
          match_type?: string
          match_value?: string
          max_amount?: number | null
          min_amount?: number | null
          priority?: number
          times_applied?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_mapping_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_mapping_rules_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
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
      device_push_tokens: {
        Row: {
          created_at: string
          device_label: string | null
          id: string
          last_used_at: string | null
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          platform?: string
          token?: string
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
      expense_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          member_type: string
          member_value: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          member_type: string
          member_value: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          member_type?: string
          member_value?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_groups: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
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
          cash_flow_section: string
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
          cash_flow_section?: string
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
          cash_flow_section?: string
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
          last_sync_error: string | null
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
          last_sync_error?: string | null
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
          last_sync_error?: string | null
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
      health_goals: {
        Row: {
          baseline_value: number | null
          created_at: string
          goal_type: Database["public"]["Enums"]["health_goal_type"]
          id: string
          is_active: boolean
          linked_plan_goal_id: string | null
          notes: string | null
          target_date: string | null
          target_unit: string | null
          target_value: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_value?: number | null
          created_at?: string
          goal_type?: Database["public"]["Enums"]["health_goal_type"]
          id?: string
          is_active?: boolean
          linked_plan_goal_id?: string | null
          notes?: string | null
          target_date?: string | null
          target_unit?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_value?: number | null
          created_at?: string
          goal_type?: Database["public"]["Enums"]["health_goal_type"]
          id?: string
          is_active?: boolean
          linked_plan_goal_id?: string | null
          notes?: string | null
          target_date?: string | null
          target_unit?: string | null
          target_value?: number | null
          title?: string
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
      health_vitals: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          recorded_at: string
          unit: string | null
          updated_at: string
          user_id: string
          value: number
          vital_type: Database["public"]["Enums"]["vital_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          unit?: string | null
          updated_at?: string
          user_id: string
          value: number
          vital_type: Database["public"]["Enums"]["vital_type"]
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
          value?: number
          vital_type?: Database["public"]["Enums"]["vital_type"]
        }
        Relationships: []
      }
      ibkr_connections: {
        Row: {
          access_token: string | null
          account_id: string | null
          api_token: string | null
          created_at: string
          demo_mode: boolean
          environment: string
          expires_at: string | null
          gateway_url: string | null
          id: string
          last_error: string | null
          last_synced_at: string | null
          nickname: string | null
          refresh_token: string | null
          status: string
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          api_token?: string | null
          created_at?: string
          demo_mode?: boolean
          environment?: string
          expires_at?: string | null
          gateway_url?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          nickname?: string | null
          refresh_token?: string | null
          status?: string
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          api_token?: string | null
          created_at?: string
          demo_mode?: boolean
          environment?: string
          expires_at?: string | null
          gateway_url?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          nickname?: string | null
          refresh_token?: string | null
          status?: string
          token_type?: string | null
          updated_at?: string
          user_id?: string
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
          notified_at: string | null
          preview: string
          reason: string | null
          score: number
          scored_at: string
          source: string
          suggested_reply: string | null
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
          notified_at?: string | null
          preview: string
          reason?: string | null
          score?: number
          scored_at?: string
          source: string
          suggested_reply?: string | null
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
          notified_at?: string | null
          preview?: string
          reason?: string | null
          score?: number
          scored_at?: string
          source?: string
          suggested_reply?: string | null
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
      listening_agent_settings: {
        Row: {
          created_at: string
          digest_hour: number
          enabled: boolean
          id: string
          last_digest_at: string | null
          last_scan_at: string | null
          min_score: number
          prompt_digest: boolean
          prompt_floating: boolean
          prompt_push: boolean
          source_email: boolean
          source_messaging: boolean
          source_social: boolean
          trigger_action_required: boolean
          trigger_keywords: boolean
          trigger_mentions: boolean
          trigger_vip: boolean
          updated_at: string
          user_id: string
          vip_handles: string[]
        }
        Insert: {
          created_at?: string
          digest_hour?: number
          enabled?: boolean
          id?: string
          last_digest_at?: string | null
          last_scan_at?: string | null
          min_score?: number
          prompt_digest?: boolean
          prompt_floating?: boolean
          prompt_push?: boolean
          source_email?: boolean
          source_messaging?: boolean
          source_social?: boolean
          trigger_action_required?: boolean
          trigger_keywords?: boolean
          trigger_mentions?: boolean
          trigger_vip?: boolean
          updated_at?: string
          user_id: string
          vip_handles?: string[]
        }
        Update: {
          created_at?: string
          digest_hour?: number
          enabled?: boolean
          id?: string
          last_digest_at?: string | null
          last_scan_at?: string | null
          min_score?: number
          prompt_digest?: boolean
          prompt_floating?: boolean
          prompt_push?: boolean
          source_email?: boolean
          source_messaging?: boolean
          source_social?: boolean
          trigger_action_required?: boolean
          trigger_keywords?: boolean
          trigger_mentions?: boolean
          trigger_vip?: boolean
          updated_at?: string
          user_id?: string
          vip_handles?: string[]
        }
        Relationships: []
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
      mood_log: {
        Row: {
          created_at: string
          energy_score: number | null
          id: string
          logged_at: string
          mood_score: number | null
          notes: string | null
          stress_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_score?: number | null
          id?: string
          logged_at?: string
          mood_score?: number | null
          notes?: string | null
          stress_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          energy_score?: number | null
          id?: string
          logged_at?: string
          mood_score?: number | null
          notes?: string | null
          stress_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          default_lead_minutes: number
          email_enabled: boolean
          event_lead_minutes: number
          in_app_enabled: boolean
          native_push_enabled: boolean
          payment_lead_minutes: number
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          task_lead_minutes: number
          updated_at: string
          user_id: string
          web_push_enabled: boolean
        }
        Insert: {
          created_at?: string
          default_lead_minutes?: number
          email_enabled?: boolean
          event_lead_minutes?: number
          in_app_enabled?: boolean
          native_push_enabled?: boolean
          payment_lead_minutes?: number
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          task_lead_minutes?: number
          updated_at?: string
          user_id: string
          web_push_enabled?: boolean
        }
        Update: {
          created_at?: string
          default_lead_minutes?: number
          email_enabled?: boolean
          event_lead_minutes?: number
          in_app_enabled?: boolean
          native_push_enabled?: boolean
          payment_lead_minutes?: number
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          task_lead_minutes?: number
          updated_at?: string
          user_id?: string
          web_push_enabled?: boolean
        }
        Relationships: []
      }
      nutrition_log: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string
          fat_g: number | null
          fiber_g: number | null
          food_name: string
          id: string
          logged_at: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes: string | null
          protein_g: number | null
          servings: number | null
          source: string | null
          updated_at: string
          user_id: string
          water_ml: number | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_name: string
          id?: string
          logged_at?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          protein_g?: number | null
          servings?: number | null
          source?: string | null
          updated_at?: string
          user_id: string
          water_ml?: number | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_name?: string
          id?: string
          logged_at?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          protein_g?: number | null
          servings?: number | null
          source?: string | null
          updated_at?: string
          user_id?: string
          water_ml?: number | null
        }
        Relationships: []
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
      reminders: {
        Row: {
          channels: string[]
          created_at: string
          delivery_status: Json | null
          description: string | null
          external_url: string | null
          id: string
          lead_minutes: number | null
          remind_at: string
          sent_at: string | null
          source_id: string | null
          source_table: string | null
          source_type: string
          title: string
          user_id: string
        }
        Insert: {
          channels?: string[]
          created_at?: string
          delivery_status?: Json | null
          description?: string | null
          external_url?: string | null
          id?: string
          lead_minutes?: number | null
          remind_at: string
          sent_at?: string | null
          source_id?: string | null
          source_table?: string | null
          source_type: string
          title: string
          user_id: string
        }
        Update: {
          channels?: string[]
          created_at?: string
          delivery_status?: Json | null
          description?: string | null
          external_url?: string | null
          id?: string
          lead_minutes?: number | null
          remind_at?: string
          sent_at?: string | null
          source_id?: string | null
          source_table?: string | null
          source_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_profiles: {
        Row: {
          allow_options: boolean
          allow_short: boolean
          assessed_at: string | null
          assessment_inputs: Json | null
          created_at: string
          default_stop_loss_pct: number
          default_take_profit_pct: number
          id: string
          max_daily_loss_pct: number
          max_drawdown_pct: number
          max_leverage: number
          max_position_pct: number
          max_sector_pct: number
          risk_band: string | null
          risk_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_options?: boolean
          allow_short?: boolean
          assessed_at?: string | null
          assessment_inputs?: Json | null
          created_at?: string
          default_stop_loss_pct?: number
          default_take_profit_pct?: number
          id?: string
          max_daily_loss_pct?: number
          max_drawdown_pct?: number
          max_leverage?: number
          max_position_pct?: number
          max_sector_pct?: number
          risk_band?: string | null
          risk_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_options?: boolean
          allow_short?: boolean
          assessed_at?: string | null
          assessment_inputs?: Json | null
          created_at?: string
          default_stop_loss_pct?: number
          default_take_profit_pct?: number
          id?: string
          max_daily_loss_pct?: number
          max_drawdown_pct?: number
          max_leverage?: number
          max_position_pct?: number
          max_sector_pct?: number
          risk_band?: string | null
          risk_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean
          notes: string | null
          operation: string
          service: string
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          operation?: string
          service: string
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          operation?: string
          service?: string
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_usage_events: {
        Row: {
          created_at: string
          currency: string
          function_name: string | null
          id: string
          metadata: Json
          operation: string
          service: string
          total_cost: number
          unit_cost: number
          units: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          function_name?: string | null
          id?: string
          metadata?: Json
          operation?: string
          service: string
          total_cost?: number
          unit_cost?: number
          units?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          function_name?: string | null
          id?: string
          metadata?: Json
          operation?: string
          service?: string
          total_cost?: number
          unit_cost?: number
          units?: number
          user_id?: string | null
        }
        Relationships: []
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
      strategy_bundle_items: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          strategy_id: string
          user_id: string
          weight_pct: number
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          strategy_id: string
          user_id: string
          weight_pct?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          strategy_id?: string
          user_id?: string
          weight_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategy_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "strategy_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_bundle_items_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "trading_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_bundles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          target_risk_band: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          target_risk_band?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          target_risk_band?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategy_performance_snapshots: {
        Row: {
          benchmark_return_pct: number | null
          bundle_id: string | null
          created_at: string
          cumulative_return_pct: number | null
          id: string
          max_drawdown_pct: number | null
          metrics: Json | null
          notes: string | null
          return_pct: number | null
          sharpe_ratio: number | null
          snapshot_date: string
          strategy_id: string | null
          trades_count: number | null
          user_id: string
          win_rate_pct: number | null
        }
        Insert: {
          benchmark_return_pct?: number | null
          bundle_id?: string | null
          created_at?: string
          cumulative_return_pct?: number | null
          id?: string
          max_drawdown_pct?: number | null
          metrics?: Json | null
          notes?: string | null
          return_pct?: number | null
          sharpe_ratio?: number | null
          snapshot_date?: string
          strategy_id?: string | null
          trades_count?: number | null
          user_id: string
          win_rate_pct?: number | null
        }
        Update: {
          benchmark_return_pct?: number | null
          bundle_id?: string | null
          created_at?: string
          cumulative_return_pct?: number | null
          id?: string
          max_drawdown_pct?: number | null
          metrics?: Json | null
          notes?: string | null
          return_pct?: number | null
          sharpe_ratio?: number | null
          snapshot_date?: string
          strategy_id?: string | null
          trades_count?: number | null
          user_id?: string
          win_rate_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "strategy_performance_snapshots_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "strategy_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_performance_snapshots_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "trading_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      trading_strategies: {
        Row: {
          ai_prompt: string | null
          asset_universe: string[] | null
          auto_execute: boolean
          created_at: string
          description: string | null
          id: string
          last_run_at: string | null
          max_position_pct: number | null
          name: string
          schedule: string | null
          status: string
          stop_loss_pct: number | null
          strategy_type: string
          take_profit_pct: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_prompt?: string | null
          asset_universe?: string[] | null
          auto_execute?: boolean
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          max_position_pct?: number | null
          name: string
          schedule?: string | null
          status?: string
          stop_loss_pct?: number | null
          strategy_type?: string
          take_profit_pct?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_prompt?: string | null
          asset_universe?: string[] | null
          auto_execute?: boolean
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          max_position_pct?: number | null
          name?: string
          schedule?: string | null
          status?: string
          stop_loss_pct?: number | null
          strategy_type?: string
          take_profit_pct?: number | null
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
      visitor_chat_knowledge: {
        Row: {
          content: string
          created_at: string
          enabled: boolean
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      visitor_chat_messages: {
        Row: {
          admin_user_id: string | null
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          admin_user_id?: string | null
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          admin_user_id?: string | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visitor_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_chat_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          last_message_at: string
          page_url: string | null
          session_token: string
          status: string
          unread_admin_count: number
          updated_at: string
          user_agent: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          last_message_at?: string
          page_url?: string | null
          session_token: string
          status?: string
          unread_admin_count?: number
          updated_at?: string
          user_agent?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          last_message_at?: string
          page_url?: string | null
          session_token?: string
          status?: string
          unread_admin_count?: number
          updated_at?: string
          user_agent?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      web_push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      google_calendar_connections_decrypted: {
        Row: {
          access_token: string | null
          created_at: string | null
          google_email: string | null
          id: string | null
          last_sync_at: string | null
          last_sync_error: string | null
          primary_calendar_id: string | null
          refresh_token: string | null
          scope: string | null
          sync_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: never
          created_at?: string | null
          google_email?: string | null
          id?: string | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          primary_calendar_id?: string | null
          refresh_token?: never
          scope?: string | null
          sync_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: never
          created_at?: string | null
          google_email?: string | null
          id?: string | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          primary_calendar_id?: string | null
          refresh_token?: never
          scope?: string | null
          sync_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_integrations_decrypted: {
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
          created_at: string | null
          email_imap_host: string | null
          email_imap_port: number | null
          email_oauth_token: string | null
          email_provider: string | null
          email_smtp_host: string | null
          email_smtp_password: string | null
          email_smtp_port: number | null
          email_smtp_user: string | null
          id: string | null
          telegram_bot_token: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp_access_token: string | null
          whatsapp_phone_number_id: string | null
        }
        Insert: {
          broker_account_id?: string | null
          broker_api_key?: never
          broker_api_secret?: never
          broker_name?: string | null
          calendar_oauth_token?: never
          calendar_provider?: string | null
          calendar_refresh_token?: never
          coursera_oauth_token?: never
          coursera_refresh_token?: never
          coursera_user_id?: string | null
          created_at?: string | null
          email_imap_host?: string | null
          email_imap_port?: number | null
          email_oauth_token?: never
          email_provider?: string | null
          email_smtp_host?: string | null
          email_smtp_password?: never
          email_smtp_port?: number | null
          email_smtp_user?: string | null
          id?: string | null
          telegram_bot_token?: never
          updated_at?: string | null
          user_id?: string | null
          whatsapp_access_token?: never
          whatsapp_phone_number_id?: string | null
        }
        Update: {
          broker_account_id?: string | null
          broker_api_key?: never
          broker_api_secret?: never
          broker_name?: string | null
          calendar_oauth_token?: never
          calendar_provider?: string | null
          calendar_refresh_token?: never
          coursera_oauth_token?: never
          coursera_refresh_token?: never
          coursera_user_id?: string | null
          created_at?: string | null
          email_imap_host?: string | null
          email_imap_port?: number | null
          email_oauth_token?: never
          email_provider?: string | null
          email_smtp_host?: string | null
          email_smtp_password?: never
          email_smtp_port?: number | null
          email_smtp_user?: string | null
          id?: string | null
          telegram_bot_token?: never
          updated_at?: string | null
          user_id?: string | null
          whatsapp_access_token?: never
          whatsapp_phone_number_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _app_credential_key: { Args: never; Returns: string }
      decrypt_credential: { Args: { ciphertext: string }; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      encrypt_credential: { Args: { plaintext: string }; Returns: string }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      find_user_by_handle: {
        Args: { _handle: string }
        Returns: {
          avatar_url: string
          handle: string
          id: string
          name: string
        }[]
      }
      get_cron_secret: { Args: never; Returns: string }
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
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      normalize_txn_text: { Args: { _text: string }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      health_goal_type:
        | "weight_loss"
        | "weight_gain"
        | "maintain"
        | "strength"
        | "endurance"
        | "nutrition"
        | "sleep"
        | "custom"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack" | "drink"
      vital_type:
        | "bp_systolic"
        | "bp_diastolic"
        | "glucose"
        | "cholesterol_total"
        | "cholesterol_ldl"
        | "cholesterol_hdl"
        | "triglycerides"
        | "resting_hr"
        | "hrv"
        | "spo2"
        | "body_temp"
        | "body_fat_pct"
        | "muscle_mass_kg"
        | "waist_cm"
        | "custom"
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
      health_goal_type: [
        "weight_loss",
        "weight_gain",
        "maintain",
        "strength",
        "endurance",
        "nutrition",
        "sleep",
        "custom",
      ],
      meal_type: ["breakfast", "lunch", "dinner", "snack", "drink"],
      vital_type: [
        "bp_systolic",
        "bp_diastolic",
        "glucose",
        "cholesterol_total",
        "cholesterol_ldl",
        "cholesterol_hdl",
        "triglycerides",
        "resting_hr",
        "hrv",
        "spo2",
        "body_temp",
        "body_fat_pct",
        "muscle_mass_kg",
        "waist_cm",
        "custom",
      ],
    },
  },
} as const
