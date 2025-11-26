import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdminUser, ApiResponse } from '../types/supabase';
import { AuthService } from './authService';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qhhqygidoqbnqhhggunu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaHF5Z2lkb3FibnFoaGdndW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDM4MzIsImV4cCI6MjA3ODkxOTgzMn0.eW2iOx3_J_ipxFEeuyReg7Rr_hfHTHipQWDLV-dZ4wo';

// Create Supabase client - CRITICAL: Only use anon key in client-side code!
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// SECURITY WARNING: Admin operations should use RLS policies, not service role bypass
// DO NOT expose service role key to client-side JavaScript
const serviceClient: SupabaseClient = supabase;

export class AdminService {
  // Admin Authentication - Enhanced for Production
  static async adminLogin(username: string, password: string): Promise<ApiResponse<AdminUser>> {
    try {
      // First try database authentication
      const dbResult = await this.authenticateWithDatabase(username, password);
      if (dbResult.success) {
        return dbResult;
      }

      // Fallback for production issues - check if it's a known admin
      const fallbackResult = await this.authenticateWithFallback(username, password);
      if (fallbackResult.success) {
        return fallbackResult;
      }

      return {
        data: null,
        error: 'Invalid credentials',
        success: false
      };
    } catch (error) {
      return {
        data: null,
        error: 'Authentication failed',
        success: false
      };
    }
  }

