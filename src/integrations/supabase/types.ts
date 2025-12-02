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
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          password_hash: string
          permissions: string[] | null
          role: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash: string
          permissions?: string[] | null
          role: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          permissions?: string[] | null
          role?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          name: string
          stage_level: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          stage_level: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          stage_level?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      exams: {
        Row: {
          class: string | null
          created_at: string | null
          exam_month: number
          exam_year: number
          id: string
          is_active: boolean | null
          level: number
          pin_description: string | null
          pin_enabled: boolean | null
          pin_password: string | null
          require_pin: boolean | null
          subject: string | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          class?: string | null
          created_at?: string | null
          exam_month: number
          exam_year: number
          id?: string
          is_active?: boolean | null
          level: number
          pin_description?: string | null
          pin_enabled?: boolean | null
          pin_password?: string | null
          require_pin?: boolean | null
          subject?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          class?: string | null
          created_at?: string | null
          exam_month?: number
          exam_year?: number
          id?: string
          is_active?: boolean | null
          level?: number
          pin_description?: string | null
          pin_enabled?: boolean | null
          pin_password?: string | null
          require_pin?: boolean | null
          subject?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      grade_criteria: {
        Row: {
          created_at: string | null
          criterion_name: string
          description_ar: string | null
          description_en: string | null
          exam_id: string | null
          id: string
          is_active: boolean | null
          max_value: number
          min_value: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criterion_name: string
          description_ar?: string | null
          description_en?: string | null
          exam_id?: string | null
          id?: string
          is_active?: boolean | null
          max_value?: number
          min_value?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criterion_name?: string
          description_ar?: string | null
          description_en?: string | null
          exam_id?: string | null
          id?: string
          is_active?: boolean | null
          max_value?: number
          min_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_criteria_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "hymns_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          ada2_gama3y_grade: number | null
          created_at: string | null
          exam_id: string | null
          id: string
          not2_grade: number | null
          notes: string | null
          student_id: string | null
          tasleem_grade: number | null
          teacher_id: string | null
          total_grade: number | null
          updated_at: string | null
        }
        Insert: {
          ada2_gama3y_grade?: number | null
          created_at?: string | null
          exam_id?: string | null
          id?: string
          not2_grade?: number | null
          notes?: string | null
          student_id?: string | null
          tasleem_grade?: number | null
          teacher_id?: string | null
          total_grade?: number | null
          updated_at?: string | null
        }
        Update: {
          ada2_gama3y_grade?: number | null
          created_at?: string | null
          exam_id?: string | null
          id?: string
          not2_grade?: number | null
          notes?: string | null
          student_id?: string | null
          tasleem_grade?: number | null
          teacher_id?: string | null
          total_grade?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_hymns_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "hymns_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      hymns_exams: {
        Row: {
          ada2_max: number
          ada2_min: number
          created_at: string | null
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          exam_month: number
          exam_year: number
          id: string
          is_active: boolean | null
          not2_max: number
          not2_min: number
          pass_percentage: number
          status: string | null
          tasleem_max: number
          tasleem_min: number
          title_ar: string
          title_en: string
          updated_at: string | null
        }
        Insert: {
          ada2_max?: number
          ada2_min?: number
          created_at?: string | null
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          exam_month: number
          exam_year: number
          id?: string
          is_active?: boolean | null
          not2_max?: number
          not2_min?: number
          pass_percentage?: number
          status?: string | null
          tasleem_max?: number
          tasleem_min?: number
          title_ar: string
          title_en: string
          updated_at?: string | null
        }
        Update: {
          ada2_max?: number
          ada2_min?: number
          created_at?: string | null
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          exam_month?: number
          exam_year?: number
          id?: string
          is_active?: boolean | null
          not2_max?: number
          not2_min?: number
          pass_percentage?: number
          status?: string | null
          tasleem_max?: number
          tasleem_min?: number
          title_ar?: string
          title_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stages: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          level: number
          name_ar: string
          name_en: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          level: number
          name_ar: string
          name_en: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          name_ar?: string
          name_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          class: string
          class_group_id: string | null
          code: string
          created_at: string | null
          id: string
          import_batch_id: string | null
          import_date: string | null
          imported_from_excel: boolean | null
          is_active: boolean | null
          level: number
          name: string
          stage: string
          updated_at: string | null
        }
        Insert: {
          class: string
          class_group_id?: string | null
          code: string
          created_at?: string | null
          id?: string
          import_batch_id?: string | null
          import_date?: string | null
          imported_from_excel?: boolean | null
          is_active?: boolean | null
          level: number
          name: string
          stage: string
          updated_at?: string | null
        }
        Update: {
          class?: string
          class_group_id?: string | null
          code?: string
          created_at?: string | null
          id?: string
          import_batch_id?: string | null
          import_date?: string | null
          imported_from_excel?: boolean | null
          is_active?: boolean | null
          level?: number
          name?: string
          stage?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          password_hash: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          name: string
          password_hash: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          password_hash?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role: { Args: never; Returns: string }
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
