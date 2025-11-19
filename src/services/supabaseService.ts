import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, Teacher, Student, Exam, Grade, GradeCriteria, ApiResponse } from '@/types/supabase';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qhhqygidoqbnqhhggunu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaHF5Z2lkb3FibnFoaGdndW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDM4MzIsImV4cCI6MjA3ODkxOTgzMn0.eW2iOx3_J_ipxFEeuyReg7Rr_hfHTHipQWDLV-dZ4wo';

// Create Supabase client
export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseService {
  // =================================================================
  // TEACHERS
  // =================================================================

  // Get all teachers
  static async getTeachers(): Promise<ApiResponse<Teacher[]>> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('is_active', true)
        .order('name');

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

  // Get teacher by ID
  static async getTeacherById(teacherId: string): Promise<ApiResponse<Teacher>> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .eq('is_active', true)
        .single();

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

  // =================================================================
  // STUDENTS
  // =================================================================

  // Get all students
  static async getStudents(): Promise<ApiResponse<Student[]>> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true)
        .order('code');

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

  // Get student by code
  static async getStudentByCode(studentCode: string): Promise<ApiResponse<Student>> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('code', studentCode)
        .eq('is_active', true)
        .single();

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

  // Search students by partial code
  static async searchStudents(searchTerm: string): Promise<ApiResponse<Student[]>> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true)
        .or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .order('code')
        .limit(10);

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

  // =================================================================
  // EXAMS
  // =================================================================

  // Get all exams
  static async getExams(): Promise<ApiResponse<Exam[]>> {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('is_active', true)
        .order('exam_date');

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

  // Get exams by level, class, and subject
  static async getExamsByStageClassSubject(
    level: number,
    className: string,
    subject: string
  ): Promise<ApiResponse<Exam[]>> {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('level', level)
        .eq('class', className)
        .eq('subject', subject)
        .eq('is_active', true)
        .order('exam_date');

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

  // Get available subjects for a level and class
  static async getAvailableSubjectsForStageClass(
    level: number,
    className: string
  ): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('subject')
        .eq('level', level)
        .eq('class', className)
        .eq('is_active', true);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      // Extract unique subjects
      const subjects = [...new Set(data?.map(item => item.subject).filter(Boolean))];

      return {
        data: subjects,
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

  // Get all stages with their classes
  static async getAllStages(): Promise<ApiResponse<any[]>> {
    try {
      const { data: stagesData, error: stagesError } = await supabase
        .from('stages')
        .select('*')
        .eq('is_active', true)
        .order('level');

      if (stagesError) {
        return {
          data: null,
          error: stagesError.message,
          success: false
        };
      }

      // Get all classes for all stages
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('stage_level, name')
        .eq('is_active', true)
        .order('stage_level, name');

      if (classesError) {
        return {
          data: null,
          error: classesError.message,
          success: false
        };
      }

      // Group classes by stage level
      const classesByStage: { [key: number]: string[] } = {};
      classesData?.forEach(cls => {
        if (!classesByStage[cls.stage_level]) {
          classesByStage[cls.stage_level] = [];
        }
        classesByStage[cls.stage_level].push(cls.name);
      });

      // Add classes array to each stage
      const stagesWithClasses = stagesData?.map(stage => ({
        ...stage,
        classes: classesByStage[stage.level] || []
      }));

      return {
        data: stagesWithClasses || null,
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

  // Get classes by stage level
  static async getClassesForStage(level: number): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('stage_level', level)
        .eq('is_active', true)
        .order('name');

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

  // Get available classes for a level (from exams table - fallback)
  static async getAvailableClassesForStage(level: number): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('class')
        .eq('level', level)
        .eq('is_active', true);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      // Extract unique classes
      const classes = [...new Set(data?.map(item => item.class).filter(Boolean))];

      return {
        data: classes,
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
  static async getExamById(examId: string): Promise<ApiResponse<Exam>> {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .eq('is_active', true)
        .single();

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

  // =================================================================
  // GRADE CRITERIA
  // =================================================================

  // Get grade criteria
  static async getGradeCriteria(): Promise<ApiResponse<GradeCriteria[]>> {
    try {
      const { data, error } = await supabase
        .from('grade_criteria')
        .select('*')
        .eq('is_active', true)
        .order('criterion_name');

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

  // =================================================================
  // GRADES
  // =================================================================

  // Get grades for a specific teacher
  static async getTeacherGrades(teacherId: string): Promise<ApiResponse<Grade[]>> {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          students!inner(
            name,
            code,
            class,
            level
          ),
          exams(
            title,
            exam_date
          )
        `)
        .eq('teacher_id', teacherId)
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

  // Get grades for a specific student
  static async getStudentGrades(studentCode: string): Promise<ApiResponse<Grade[]>> {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          teachers!inner(
            name
          ),
          exams(
            title,
            exam_date
          )
        `)
        .eq('students.code', studentCode)
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

  // Save or update grades for a student
  static async saveGrades(
    studentCode: string,
    teacherId: string,
    examId: string,
    tasleemGrade: number,
    not2Grade: number,
    ada2Gama3yGrade: number,
    notes?: string
  ): Promise<ApiResponse<Grade>> {
    try {
      // First get the student ID from the code
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('code', studentCode)
        .eq('is_active', true)
        .single();

      if (studentError || !student) {
        return {
          data: null,
          error: studentError?.message || 'Student not found',
          success: false
        };
      }

      // Check if grade already exists (update) or create new
      const { data: existingGrade, error: existingError } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', student.id)
        .eq('teacher_id', teacherId)
        .eq('exam_id', examId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        return {
          data: null,
          error: existingError.message,
          success: false
        };
      }

      let result;
      if (existingGrade) {
        // Update existing grade
        const { data, error } = await supabase
          .from('grades')
          .update({
            tasleem_grade: tasleemGrade,
            not2_grade: not2Grade,
            ada2_gama3y_grade: ada2Gama3yGrade,
            notes: notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingGrade.id)
          .select()
          .single();
        result = { data, error };
      } else {
        // Create new grade
        const { data, error } = await supabase
          .from('grades')
          .insert({
            student_id: student.id,
            teacher_id: teacherId,
            exam_id: examId,
            tasleem_grade: tasleemGrade,
            not2_grade: not2Grade,
            ada2_gama3y_grade: ada2Gama3yGrade,
            notes: notes || null
          })
          .select()
          .single();
        result = { data, error };
      }

      return {
        data: result.data || null,
        error: result.error?.message || null,
        success: !result.error
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Delete a grade
  static async deleteGrade(gradeId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', gradeId);

      return {
        data: !error,
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      return {
        data: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // =================================================================
  // STATISTICS
  // =================================================================

  // Get grade statistics for a teacher
  static async getTeacherGradeStats(teacherId: string): Promise<ApiResponse<{
    totalGrades: number;
    averageGrade: number;
    highestGrade: number;
    lowestGrade: number;
    studentsGraded: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('total_grade, student_id')
        .eq('teacher_id', teacherId);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      if (!data || data.length === 0) {
        return {
          data: {
            totalGrades: 0,
            averageGrade: 0,
            highestGrade: 0,
            lowestGrade: 0,
            studentsGraded: 0
          },
          error: null,
          success: true
        };
      }

      const grades = data.filter(g => g.total_grade !== null).map(g => g.total_grade!);
      const uniqueStudents = new Set(data.map(g => g.student_id)).size;

      return {
        data: {
          totalGrades: grades.length,
          averageGrade: grades.reduce((a, b) => a + b, 0) / grades.length,
          highestGrade: Math.max(...grades),
          lowestGrade: Math.min(...grades),
          studentsGraded: uniqueStudents
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

  // Get grade statistics for a student
  static async getStudentGradeStats(studentCode: string): Promise<ApiResponse<{
    totalGrades: number;
    averageGrade: number;
    highestGrade: number;
    lowestGrade: number;
    teachersGraded: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('total_grade, teacher_id')
        .eq('students.code', studentCode);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      if (!data || data.length === 0) {
        return {
          data: {
            totalGrades: 0,
            averageGrade: 0,
            highestGrade: 0,
            lowestGrade: 0,
            teachersGraded: 0
          },
          error: null,
          success: true
        };
      }

      const grades = data.filter(g => g.total_grade !== null).map(g => g.total_grade!);
      const uniqueTeachers = new Set(data.map(g => g.teacher_id)).size;

      return {
        data: {
          totalGrades: grades.length,
          averageGrade: grades.reduce((a, b) => a + b, 0) / grades.length,
          highestGrade: Math.max(...grades),
          lowestGrade: Math.min(...grades),
          teachersGraded: uniqueTeachers
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

  // Create a new student
  static async createStudent(studentData: {
    name: string;
    code: string;
    class: string;
    level: number;
    stage?: string;
    imported_from_excel?: boolean;
    import_batch_id?: string;
    import_date?: string;
    notes?: string;
  }): Promise<ApiResponse<Student>> {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single();

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

  // Get class statistics
  static async getClassStatistics(className: string): Promise<ApiResponse<{
    totalStudents: number;
    totalGrades: number;
    teacherCount: number;
    averageGrade: number;
    gradedStudents: number;
    ungradedStudents: number;
  }>> {
    try {
      // Get students in class
      const studentsResponse = await supabase
        .from('students')
        .select('code')
        .eq('class', className);

      if (studentsResponse.error || !studentsResponse.data) {
        return {
          data: null,
          error: studentsResponse.error?.message || 'Failed to get students',
          success: false
        };
      }

      const studentCodes = studentsResponse.data.map(s => s.code);
      const totalStudents = studentCodes.length;

      // Get all grades for students in this class
      const gradesResponse = await supabase
        .from('grades')
        .select('student_id, teacher_id, total_grade, tasleem_grade, not2_grade, ada2_gama3y_grade')
        .in('student_id', (
          supabase
            .from('students')
            .select('id')
            .eq('class', className)
        ));

      if (gradesResponse.error) {
        return {
          data: {
            totalStudents,
            totalGrades: 0,
            teacherCount: 0,
            averageGrade: 0,
            gradedStudents: 0,
            ungradedStudents: totalStudents
          },
          error: null,
          success: true
        };
      }

      const grades = gradesResponse.data || [];
      const validGrades = grades.filter(g => g.total_grade !== null);
      const teacherIds = [...new Set(grades.map(g => g.teacher_id))];
      const averageGrade = validGrades.length > 0
        ? validGrades.reduce((sum, g) => sum + g.total_grade!, 0) / validGrades.length
        : 0;

      return {
        data: {
          totalStudents,
          totalGrades: validGrades.length,
          teacherCount: teacherIds.length,
          averageGrade: Math.round(averageGrade * 100) / 100,
          gradedStudents: [...new Set(validGrades.map(g => g.student_id))].length,
          ungradedStudents: totalStudents - [...new Set(validGrades.map(g => g.student_id))].length
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

  // Get available classes
  static async getAvailableClasses(): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('class')
        .not('class', 'is', null);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      const classes = [...new Set(data.map(item => item.class).filter(Boolean))];
      return {
        data: classes,
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

  // =================================================================
  // ADMIN TEACHER MANAGEMENT METHODS
  // These methods will be used by admin interface in the future
  // =================================================================

  // Get all teachers with password hashes (admin only)
  static async getAllTeachersForAdmin(): Promise<ApiResponse<Teacher[]>> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('is_active', true)
        .order('id');

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

  // Update teacher password (admin only)
  static async updateTeacherPassword(teacherId: string, newPasswordHash: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherId)
        .select();

      return {
        data: (data && data.length > 0),
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

  // Create or update teacher (admin only)
  static async createOrUpdateTeacher(teacherData: {
    id: string;
    name: string;
    password_hash: string;
    email?: string;
    phone?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<Teacher>> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .upsert({
          id: teacherData.id,
          name: teacherData.name,
          password_hash: teacherData.password_hash,
          email: teacherData.email || null,
          phone: teacherData.phone || null,
          is_active: teacherData.is_active ?? true,
          updated_at: new Date().toISOString()
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

  // Delete/deactivate teacher (admin only)
  static async deactivateTeacher(teacherId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherId)
        .select();

      return {
        data: (data && data.length > 0),
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

  // Get single teacher for admin (includes password hash)
  static async getTeacherForAdmin(teacherId: string): Promise<ApiResponse<Teacher>> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
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
}

export default SupabaseService;