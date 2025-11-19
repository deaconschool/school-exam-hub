import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdminUser, ApiResponse } from '../types/supabase';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qhhqygidoqbnqhhggunu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaHF5Z2lkb3FibnFoaGdndW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDM4MzIsImV4cCI6MjA3ODkxOTgzMn0.eW2iOx3_J_ipxFEeuyReg7Rr_hfHTHipQWDLV-dZ4wo';

// Create Supabase client
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export class AdminService {
  // Admin Authentication
  static async adminLogin(username: string, password: string): Promise<ApiResponse<AdminUser>> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password) // Simple password check for now - should be hashed
        .eq('is_active', true)
        .single();

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      // Update last login
      if (data) {
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.id);
      }

      return {
        data: data,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Admin User Management
  static async getAllAdmins(): Promise<ApiResponse<AdminUser[]>> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      return {
        data: data || null,
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  static async createAdmin(adminData: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'super_admin';
    permissions: string[];
  }): Promise<ApiResponse<AdminUser>> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          username: adminData.username,
          email: adminData.email,
          password_hash: adminData.password, // Simple for now - should be hashed
          role: adminData.role,
          permissions: adminData.permissions
        })
        .select()
        .single();

      return {
        data: data,
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  static async updateAdmin(id: string, updates: Partial<AdminUser>): Promise<ApiResponse<AdminUser>> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return {
        data: data,
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  static async deactivateAdmin(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: false })
        .eq('id', id);

      return {
        data: null,
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Permission checking
  static hasPermission(user: AdminUser | null, permission: string): boolean {
    if (!user || !user.is_active) return false;
    return user.permissions.includes(permission) || user.role === 'super_admin';
  }

  // Stage Management
  static async getStages(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('stages')
        .select('*')
        .order('name');

      return {
        data: data || [],
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Class Management
  static async getClasses(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');

      return {
        data: data || [],
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Student Management with pagination and filtering
  static async getAllStudents(filters?: {
    page?: number;
    limit?: number;
    stage_id?: string;
    class_id?: string;
    level?: string;
    search?: string;
  }): Promise<ApiResponse<any>> {
    try {
      let query = supabase
        .from('students')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.level) {
        query = query.eq('level', filters.level);
      }
      if (filters?.class_id) {
        query = query.eq('class', filters.class_id);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      // Transform data to match expected format
      const students = data?.map(student => ({
        id: student.id,
        code: student.code,
        name: student.name,
        class_name: student.class || '-',
        stage_name: student.stage || '-',
        level: student.level,
        created_at: student.created_at,
        is_active: student.is_active !== false // Default to true
      })) || [];

      return {
        data: {
          students,
          total: count || 0,
          page,
          limit
        },
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: { students: [], total: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Student Statistics for Student Management Dashboard
  static async getStudentStats(): Promise<ApiResponse<any>> {
    try {
      // Get current month start date
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const [
        totalStudentsResult,
        thisMonthStudentsResult,
        activeClassesResult
      ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true })
          .gte('created_at', currentMonth.toISOString()),
        supabase.from('classes').select('id', { count: 'exact', head: true })
      ]);

      const stats = {
        totalStudents: totalStudentsResult.count || 0,
        newThisMonth: thisMonthStudentsResult.count || 0,
        activeClasses: activeClassesResult.count || 0,
        classesWithStudents: activeClassesResult.count || 0 // Using active classes as proxy
      };

      return {
        data: stats,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Create Student
  static async createStudent(studentData: {
    code: string;
    name: string;
    level: number;
    class: string;
    stage: string;
    notes?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      // Check if student code already exists
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('code', studentData.code)
        .maybeSingle();

      if (existingStudent) {
        return {
          data: null,
          error: 'Student code already exists',
          success: false
        };
      }

      const { data, error } = await supabase
        .from('students')
        .insert({
          code: studentData.code,
          name: studentData.name,
          level: studentData.level,
          class: studentData.class,
          stage: studentData.stage,
          notes: studentData.notes || null,
          is_active: studentData.is_active !== false
        });

      // Consider successful if no error, even if no data returned
      return {
        data: data || { success: true },
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Update Student
  static async updateStudent(id: string, updates: {
    code?: string;
    name?: string;
    level?: number;
    class?: string;
    stage?: string;
    notes?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      // If code is being updated, check if it's already taken by another student
      if (updates.code) {
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id')
          .eq('code', updates.code)
          .neq('id', id)
          .maybeSingle();

        if (existingStudent) {
          return {
            data: null,
            error: 'Student code already exists',
            success: false
          };
        }
      }

      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return {
        data: data,
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Delete Student
  static async deleteStudent(id: string): Promise<ApiResponse<null>> {
    try {
      // Check if student has any grades
      const { data: gradesCount } = await supabase
        .from('grades')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', id);

      if (gradesCount && gradesCount.count > 0) {
        return {
          data: null,
          error: 'Cannot delete student with existing grades. Please delete grades first.',
          success: false
        };
      }

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      return {
        data: null,
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Get Student by ID
  static async getStudentById(id: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      return {
        data: data,
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // System Statistics for Admin Dashboard
  static async getSystemStats(): Promise<ApiResponse<any>> {
    try {
      // Get counts from all tables
      const [
        studentsResult,
        teachersResult,
        examsResult,
        gradesResult
      ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('exams').select('id', { count: 'exact', head: true }),
        supabase.from('grades').select('id', { count: 'exact', head: true })
      ]);

      const stats = {
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalExams: examsResult.count || 0,
        totalGrades: gradesResult.count || 0
      };

      return {
        data: stats,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }
}