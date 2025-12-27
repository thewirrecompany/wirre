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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assessment_audits: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          assessment_id: string | null
            role: 'company' | 'candidate' | 'admin' | 'superadmin'
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
            role: 'company' | 'candidate' | 'admin' | 'superadmin'
          assessment_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Update: {
            role?: 'company' | 'candidate' | 'admin' | 'superadmin'
          actor_id?: string | null
          actor_role?: string | null
          assessment_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_audits_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_notifications: {
        Row: {
          assessment_id: string | null
          created_at: string | null
          id: string
          message: string | null
          payload: Json | null
          read_by: Json | null
          recipient_role: string
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          payload?: Json | null
          read_by?: Json | null
          recipient_role: string
        }
        Update: {
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          payload?: Json | null
          read_by?: Json | null
          recipient_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_notifications_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_registrations: {
        Row: {
          assessment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_registrations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assignment_level: string | null
          assignment_mode: string | null
          company_user_id: string
          created_at: string | null
          duration_minutes: number | null
          github_classroom_url: string | null
          github_repo: string | null
          has_repo_access: boolean | null
          id: string
          max_salary: number | null
          min_salary: number | null
          payment_amount: number | null
          payment_confirmed: boolean | null
          payment_confirmed_at: string | null
          positions: number | null
          start_at: string | null
          status: string
          technologies: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_level?: string | null
          assignment_mode?: string | null
          company_user_id: string
          created_at?: string | null
          duration_minutes?: number | null
          github_classroom_url?: string | null
          github_repo?: string | null
          has_repo_access?: boolean | null
          id?: string
          max_salary?: number | null
          min_salary?: number | null
          payment_amount?: number | null
          payment_confirmed?: boolean | null
          payment_confirmed_at?: string | null
          positions?: number | null
          start_at?: string | null
          status?: string
          technologies?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_level?: string | null
          assignment_mode?: string | null
          company_user_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          github_classroom_url?: string | null
          github_repo?: string | null
          has_repo_access?: boolean | null
          id?: string
          max_salary?: number | null
          min_salary?: number | null
          payment_amount?: number | null
          payment_confirmed?: boolean | null
          payment_confirmed_at?: string | null
          positions?: number | null
          start_at?: string | null
          status?: string
          technologies?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          created_at: string | null
          full_name: string
          github_username: string | null
          id: string
          linkedin_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          github_username?: string | null
          id?: string
          linkedin_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          github_username?: string | null
          id?: string
          linkedin_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          linkedin_url: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      candidate_finish_assessment: {
        Args: { p_assessment_id: string }
        Returns: Json
      }
      company_delete_assessment: {
        Args: { p_assessment_id: string; p_user_id: string }
        Returns: Json
      }
      company_delete_self: { Args: { p_user_id: string }; Returns: Json }
      complete_candidate_signup: {
        Args: {
          p_email: string
          p_full_name: string
          p_github_username?: string
          p_user_id: string
        }
        Returns: Json
      }
      complete_company_signup: {
        Args: {
          p_domain?: string
          p_email: string
          p_linkedin_url?: string
          p_name: string
          p_user_id: string
        }
        Returns: Json
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      mark_due_assessments_started: { Args: never; Returns: undefined }
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