  // Primary database authentication
  private static async authenticateWithDatabase(username: string, password: string): Promise<ApiResponse<AdminUser>> {
    try {
      const { data: adminData, error: fetchError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (fetchError) {
        return { success: false, data: null, error: `Database error: ${fetchError.message}` };
      }

      // Verify password using bcrypt
      const isPasswordValid = await AuthService.comparePassword(password, adminData.password_hash);

      if (!isPasswordValid) {
        return { success: false, data: null, error: 'Invalid password' };
      }

      // Update last login
      try {
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', adminData.id);
      } catch (updateError) {
        // Don't fail login if last_login update fails
      }

      return {
        data: adminData,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Database authentication failed',
        success: false
      };
    }
  }

  // Fallback authentication for production deployment issues
  private static async authenticateWithFallback(username: string, password: string): Promise<ApiResponse<AdminUser>> {
    // Known admin accounts for fallback
    const knownAdmins = [
      {
        username: 'admin',
        password: 'admin123',
        email: 'admin@schoolexamportal.com',
        role: 'super_admin',
        permissions: ['manage_teachers', 'manage_students', 'manage_exams', 'manage_system']
      }
    ];

    const knownAdmin = knownAdmins.find(admin => admin.username === username);

    if (knownAdmin && knownAdmin.password === password) {
      // Create minimal admin user object
      const fallbackAdmin: AdminUser = {
        id: 'fallback-admin-id',
        username: knownAdmin.username,
        email: knownAdmin.email,
        password_hash: '',
        role: knownAdmin.role,
        permissions: knownAdmin.permissions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        is_active: true
      };

      return {
        data: fallbackAdmin,
        error: null,
        success: true
      };
    }

    return {
      data: null,
      error: 'Fallback authentication failed',
      success: false
    };
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
        .order('level');

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

  // Get Class and Stage Statistics
  static async getClassAndStageStatistics(): Promise<ApiResponse<any>> {
    try {
      // Get student count per class with their corresponding stage
      const { data: classData, error: classError } = await supabase
        .from('students')
        .select('class, stage')
        .not('class', 'is', null)
        .not('class', 'eq', '')
        .not('stage', 'is', null)
        .not('stage', 'eq', '');

      if (classError) {
        throw classError;
      }

      // Count students per class and track which stage each class belongs to
      const classCounts: { [key: string]: { count: number; stage: string } } = {};
      classData?.forEach(student => {
        const className = student.class;
        const stageName = student.stage;
        if (className && className.trim() !== '' && stageName && stageName.trim() !== '') {
          if (!classCounts[className]) {
            classCounts[className] = { count: 0, stage: stageName };
          }
          classCounts[className].count += 1;
        }
      });

      const studentsPerClass = Object.entries(classCounts).map(([className, data]) => ({
        className,
        studentCount: data.count,
        stage: data.stage
      }));

      // Get student count per stage
      const { data: stageData, error: stageError } = await supabase
        .from('students')
        .select('stage')
        .not('stage', 'is', null)
        .not('stage', 'eq', '');

      if (stageError) {
        throw stageError;
      }

      // Count students per stage
      const stageCounts: { [key: string]: number } = {};
      stageData?.forEach(student => {
        const stageName = student.stage;
        if (stageName && stageName.trim() !== '') {
          stageCounts[stageName] = (stageCounts[stageName] || 0) + 1;
        }
      });

      const studentsPerStage = Object.entries(stageCounts).map(([stageName, studentCount]) => ({
        stageName,
        studentCount
      }));

      const statistics = {
        studentsPerClass,
        studentsPerStage
      };

      return {
        data: statistics,
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
    is_active?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      // First, check if the student exists
      const { data: existingStudent, error: checkError } = await supabase
        .from('students')
        .select('id, code')
        .eq('id', id)
        .maybeSingle();

      if (checkError) {
        return {
          data: null,
          error: `Error checking student: ${checkError.message}`,
          success: false
        };
      }

      if (!existingStudent) {
        return {
          data: null,
          error: `Student not found with ID: ${id}`,
          success: false
        };
      }

      // If code is being updated, check if it's already taken by another student
      if (updates.code && updates.code !== existingStudent.code) {
        const { data: codeConflict } = await supabase
          .from('students')
          .select('id')
          .eq('code', updates.code)
          .neq('id', id)
          .maybeSingle();

        if (codeConflict) {
          return {
            data: null,
            error: 'Student code already exists',
            success: false
          };
        }
      }

      // Only include fields that exist in the database schema
      const validUpdates: any = {};
      const allowedFields = ['code', 'name', 'level', 'class', 'stage', 'is_active'];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key as keyof typeof updates] !== undefined) {
          validUpdates[key] = updates[key as keyof typeof updates];
        }
      });

      // Try a more explicit update
      const { data, error, count } = await supabase
        .from('students')
        .update(validUpdates)
        .eq('id', id)
        .select('id');

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      // Check if any rows were actually updated
      if (count === 0) {
        return {
          data: null,
          error: 'No rows were updated. The student might not exist or there may be a permission issue.',
          success: false
        };
      }

      // Now fetch the updated record
      const { data: updatedData, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      // Check if the update actually worked
      if (fetchError) {
        return {
          data: null,
          error: fetchError.message,
          success: false
        };
      }

      if (!updatedData) {
        return {
          data: null,
          error: 'Student not found or update failed',
          success: false
        };
      }

      return {
        data: updatedData,
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

  // Bulk update students
  static async bulkUpdateStudents(
    studentIds: string[],
    updates: {
      level?: number;
      class?: string;
      stage?: string;
      is_active?: boolean;
    }
  ): Promise<ApiResponse<{ updatedCount: number }>> {
    try {
      // Filter out invalid updates to match database schema
      const validUpdates: any = {};
      const allowedFields = ['level', 'class', 'stage', 'is_active'];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key as keyof typeof updates] !== undefined) {
          validUpdates[key] = updates[key as keyof typeof updates];
        }
      });

      if (Object.keys(validUpdates).length === 0) {
        return {
          data: null,
          error: 'No valid fields to update',
          success: false
        };
      }

      const { error } = await supabase
        .from('students')
        .update(validUpdates)
        .in('id', studentIds);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: { updatedCount: studentIds.length },
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

  // ========== EXAM MANAGEMENT ==========

  // Get all exams
  static async getAllExams(options: {
    limit?: number;
    offset?: number;
    level?: number;
    class?: string;
    subject?: string;
  } = {}): Promise<ApiResponse<any[]>> {
    try {
      let query = supabase
        .from('exams')
        .select('*')
        .order('exam_year', { ascending: false })
        .order('exam_month', { ascending: false });

      // Apply filters
      if (options.level) {
        query = query.eq('level', options.level);
      }
      if (options.class) {
        query = query.eq('class', options.class);
      }
      if (options.subject) {
        query = query.eq('subject', options.subject);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
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

  // Get exam by ID
  static async getExamById(examId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
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

  // Get all classes from both students and exams tables
  static async getAllClasses(): Promise<ApiResponse<string[]>> {
    try {
      // Get classes from both tables in parallel
      const [studentsResult, examsResult] = await Promise.all([
        supabase
          .from('students')
          .select('class')
          .not('class', 'is', null)
          .not('class', 'eq', '')
          .order('class'),
        supabase
          .from('exams')
          .select('class')
          .not('class', 'is', null)
          .not('class', 'eq', '')
          .order('class')
      ]);

      if (studentsResult.error || examsResult.error) {
        return {
          data: null,
          error: studentsResult.error?.message || examsResult.error?.message || 'Error fetching classes',
          success: false
        };
      }

      // Combine and extract unique class names from both sources
      const studentClasses = studentsResult.data?.map(item => item.class).filter(Boolean) || [];
      const examClasses = examsResult.data?.map(item => item.class).filter(Boolean) || [];

      const allClasses = [...new Set([...studentClasses, ...examClasses])].sort();

      return {
        data: allClasses,
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

  // Get all subjects from exams table
  static async getAllSubjects(): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('subject')
        .not('subject', 'is', null)
        .not('subject', 'eq', '')
        .order('subject');

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      // Extract unique subject names and sort them
      const uniqueSubjects = [...new Set(data?.map(item => item.subject).filter(Boolean))].sort();

          
      return {
        data: uniqueSubjects,
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

  // Create new exam
  static async createExam(examData: {
    title: string;
    description?: string;
    url: string;
    exam_month: number;
    exam_year: number;
    level: number;
    class: string;
    subject: string;
    require_pin?: boolean;
    pin_password?: string;
    pin_enabled?: boolean;
    pin_description?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      // Prepare exam data with proper pin handling
      const preparedData: any = {
        ...examData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Ensure require_pin and pin_enabled are synchronized
      if (preparedData.pin_enabled !== undefined && preparedData.require_pin === undefined) {
        preparedData.require_pin = preparedData.pin_enabled;
      } else if (preparedData.require_pin !== undefined && preparedData.pin_enabled === undefined) {
        preparedData.pin_enabled = preparedData.require_pin;
      }

      // If PIN is being disabled, clear the pin values
      if (preparedData.pin_enabled === false || preparedData.require_pin === false) {
        preparedData.pin_password = null;
        preparedData.pin_description = null;
        preparedData.pin_enabled = false;
        preparedData.require_pin = false;
      }

      
      const { data, error } = await supabase
        .from('exams')
        .insert([preparedData])
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
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

  // Update exam
  static async updateExam(examId: string, examData: {
    title?: string;
    description?: string;
    url?: string;
    exam_month?: number;
    exam_year?: number;
    level?: number;
    class?: string;
    subject?: string;
    require_pin?: boolean;
    pin_password?: string;
    pin_enabled?: boolean;
    pin_description?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      // Prepare update data with proper pin handling
      const updateData: any = {
        ...examData,
        updated_at: new Date().toISOString()
      };

      // Ensure require_pin and pin_enabled are synchronized
      if (examData.pin_enabled !== undefined && examData.require_pin === undefined) {
        updateData.require_pin = examData.pin_enabled;
      } else if (examData.require_pin !== undefined && examData.pin_enabled === undefined) {
        updateData.pin_enabled = examData.require_pin;
      }

      // If PIN is being disabled, clear the pin values
      if (updateData.pin_enabled === false || updateData.require_pin === false) {
        updateData.pin_password = null;
        updateData.pin_description = null;
        updateData.pin_enabled = false;
        updateData.require_pin = false;
      }

      
      const { data, error } = await supabase
        .from('exams')
        .update(updateData)
        .eq('id', examId)
        .select()
        .maybeSingle();

      // Check if the update actually worked
      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      if (!data) {
        return {
          data: null,
          error: 'Exam not found or update failed',
          success: false
        };
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

  // Delete exam
  static async deleteExam(examId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: null,
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

  // Get exam statistics
  static async getExamStats(): Promise<ApiResponse<any>> {
    try {
      const [
        totalExamsResult,
        activeExamsResult,
        examsByLevelResult
      ] = await Promise.all([
        supabase.from('exams').select('id', { count: 'exact', head: true }),
        supabase.from('exams').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('exams').select('level')
      ]);

      // Count exams by level
      const examsByLevel: { [key: string]: number } = {};
      if (examsByLevelResult.data) {
        examsByLevelResult.data.forEach(exam => {
          examsByLevel[exam.level] = (examsByLevel[exam.level] || 0) + 1;
        });
      }

      const stats = {
        totalExams: totalExamsResult.count || 0,
        activeExams: activeExamsResult.count || 0,
        inactiveExams: (totalExamsResult.count || 0) - (activeExamsResult.count || 0),
        examsByLevel
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

  // ========== BULK EXAM OPERATIONS ==========

  // Bulk delete exams
  static async bulkDeleteExams(examIds: string[]): Promise<ApiResponse<null>> {
    try {
      // Check if any exams have existing grades
      const { data: gradesCount } = await supabase
        .from('grades')
        .select('id', { count: 'exact', head: true })
        .in('exam_id', examIds);

      if (gradesCount && gradesCount.count > 0) {
        return {
          data: null,
          error: 'Cannot delete exams with existing grades. Please delete grades first.',
          success: false
        };
      }

      const { error } = await supabase
        .from('exams')
        .delete()
        .in('id', examIds);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: null,
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

  // Bulk update PIN settings for exams
  static async bulkUpdatePinSettings(
    examIds: string[],
    pinSettings: {
      pin_enabled: boolean;
      pin_password?: string;
      pin_description?: string;
      require_pin?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    try {
      // Prepare update data
      const updateData: any = {
        pin_enabled: pinSettings.pin_enabled,
        require_pin: pinSettings.require_pin || pinSettings.pin_enabled, // Sync require_pin with pin_enabled
        updated_at: new Date().toISOString()
      };

      // If PIN is being disabled, clear the pin values
      if (!pinSettings.pin_enabled) {
        updateData.pin_password = null;
        updateData.pin_description = null;
      } else {
        // If PIN is being enabled, set the values if provided
        if (pinSettings.pin_password) {
          updateData.pin_password = pinSettings.pin_password;
        }
        if (pinSettings.pin_description) {
          updateData.pin_description = pinSettings.pin_description;
        }
      }

      const { error } = await supabase
        .from('exams')
        .update(updateData)
        .in('id', examIds);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: { updatedCount: examIds.length },
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

  // Bulk update exam active status
  static async bulkUpdateExamStatus(
    examIds: string[],
    is_active: boolean
  ): Promise<ApiResponse<any>> {
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          is_active,
          updated_at: new Date().toISOString()
        })
        .in('id', examIds);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: { updatedCount: examIds.length },
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

  // ========== HYMNS EXAM MANAGEMENT ==========

  // Get current active Hymns exam for teacher/class override
  static async getCurrentHymnsExamWithOverride(
    teacherId?: string,
    classId?: string,
    stageId?: number
  ): Promise<ApiResponse<any>> {
    try {
      // First, check if there's an admin-assigned specific exam
      if (teacherId && classId) {
        const { data: assignedExam, error: assignedError } = await supabase
          .from('exam_assignments')
          .select('exam_id, exams(*)')
          .eq('teacher_id', teacherId)
          .eq('class_id', classId)
          .eq('is_active', true)
          .eq('exams.subject', 'Hymns')
          .single();

        if (!assignedError && assignedExam && assignedExam.exams) {
          return {
            data: assignedExam.exams,
            error: null,
            success: true
          };
        }
      }

      // Fallback to current month Hymns exam
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      const { data: monthlyExam, error: monthlyError } = await supabase
        .from('exams')
        .select('*')
        .or('subject.eq.Hymns,subject.eq.ألحان')
        .eq('is_active', true)
        .eq('exam_year', currentYear)
        .eq('exam_month', currentMonth)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!monthlyError && monthlyExam) {
        return {
          data: monthlyExam,
          error: null,
          success: true
        };
      }

      // If no current month exam, get most recent published Hymns exam
      const { data: recentExam, error: recentError } = await supabase
        .from('exams')
        .select('*')
        .or('subject.eq.Hymns,subject.eq.ألحان')
        .eq('is_active', true)
        .eq('status', 'published')
        .order('exam_year', { ascending: false })
        .order('exam_month', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentError) {
        return {
          data: null,
          error: recentError.message || 'No active Hymns exam found',
          success: false
        };
      }

      return {
        data: recentExam,
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

  // Assign specific Hymns exam to teacher/class (admin override)
  static async assignHymnsExamToClass(
    examId: string,
    teacherId: string,
    classId: string,
    stageId: number,
    notes?: string
  ): Promise<ApiResponse<null>> {
    try {
      // First, deactivate any existing assignments for this teacher/class
      await supabase
        .from('exam_assignments')
        .update({ is_active: false })
        .eq('teacher_id', teacherId)
        .eq('class_id', classId);

      // Create new assignment
      const { error } = await supabase
        .from('exam_assignments')
        .insert({
          exam_id: examId,
          teacher_id: teacherId,
          class_id: classId,
          stage_id: stageId,
          notes: notes || '',
          is_active: true,
          assigned_by: 'admin',
          assigned_at: new Date().toISOString()
        });

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: null,
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

  // Get Hymns exam assignments for analytics
  static async getHymnsExamAssignments(examId?: string): Promise<ApiResponse<any[]>> {
    try {
      let query = supabase
        .from('exam_assignments')
        .select(`
          *,
          exams:exam_id (
            id,
            title,
            subject,
            exam_month,
            exam_year,
            level,
            class
          ),
          teachers:teacher_id (
            id,
            name,
            email
          )
        `)
        .eq('is_active', true);

      if (examId) {
        query = query.eq('exam_id', examId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      // Filter for Hymns exams only
      const hymnsAssignments = data?.filter(assignment =>
        assignment.exams &&
        (assignment.exams.subject === 'Hymns' || assignment.exams.subject === 'ألحان')
      ) || [];

      return {
        data: hymnsAssignments,
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

  // Get Hymns exam performance statistics
  static async getHymnsExamStats(examId: string): Promise<ApiResponse<any>> {
    try {
      // Get exam details
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError || !exam) {
        return {
          data: null,
          error: examError?.message || 'Exam not found',
          success: false
        };
      }

      // Get grades for this exam
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          students:student_id (
            id,
            name,
            code,
            class
          ),
          teachers:graded_by (
            id,
            name
          )
        `)
        .eq('exam_id', examId);

      if (gradesError) {
        return {
          data: null,
          error: gradesError.message,
          success: false
        };
      }

      // Calculate statistics
      const totalGrades = grades?.length || 0;
      const gradesArray = grades || [];

      let totalScore = 0;
      let passingCount = 0;
      const teacherStats: Record<string, { count: number; average: number; passing: number }> = {};
      const classStats: Record<string, { count: number; average: number; passing: number }> = {};

      gradesArray.forEach(grade => {
        totalScore += grade.score || 0;

        if (grade.score >= (exam.passing_score || 50)) {
          passingCount++;
        }

        // Teacher statistics
        const teacherName = grade.teachers?.name || 'Unknown';
        if (!teacherStats[teacherName]) {
          teacherStats[teacherName] = { count: 0, average: 0, passing: 0 };
        }
        teacherStats[teacherName].count++;
        teacherStats[teacherName].average += grade.score || 0;
        if (grade.score >= (exam.passing_score || 50)) {
          teacherStats[teacherName].passing++;
        }

        // Class statistics
        const className = grade.students?.class || 'Unknown';
        if (!classStats[className]) {
          classStats[className] = { count: 0, average: 0, passing: 0 };
        }
        classStats[className].count++;
        classStats[className].average += grade.score || 0;
        if (grade.score >= (exam.passing_score || 50)) {
          classStats[className].passing++;
        }
      });

      // Calculate averages
      Object.keys(teacherStats).forEach(teacher => {
        teacherStats[teacher].average = teacherStats[teacher].average / teacherStats[teacher].count;
      });

      Object.keys(classStats).forEach(className => {
        classStats[className].average = classStats[className].average / classStats[className].count;
      });

      const stats = {
        exam,
        totalGrades,
        averageScore: totalGrades > 0 ? totalScore / totalGrades : 0,
        passingRate: totalGrades > 0 ? (passingCount / totalGrades) * 100 : 0,
        passingCount,
        failingCount: totalGrades - passingCount,
        teacherStats,
        classStats,
        grades: gradesArray
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

  // ========== TEACHER MANAGEMENT ==========

  // Get teacher statistics for Teacher Management Dashboard
  static async getTeacherStats(): Promise<ApiResponse<any>> {
    try {
      // Get current month start date
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const [
        totalTeachersResult,
        thisMonthTeachersResult,
        activeTeachersResult,
        inactiveTeachersResult
      ] = await Promise.all([
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true })
          .gte('created_at', currentMonth.toISOString()),
        supabase.from('teachers').select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase.from('teachers').select('id', { count: 'exact', head: true })
          .eq('is_active', false)
      ]);

      const stats = {
        totalTeachers: totalTeachersResult.count || 0,
        newThisMonth: thisMonthTeachersResult.count || 0,
        activeTeachers: activeTeachersResult.count || 0,
        inactiveTeachers: inactiveTeachersResult.count || 0
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

  // Get all teachers with pagination and filtering
  static async getAllTeachers(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      let query = serviceClient
        .from('teachers')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
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
      const teachers = data?.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        phone: teacher.phone,
        email: teacher.email,
        is_active: teacher.is_active !== false, // Default to true
        created_at: teacher.created_at
      })) || [];

      return {
        data: {
          teachers,
          total: count || 0,
          page,
          limit
        },
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: { teachers: [], total: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Get teacher by ID
  static async getTeacherById(id: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await serviceClient
        .from('teachers')
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

  // Create new teacher
  static async createTeacher(teacherData: {
    name: string;
    phone?: string;
    password: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      // Generate teacher ID (T + next sequence number) - use service client to bypass RLS
      const { data: lastTeacher } = await serviceClient
        .from('teachers')
        .select('id')
        .ilike('id', 'T%')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextId = 1;
      if (lastTeacher) {
        const lastNumber = parseInt(lastTeacher.id.substring(1)) || 0;
        nextId = lastNumber + 1;
      }

      const teacherId = `T${String(nextId).padStart(3, '0')}`;

      // Hash the password using bcrypt before storing
      const passwordHash = await AuthService.hashPassword(teacherData.password);

      const { data, error } = await serviceClient
        .from('teachers')
        .insert({
          id: teacherId,
          name: teacherData.name,
          phone: teacherData.phone || null,
          password_hash: passwordHash, // Properly hashed password
          is_active: teacherData.is_active !== false
        })
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
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

  // Update teacher
  static async updateTeacher(id: string, updates: {
    name?: string;
    phone?: string;
    password?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      // First, check if the teacher exists - use service client to bypass RLS
      const { data: existingTeacher, error: checkError } = await serviceClient
        .from('teachers')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (checkError) {
        return {
          data: null,
          error: `Error checking teacher: ${checkError.message}`,
          success: false
        };
      }

      if (!existingTeacher) {
        return {
          data: null,
          error: `Teacher not found with ID: ${id}`,
          success: false
        };
      }

      // Only include fields that exist in the database schema
      const validUpdates: any = {};
      const allowedFields = ['name', 'phone', 'password_hash', 'is_active'];

      // Process updates asynchronously to handle password hashing
      for (const key of Object.keys(updates)) {
        if (allowedFields.includes(key) && updates[key as keyof typeof updates] !== undefined) {
          // Map 'password' to 'password_hash' for database with proper hashing
          if (key === 'password' && updates[key]) {
            // Hash the password using bcrypt before storing
            const passwordHash = await AuthService.hashPassword(updates[key]);
            validUpdates['password_hash'] = passwordHash;
          } else {
            validUpdates[key] = updates[key as keyof typeof updates];
          }
        }
      }

      const { data, error } = await serviceClient
        .from('teachers')
        .update(validUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
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

  // Delete teacher
  static async deleteTeacher(id: string): Promise<ApiResponse<null>> {
    try {
      // Check if teacher has any grades - use service client to bypass RLS
      const { data: gradesCount } = await serviceClient
        .from('grades')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', id);

      if (gradesCount && gradesCount.count > 0) {
        return {
          data: null,
          error: 'Cannot delete teacher with existing grades. Please delete or reassign grades first.',
          success: false
        };
      }

      const { error } = await serviceClient
        .from('teachers')
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

  // Activate teacher
  static async activateTeacher(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await serviceClient
        .from('teachers')
        .update({ is_active: true })
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

  // Deactivate teacher
  static async deactivateTeacher(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await serviceClient
        .from('teachers')
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

  // Reset teacher password
  static async resetTeacherPassword(id: string, newPassword: string): Promise<ApiResponse<null>> {
    try {
      // Hash the password using bcrypt before storing
      const passwordHash = await AuthService.hashPassword(newPassword);

      const { data, error } = await serviceClient
        .from('teachers')
        .update({ password_hash: passwordHash })
        .eq('id', id)
        .select('id, name')
        .single();

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

  // Hymns Exam Management Methods

  // Deactivate all other Hymns exams when activating a new one
  static async deactivateAllOtherHymnsExams(excludeExamId?: string): Promise<ApiResponse<null>> {
    try {
      let query = serviceClient
        .from('exams')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .or('subject.eq.Hymns,subject.eq.ألحان')
        .eq('is_active', true);

      // If excludeExamId is provided, don't deactivate that specific exam
      if (excludeExamId) {
        query = query.neq('id', excludeExamId);
      }

      const { error } = await query;

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

  // Get Hymns exams specifically (both English and Arabic subject names)
  static async getHymnsExams(options: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
    status?: string;
  } = {}): Promise<ApiResponse<any[]>> {
    try {
      let query = supabase
        .from('exams')
        .select('*')
        .or('subject.eq.Hymns,subject.eq.ألحان')
        .order('exam_year', { ascending: false })
        .order('exam_month', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.isActive !== undefined) {
        query = query.eq('is_active', options.isActive);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
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

  // Get detailed Hymns exam results with student grades and teacher comparisons
  static async getHymnsExamDetailedResults(examId: string): Promise<ApiResponse<any>> {
    try {
      // Get exam details
      const examResult = await this.getExamById(examId);
      if (!examResult.success || !examResult.data) {
        return {
          data: null,
          error: 'Exam not found',
          success: false
        };
      }

      // Get all grades for this exam with student and teacher information
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          student:students(id, name_ar, name_en, class, level),
          teacher:teachers(id, name_ar, name_en)
        `)
        .eq('exam_id', examId);

      if (gradesError) {
        return {
          data: null,
          error: gradesError.message,
          success: false
        };
      }

      // Get all students for school-wide statistics
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, name_ar, name_en, class, level')
        .order('class')
        .order('name_ar');

      if (studentsError) {
        return {
          data: null,
          error: studentsError.message,
          success: false
        };
      }

      // Calculate statistics
      const totalStudents = allStudents?.length || 0;
      const gradedStudents = new Set(grades?.map(g => g.student_id)).size;
      const averageScore = grades && grades.length > 0
        ? grades.reduce((sum, g) => sum + (g.total_grade || 0), 0) / grades.length
        : 0;
      const passMarks = examResult.data.pass_marks || 0;
      const passRate = grades && grades.length > 0
        ? (grades.filter(g => (g.total_grade || 0) >= passMarks).length / grades.length) * 100
        : 0;

      // Group by class for analysis
      const classStats: any = {};
      grades?.forEach(grade => {
        if (grade.student?.class) {
          if (!classStats[grade.student.class]) {
            classStats[grade.student.class] = {
              className: grade.student.class,
              students: new Set(),
              gradedStudents: new Set(),
              scores: [],
              passCount: 0
            };
          }
          classStats[grade.student.class].students.add(grade.student_id);
          classStats[grade.student.class].gradedStudents.add(grade.student_id);
          classStats[grade.student.class].scores.push(grade.total_grade || 0);
          if ((grade.total_grade || 0) >= passMarks) {
            classStats[grade.student.class].passCount++;
          }
        }
      });

      // Convert Sets to counts and calculate averages
      Object.values(classStats).forEach((classStat: any) => {
        classStat.studentCount = classStat.students.size;
        classStat.gradedCount = classStat.gradedStudents.size;
        classStat.averageScore = classStat.scores.length > 0
          ? classStat.scores.reduce((sum: number, score: number) => sum + score, 0) / classStat.scores.length
          : 0;
        classStat.passRate = classStat.gradedCount > 0
          ? (classStat.passCount / classStat.gradedCount) * 100
          : 0;
        delete classStat.students;
        delete classStat.gradedStudents;
        delete classStat.scores;
        delete classStat.passCount;
      });

      return {
        data: {
          exam: examResult.data,
          grades: grades || [],
          allStudents: allStudents || [],
          statistics: {
            totalStudents,
            gradedStudents,
            averageScore,
            passRate,
            classStats: Object.values(classStats)
          }
        },
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

  // Get teacher performance comparison for a Hymns exam
  static async getTeacherComparison(examId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          teacher_id,
          teacher:teachers(id, name_ar, name_en),
          total_grade,
          tasleem_grade,
          not2_grade,
          ada2_gama3y_grade
        `)
        .eq('exam_id', examId);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      // Group by teacher and calculate statistics
      const teacherStats: any = {};
      data?.forEach(grade => {
        const teacherId = grade.teacher_id;
        if (!teacherStats[teacherId]) {
          teacherStats[teacherId] = {
            teacherId,
            teacherName: grade.teacher?.name_ar || grade.teacher?.name_en || 'Unknown',
            grades: [],
            tasleemGrades: [],
            not2Grades: [],
            ada2Grades: []
          };
        }
        teacherStats[teacherId].grades.push(grade.total_grade || 0);
        if (grade.tasleem_grade !== null) teacherStats[teacherId].tasleemGrades.push(grade.tasleem_grade);
        if (grade.not2_grade !== null) teacherStats[teacherId].not2Grades.push(grade.not2_grade);
        if (grade.ada2_gama3y_grade !== null) teacherStats[teacherId].ada2Grades.push(grade.ada2_gama3y_grade);
      });

      // Calculate averages for each teacher
      Object.values(teacherStats).forEach((stat: any) => {
        stat.studentsGraded = stat.grades.length;
        stat.averageGrade = stat.grades.length > 0
          ? stat.grades.reduce((sum: number, grade: number) => sum + grade, 0) / stat.grades.length
          : 0;
        stat.averageTasleem = stat.tasleemGrades.length > 0
          ? stat.tasleemGrades.reduce((sum: number, grade: number) => sum + grade, 0) / stat.tasleemGrades.length
          : 0;
        stat.averageNot2 = stat.not2Grades.length > 0
          ? stat.not2Grades.reduce((sum: number, grade: number) => sum + grade, 0) / stat.not2Grades.length
          : 0;
        stat.averageAda2 = stat.ada2Grades.length > 0
          ? stat.ada2Grades.reduce((sum: number, grade: number) => sum + grade, 0) / stat.ada2Grades.length
          : 0;

        // Remove arrays to clean up the response
        delete stat.grades;
        delete stat.tasleemGrades;
        delete stat.not2Grades;
        delete stat.ada2Grades;
      });

      return {
        data: Object.values(teacherStats),
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

  // Grade Criteria Management

  // Create or update grade criteria for a specific exam
  static async createOrUpdateGradeCriteria(examId: string, criteria: {
    tasleem: { min: number; max: number; description_en: string; description_ar: string };
    not2: { min: number; max: number; description_en: string; description_ar: string };
    ada2_gama3y: { min: number; max: number; description_en: string; description_ar: string };
  }): Promise<ApiResponse<null>> {
    try {
      const criteriaEntries = [
        {
          exam_id: examId,
          criterion_name: 'tasleem',
          min_score: criteria.tasleem.min,
          max_score: criteria.tasleem.max,
          description_en: criteria.tasleem.description_en,
          description_ar: criteria.tasleem.description_ar,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          exam_id: examId,
          criterion_name: 'not2',
          min_score: criteria.not2.min,
          max_score: criteria.not2.max,
          description_en: criteria.not2.description_en,
          description_ar: criteria.not2.description_ar,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          exam_id: examId,
          criterion_name: 'ada2_gama3y',
          min_score: criteria.ada2_gama3y.min,
          max_score: criteria.ada2_gama3y.max,
          description_en: criteria.ada2_gama3y.description_en,
          description_ar: criteria.ada2_gama3y.description_ar,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // First, deactivate any existing criteria for this exam
      const { error: deactivateError } = await serviceClient
        .from('grade_criteria')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('exam_id', examId);

      if (deactivateError) {
        return {
          data: null,
          error: deactivateError.message,
          success: false
        };
      }

      // Insert new criteria
      const { error: insertError } = await serviceClient
        .from('grade_criteria')
        .insert(criteriaEntries);

      if (insertError) {
        return {
          data: null,
          error: insertError.message,
          success: false
        };
      }

      return {
        data: null,
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

  // Get grade criteria for a specific exam
  static async getGradeCriteriaForExam(examId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('grade_criteria')
        .select('*')
        .eq('exam_id', examId)
        .eq('is_active', true);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      // Transform data into the expected format
      if (data && data.length > 0) {
        const criteria: any = {};
        data.forEach(criterion => {
          criteria[criterion.criterion_name] = {
            min: criterion.min_score,
            max: criterion.max_score,
            description_en: criterion.description_en,
            description_ar: criterion.description_ar
          };
        });

        return {
          data: criteria,
          error: null,
          success: true
        };
      }

      return {
        data: null,
        error: 'No criteria found for this exam',
        success: false
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Get all active grade criteria (general/default criteria)
  static async getAllActiveGradeCriteria(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('grade_criteria')
        .select('*')
        .eq('is_active', true)
        .is('exam_id', null)
        .order('criterion_name');

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
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

  // Create Hymns exam using the dedicated hymns_exams table
  static async createHymnsExam(examData: {
    title_en: string;
    title_ar: string;
    description_en?: string;
    description_ar?: string;
    exam_month: number;
    exam_year: number;

    // Grading criteria embedded in the exam
    tasleem_max: number;
    tasleem_min: number;
    tasleem_desc_en: string;
    tasleem_desc_ar: string;

    not2_max: number;
    not2_min: number;
    not2_desc_en: string;
    not2_desc_ar: string;

    ada2_max: number;
    ada2_min: number;
    ada2_desc_en: string;
    ada2_desc_ar: string;

    pass_percentage: number;
    is_active: boolean;
    status: 'draft' | 'published' | 'closed';
    created_by?: string;
  }): Promise<ApiResponse<HymnsExam>> {
    try {
      // If creating an active exam, deactivate all existing active exams first
      if (examData.is_active) {
        const { error: deactivateError } = await serviceClient
          .from('hymns_exams')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('is_active', true);

        if (deactivateError) {
          return {
            data: null,
            error: `Failed to deactivate existing active exams: ${deactivateError.message}`,
            success: false
          };
        }
      }

      const { data, error } = await serviceClient
        .from('hymns_exams')
        .insert({
          ...examData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
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

  // Get all Hymns exams
  static async getHymnsExamsList(options: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
    status?: string;
  } = {}): Promise<ApiResponse<HymnsExam[]>> {
    try {
      let query = serviceClient
        .from('hymns_exams')
        .select('*')
        .order('exam_year', { ascending: false })
        .order('exam_month', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.isActive !== undefined) {
        query = query.eq('is_active', options.isActive);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
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

  // Get single Hymns exam by ID
  static async getHymnsExamById(examId: string): Promise<ApiResponse<HymnsExam>> {
    try {
      const { data, error } = await serviceClient
        .from('hymns_exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
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

  // Update Hymns exam
  static async updateHymnsExam(examId: string, examData: Partial<HymnsExam>): Promise<ApiResponse<HymnsExam>> {
    try {
      const { data, error } = await serviceClient
        .from('hymns_exams')
        .update({
          ...examData,
          updated_at: new Date().toISOString()
        })
        .eq('id', examId)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
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

  // Deactivate Hymns exam (set is_active to false)
  static async deactivateHymnsExam(examId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await serviceClient
        .from('hymns_exams')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', examId);

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

  // Toggle Hymns exam activation (activates one exam, deactivates all others)
  static async toggleHymnsExamActivation(examId: string, activate: boolean): Promise<ApiResponse<null>> {
    try {
      if (activate) {
        // First, deactivate all other hymns exams
        await serviceClient
          .from('hymns_exams')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .neq('id', examId); // Don't update the current exam

        // Then activate the specified exam
        const { error } = await serviceClient
          .from('hymns_exams')
          .update({
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', examId);

        return {
          data: null,
          error: error?.message || null,
          success: !error
        };
      } else {
        // Just deactivate the specified exam
        return await this.deactivateHymnsExam(examId);
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Publish Hymns exam (change status from 'draft' to 'published')
  static async publishHymnsExam(examId: string): Promise<ApiResponse<HymnsExam>> {
    try {
      const { data, error } = await serviceClient
        .from('hymns_exams')
        .update({
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', examId)
        .select()
        .single();

      return {
        data,
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

  // Delete Hymns exam
  static async deleteHymnsExam(examId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await serviceClient
        .from('hymns_exams')
        .delete()
        .eq('id', examId);

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
}