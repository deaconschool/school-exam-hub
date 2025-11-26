// Supabase Database Types for Phase 3
// Generated from the PostgreSQL schema

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          username: string;
          email: string;
          password_hash: string;
          role: 'admin' | 'super_admin';
          permissions: string[];
          created_at: string;
          updated_at: string;
          last_login: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          password_hash: string;
          role: 'admin' | 'super_admin';
          permissions?: string[];
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          password_hash?: string;
          role?: 'admin' | 'super_admin';
          permissions?: string[];
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
      };
      teachers: {
        Row: {
          id: string;
          name: string;
          password_hash: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id: string;
          name: string;
          password_hash: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          password_hash?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      students: {
        Row: {
          id: string;
          code: string;
          name: string;
          level: number;
          class: string;
          stage: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          level: number;
          class: string;
          stage?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          level?: number;
          class?: string;
          stage?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      exams: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          exam_date: string;
          level: number;
          subject: string | null;
          class: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          exam_type: 'url_exam' | 'oral_exam';
          url: string | null;
          require_pin: boolean;
          pin_password: string | null;
          pin_enabled: boolean;
          pin_description: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          exam_date: string;
          level: number;
          subject?: string | null;
          class?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          exam_type?: 'url_exam' | 'oral_exam';
          url?: string | null;
          require_pin?: boolean;
          pin_password?: string | null;
          pin_enabled?: boolean;
          pin_description?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          exam_date?: string;
          level?: number;
          subject?: string | null;
          class?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          exam_type?: 'url_exam' | 'oral_exam';
          url?: string | null;
          require_pin?: boolean;
          pin_password?: string | null;
          pin_enabled?: boolean;
          pin_description?: string | null;
        };
      };
      grade_criteria: {
        Row: {
          id: string;
          criterion_name: string;
          min_value: number;
          max_value: number;
          description_ar: string | null;
          description_en: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          criterion_name: string;
          min_value?: number;
          max_value?: number;
          description_ar?: string | null;
          description_en?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          criterion_name?: string;
          min_value?: number;
          max_value?: number;
          description_ar?: string | null;
          description_en?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      grades: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          exam_id: string;
          tasleem_grade: number | null;
          not2_grade: number | null;
          ada2_gama3y_grade: number | null;
          total_grade: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          exam_id: string;
          tasleem_grade?: number | null;
          not2_grade?: number | null;
          ada2_gama3y_grade?: number | null;
          total_grade?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          teacher_id?: string;
          exam_id?: string;
          tasleem_grade?: number | null;
          not2_grade?: number | null;
          ada2_gama3y_grade?: number | null;
          total_grade?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      grade_aggregates: {
        Row: {
          student_id: string;
          student_code: string;
          student_name: string;
          exam_id: string | null;
          exam_title: string | null;
          total_grades: number;
          average_grade: number | null;
          highest_grade: number | null;
          lowest_grade: number | null;
          last_graded_at: string | null;
        };
      };
    };
    Functions: {
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      [key: string]: never;
    };
    CompositeTypes: {
      [key: string]: never;
    };
  };
}

// Extended interfaces for application use
export interface AdminUser extends Database['public']['Tables']['admin_users']['Row'] {
  password?: string; // Plain text password for login (not stored in DB)
}

export interface Teacher extends Database['public']['Tables']['teachers']['Row'] {
  password?: string; // Plain text password for login (not stored in DB)
}

export interface Student extends Database['public']['Tables']['students']['Row'] {}

export interface Exam extends Database['public']['Tables']['exams']['Row'] {}

export interface HymnsExam extends Database['public']['Tables']['hymns_exams']['Row'] {}

export interface GradeCriteria extends Database['public']['Tables']['grade_criteria']['Row'] {}

export interface Grade extends Database['public']['Tables']['grades']['Row'] {}

export interface GradeAggregate extends Database['public']['Views']['grade_aggregates']['Row'] {}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Join types for complex queries
export interface StudentWithGrades extends Student {
  grades: (Grade & {
    teacher_name: string;
    exam_title: string;
  })[];
}

export interface TeacherWithGrades extends Teacher {
  grades: (Grade & {
    student_name: string;
    student_code: string;
    exam_title: string;
  })[];
}

export interface ExamWithGrades extends Exam {
  grades: (Grade & {
    student_name: string;
    student_code: string;
    teacher_name: string;
  })[];
}