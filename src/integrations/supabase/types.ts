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
      calendar_events: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          location: string | null
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
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
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
          status?: string | null
          subject?: string
          to_email?: string
          user_id?: string | null
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
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
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
    Enums: {},
  },
} as const
