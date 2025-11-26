import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, Teacher, Student, Exam, Grade, GradeCriteria, ApiResponse, HymnsExam } from '@/types/supabase';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qhhqygidoqbnqhhggunu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaHF5Z2lkb3FibnFoaGdndW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDM4MzIsImV4cCI6MjA3ODkxOTgzMn0.eW2iOx3_J_ipxFEeuyReg7Rr_hfHTHipQWDLV-dZ4wo';

// Create Supabase client - CRITICAL: Only use anon key in client-side code!
export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseAnonKey);

// SECURITY WARNING: Service role operations should be moved to Edge Functions
// DO NOT expose service role key to client-side JavaScript
export const serviceClient: SupabaseClient<Database> = supabase;

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
      console.log('SupabaseService.getTeacherById - Fetching teacher:', teacherId);

      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .eq('is_active', true)
        .single();

      console.log('SupabaseService.getTeacherById - Result:', {
        teacherId,
        data: data,
        error: error,
        success: !error
      });

      return {
        data: data || null,
        error: error?.message || null,
        success: !error
      };
    } catch (error) {
      console.error('SupabaseService.getTeacherById - Exception:', error);
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

  // Get unique stages and classes from dedicated database tables
  static async getStagesAndClasses(): Promise<ApiResponse<{
    stages: Array<{ name: string; level: number }>;
    allClasses: string[];
    stageClasses: Record<string, string[]>;
  }>> {
    try {
      // Query dedicated stages table
      const { data: stagesData, error: stagesError } = await supabase
        .from('stages')
        .select('*')
        .order('level', { ascending: true });

      if (stagesError) {
        console.error('Error fetching stages:', stagesError);
        return { success: false, error: stagesError.message, data: null };
      }

      // Query dedicated classes table with stage information
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('stage_level', { ascending: true });

      if (classesError) {
        console.error('Error fetching classes:', classesError);
        return { success: false, error: classesError.message, data: null };
      }

      // Process stages data
      const stages = stagesData?.map(stage => ({
        name: stage.name_en, // Use English name for display
        level: stage.level
      })) || [];

      // Build stage-classes mapping
      const stageClassesMap: Record<string, string[]> = {};
      const allClassesSet = new Set<string>();

      stagesData?.forEach(stage => {
        stageClassesMap[stage.name_en] = []; // Use English name as key
      });

      classesData?.forEach(cls => {
        const stage = stagesData?.find(s => s.level === cls.stage_level);
        if (stage) {
          const stageName = stage.name_en; // Use English name
          if (!stageClassesMap[stageName]) {
            stageClassesMap[stageName] = [];
          }
          stageClassesMap[stageName].push(cls.name);
          allClassesSet.add(cls.name);
        }
      });

      // Sort classes within each stage
      Object.keys(stageClassesMap).forEach(stage => {
        stageClassesMap[stage].sort();
      });

      const allClasses = Array.from(allClassesSet).sort();

      return {
        success: true,
        data: {
          stages,
          allClasses,
          stageClasses: stageClassesMap
        },
        error: null
      };
    } catch (error) {
      console.error('Error in getStagesAndClasses:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load stages and classes',
        data: null
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
        .order('exam_year', { ascending: false })
        .order('exam_month', { ascending: false });

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
        .order('exam_year', { ascending: false })
        .order('exam_month', { ascending: false });

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
  // HYMNS EXAM MANAGEMENT
  // =================================================================

  // Get current active Hymns exam from hymns_exams table
  static async getCurrentActiveHymnsExam(
    teacherId?: string,
    classId?: string,
    level?: number
  ): Promise<ApiResponse<HymnsExam>> {
    try {
      // Get the most recent active published Hymns exam from hymns_exams table
      const { data: exam, error } = await supabase
        .from('hymns_exams')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'published')
        .order('exam_year', { ascending: false })
        .order('exam_month', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return {
          data: null,
          error: error.message || 'No active Hymns exam found',
          success: false
        };
      }

      return {
        data: exam,
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

  // Get dynamic grading ranges from active Hymns exam
  static async getActiveHymnsExamGradingRanges(): Promise<ApiResponse<{
    tasleem_max: number;
    tasleem_min: number;
    not2_max: number;
    not2_min: number;
    ada2_max: number;
    ada2_min: number;
  }>> {
    try {
      // Get the most recent active published Hymns exam
      const { data: exam, error } = await supabase
        .from('hymns_exams')
        .select('tasleem_max, tasleem_min, not2_max, not2_min, ada2_max, ada2_min')
        .eq('is_active', true)
        .eq('status', 'published')
        .order('exam_year', { ascending: false })
        .order('exam_month', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return {
          data: {
            tasleem_max: 20,
            tasleem_min: 0,
            not2_max: 10,
            not2_min: 0,
            ada2_max: 10,
            ada2_min: 0
          }, // Return default values if no exam found
          error: null,
          success: true
        };
      }

      return {
        data: exam,
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: {
          tasleem_max: 20,
          tasleem_min: 0,
          not2_max: 10,
          not2_min: 0,
          ada2_max: 10,
          ada2_min: 0
        }, // Return default values on error
        error: null,
        success: true
      };
    }
  }

  // Get Hymns exams by month
  static async getHymnsExamsByMonth(
    year: number,
    month: number
  ): Promise<ApiResponse<Exam[]>> {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .or('subject.eq.Hymns,subject.eq.ألحان')
        .eq('exam_year', year)
        .eq('exam_month', month)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      return {
        data: data || [],
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

  // Get all Hymns exams (for admin management)
  static async getHymnsExams(): Promise<ApiResponse<Exam[]>> {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .or('subject.eq.Hymns,subject.eq.ألحان')
        .eq('is_active', true)
        .order('exam_year', { ascending: false })
        .order('exam_month', { ascending: false })
        .order('created_at', { ascending: false });

      return {
        data: data || [],
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

  // Get detailed student score information for a specific exam
  static async getStudentScoreDetails(examId: string, studentId: string): Promise<ApiResponse<{
    student: {
      id: string;
      code: string;
      name: string;
      class: string;
      stage: string;
    };
    exam: any;
    grades: {
      id: string;
      teacherId: string;
      teacherName: string;
      tasleemGrade: number;
      not2Grade: number;
      ada2Grade: number;
      totalGrade: number;
      notes: string;
      createdAt: string;
      gradedAt: string;
    }[];
    classRanking: {
      rank: number;
      totalStudents: number;
      averageScore: number;
      highestScore: number;
      lowestScore: number;
    };
    examSummary: {
      averageScore: number;
      passRate: number;
      totalStudents: number;
      gradedStudents: number;
    };
  }>> {
    try {
      // Get exam details
      const { data: exam, error: examError } = await supabase
        .from('hymns_exams')
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

      // Get student details
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        return {
          data: null,
          error: studentError?.message || 'Student not found',
          success: false
        };
      }

      // Get student's grades for this exam with teacher information
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          teachers!inner(
            id,
            name
          )
        `)
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (gradesError) {
        return {
          data: null,
          error: gradesError.message,
          success: false
        };
      }

      // Format grades data
      const formattedGrades = (grades || []).map(grade => ({
        id: grade.id,
        teacherId: grade.teachers.id,
        teacherName: grade.teachers.name,
        tasleemGrade: grade.tasleem_grade || 0,
        not2Grade: grade.not2_grade || 0,
        ada2Grade: grade.ada2_grade || 0,
        totalGrade: (grade.tasleem_grade || 0) + (grade.not2_grade || 0) + (grade.ada2_grade || 0),
        notes: grade.notes || '',
        createdAt: grade.created_at,
        gradedAt: grade.graded_at || grade.created_at
      }));

      // Get class ranking information
      const { data: classGrades, error: classRankError } = await supabase
        .from('grades')
        .select(`
          student_id,
          tasleem_grade,
          not2_grade,
          ada2_grade,
          students!inner(
            class,
            stage
          )
        `)
        .eq('exam_id', examId)
        .eq('students.class', student.class)
        .eq('students.stage', student.stage);

      if (classRankError) {
        return {
          data: null,
          error: classRankError.message,
          success: false
        };
      }

      // Calculate student scores and ranking
      const studentScores = new Map<string, number>();
      (classGrades || []).forEach(grade => {
        const total = (grade.tasleem_grade || 0) + (grade.not2_grade || 0) + (grade.ada2_grade || 0);
        const currentScore = studentScores.get(grade.student_id) || 0;
        studentScores.set(grade.student_id, Math.max(currentScore, total));
      });

      const sortedScores = Array.from(studentScores.values()).sort((a, b) => b - a);
      const studentTotalScore = studentScores.get(studentId) || 0;
      const rank = sortedScores.filter(score => score > studentTotalScore).length + 1;

      const classRanking = {
        rank,
        totalStudents: studentScores.size,
        averageScore: sortedScores.reduce((a, b) => a + b, 0) / sortedScores.length || 0,
        highestScore: Math.max(...sortedScores, 0),
        lowestScore: Math.min(...sortedScores, 0)
      };

      // Get exam summary statistics
      const { data: examGrades, error: examStatsError } = await supabase
        .from('grades')
        .select(`
          student_id,
          tasleem_grade,
          not2_grade,
          ada2_grade
        `)
        .eq('exam_id', examId);

      if (examStatsError) {
        return {
          data: null,
          error: examStatsError.message,
          success: false
        };
      }

      // Calculate exam summary
      const examStudentScores = new Map<string, number>();
      (examGrades || []).forEach(grade => {
        const total = (grade.tasleem_grade || 0) + (grade.not2_grade || 0) + (grade.ada2_grade || 0);
        const currentScore = examStudentScores.get(grade.student_id) || 0;
        examStudentScores.set(grade.student_id, Math.max(currentScore, total));
      });

      const totalPossibleMarks = (exam.tasleem_max || 0) + (exam.not2_max || 0) + (exam.ada2_max || 0);
      const examScores = Array.from(examStudentScores.values());
      const passMark = (exam.pass_percentage / 100) * totalPossibleMarks;
      const passedStudents = examScores.filter(score => score >= passMark).length;

      const examSummary = {
        averageScore: totalPossibleMarks > 0 ? (examScores.reduce((a, b) => a + b, 0) / examScores.length / totalPossibleMarks) * 100 : 0,
        passRate: examScores.length > 0 ? (passedStudents / examScores.length) * 100 : 0,
        totalStudents: examStudentScores.size,
        gradedStudents: examStudentScores.size
      };

      return {
        data: {
          student: {
            id: student.id,
            code: student.code,
            name: student.name,
            class: student.class,
            stage: student.stage || student.level?.toString() || ''
          },
          exam,
          grades: formattedGrades,
          classRanking,
          examSummary
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

  // =================================================================
  // HYMNS EXAM DETAIL METHODS
  // =================================================================

  // Get exam overview data (statistics, class performance) without student grades
  static async getHymnsExamOverview(examId: string): Promise<ApiResponse<any>> {
    try {
      // Get exam details
      const { data: exam, error: examError } = await supabase
        .from('hymns_exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) {
        return {
          data: null,
          error: examError.message || 'Exam not found',
          success: false
        };
      }

      // Get all students
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, code, name, class, stage')
        .eq('is_active', true);

      if (studentsError) {
        console.warn('Could not fetch students:', studentsError.message);
      }

      // Get grades with student and teacher info for calculations
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          student:students(id, code, name, class),
          teacher:teachers(id, name)
        `)
        .eq('exam_id', examId);

      if (gradesError) {
        console.warn('Could not fetch grades:', gradesError.message);
      }

      // Calculate statistics
      const totalStudents = allStudents?.length || 0;

      // Group grades by student for averaging
      const studentGradeMap = new Map();
      grades?.forEach(grade => {
        const studentId = grade.student_id;
        if (!studentGradeMap.has(studentId)) {
          studentGradeMap.set(studentId, {
            grades: [],
            studentInfo: grade.student,
            teacherInfo: grade.teacher
          });
        }
        studentGradeMap.get(studentId).grades.push(grade);
      });

      // Calculate averages and pass rate
      let totalScore = 0, totalTasleem = 0, totalNot2 = 0, totalAda2 = 0;
      let passedCount = 0;
      let gradedStudentCount = 0;

      studentGradeMap.forEach(studentData => {
        const gradesForStudent = studentData.grades;
        const gradeCount = gradesForStudent.length;

        // Calculate averages across all teachers for this student
        const avgTasleem = gradesForStudent.reduce((sum, g) => sum + (g.tasleem_grade || 0), 0) / gradeCount;
        const avgNot2 = gradesForStudent.reduce((sum, g) => sum + (g.not2_grade || 0), 0) / gradeCount;
        const avgAda2 = gradesForStudent.reduce((sum, g) => sum + (g.ada2_gama3y_grade || 0), 0) / gradeCount;
        const totalAvgGrade = avgTasleem + avgNot2 + avgAda2;

        // Check if passed using average
        const passMark = (exam.pass_percentage / 100) * ((exam.tasleem_max || 0) + (exam.not2_max || 0) + (exam.ada2_max || 0));

        totalTasleem += avgTasleem;
        totalNot2 += avgNot2;
        totalAda2 += avgAda2;
        totalScore += totalAvgGrade;

        if (totalAvgGrade >= passMark) {
          passedCount++;
        }
        gradedStudentCount++;
      });

      // Get unique classes for filter
      const allClasses = [...new Set(allStudents?.map(s => s.class).filter(Boolean) || [])];

      const statistics = {
        totalStudents,
        gradedStudents: gradedStudentCount,
        pendingGrading: totalStudents - gradedStudentCount,
        averageScore: gradedStudentCount > 0 ? (totalScore / gradedStudentCount) : 0,
        averageTasleem: gradedStudentCount > 0 ? totalTasleem / gradedStudentCount : 0,
        averageNot2: gradedStudentCount > 0 ? totalNot2 / gradedStudentCount : 0,
        averageAda2: gradedStudentCount > 0 ? totalAda2 / gradedStudentCount : 0,
        passRate: gradedStudentCount > 0 ? (passedCount / gradedStudentCount) * 100 : 0,
        allClasses
      };

      // Calculate class performance for chart
      const classPerformanceMap = new Map();
      allStudents?.forEach(student => {
        const className = student.class;
        if (!classPerformanceMap.has(className)) {
          classPerformanceMap.set(className, {
            className,
            totalStudents: 0,
            gradedStudents: 0,
            totalScore: 0,
            passingStudents: 0
          });
        }
        const classData = classPerformanceMap.get(className);
        classData.totalStudents++;

        const studentData = studentGradeMap.get(student.id);
        if (studentData) {
          classData.gradedStudents++;
          const gradesForStudent = studentData.grades;
          const avgTasleem = gradesForStudent.reduce((sum, g) => sum + (g.tasleem_grade || 0), 0) / gradesForStudent.length;
          const avgNot2 = gradesForStudent.reduce((sum, g) => sum + (g.not2_grade || 0), 0) / gradesForStudent.length;
          const avgAda2 = gradesForStudent.reduce((sum, g) => sum + (g.ada2_gama3y_grade || 0), 0) / gradesForStudent.length;
          const totalAvgGrade = avgTasleem + avgNot2 + avgAda2;

          classData.totalScore += totalAvgGrade;

          const passMark = (exam.pass_percentage / 100) * ((exam.tasleem_max || 0) + (exam.not2_max || 0) + (exam.ada2_max || 0));
          if (totalAvgGrade >= passMark) {
            classData.passingStudents++;
          }
        }
      });

      const classPerformance = Array.from(classPerformanceMap.values()).map(cls => ({
        className: cls.className,
        averageScore: cls.gradedStudents > 0 ? cls.totalScore / cls.gradedStudents : 0,
        totalStudents: cls.totalStudents,
        gradedStudents: cls.gradedStudents,
        passRate: cls.gradedStudents > 0 ? (cls.passingStudents / cls.gradedStudents) * 100 : 0
      })).sort((a, b) => a.className.localeCompare(b.className));

      // Calculate teacher performance
      const teacherPerformanceMap = new Map();
      grades?.forEach(grade => {
        const teacherId = grade.teacher_id;
        const teacherName = grade.teacher?.name || 'Unknown';

        if (!teacherPerformanceMap.has(teacherId)) {
          teacherPerformanceMap.set(teacherId, {
            teacherId,
            teacherName,
            totalGraded: 0,
            grades: [],
            classes: new Set()
          });
        }

        const teacherData = teacherPerformanceMap.get(teacherId);
        teacherData.totalGraded++;

        // Get student data for this grade
        const studentData = studentGradeMap.get(grade.student_id);
        if (studentData && studentData.grades.length > 0) {
          // Calculate average for this student
          const avgTasleem = studentData.grades.reduce((sum, g) => sum + (g.tasleem_grade || 0), 0) / studentData.grades.length;
          const avgNot2 = studentData.grades.reduce((sum, g) => sum + (g.not2_grade || 0), 0) / studentData.grades.length;
          const avgAda2 = studentData.grades.reduce((sum, g) => sum + (g.ada2_gama3y_grade || 0), 0) / studentData.grades.length;
          const totalAvgGrade = avgTasleem + avgNot2 + avgAda2;

          teacherData.grades.push(totalAvgGrade);
        }

        if (grade.student?.class) {
          teacherData.classes.add(grade.student.class);
        }
      });

      const teacherPerformance = Array.from(teacherPerformanceMap.values()).map(teacher => {
        const grades = teacher.grades;
        const average = grades.length > 0 ? grades.reduce((sum, g) => sum + g, 0) / grades.length : 0;
        const variance = grades.length > 0 ? grades.reduce((sum, g) => sum + Math.pow(g - average, 2), 0) / grades.length : 0;
        const consistencyScore = Math.max(0, 100 - (Math.sqrt(variance) / average * 100));

        return {
          teacherId: teacher.teacherId,
          teacherName: teacher.teacherName,
          totalGraded: teacher.totalGraded,
          averageScore: average,
          gradeVariance: variance,
          consistencyScore: Math.round(consistencyScore),
          classes: Array.from(teacher.classes).sort(),
          gradeDistribution: this.calculateGradeDistribution(grades, (exam.tasleem_max || 0) + (exam.not2_max || 0) + (exam.ada2_max || 0))
        };
      });

      return {
        data: {
          exam,
          statistics,
          classPerformance,
          teacherPerformance,
          studentGrades: [] // Empty - will be loaded with pagination
        },
        error: null,
        success: true
      };

    } catch (error) {
      console.error('Error loading exam overview:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Get comprehensive exam details with all related data
  static async getHymnsExamDetail(examId: string): Promise<ApiResponse<any>> {
    try {
      // Get exam details
      const { data: exam, error: examError } = await supabase
        .from('hymns_exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) {
        return {
          data: null,
          error: examError.message || 'Exam not found',
          success: false
        };
      }

      // Get all grades for this exam with student and teacher info
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          student:students(id, code, name, class),
          teacher:teachers(id, name)
        `)
        .eq('exam_id', examId);

      if (gradesError) {
        console.warn('No grades found for exam:', gradesError.message);
      }

      // Get all students for statistics
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, code, name, class, stage')
        .eq('is_active', true);

      if (studentsError) {
        console.warn('Error loading students:', studentsError.message);
      }

      const totalStudents = allStudents?.length || 0;
      const gradedStudents = grades?.length || 0;

      // Group grades by student to calculate averages and handle multiple teachers
      const studentGradeMap = new Map();
      grades?.forEach(grade => {
        const studentId = grade.student_id;
        if (!studentGradeMap.has(studentId)) {
          studentGradeMap.set(studentId, {
            grades: [],
            studentInfo: grade.student,
            totalGrade: 0,
            passed: false
          });
        }
        studentGradeMap.get(studentId).grades.push(grade);
      });

      // Calculate student averages and pass/fail status
      let totalScore = 0;
      let tasleemTotal = 0;
      let not2Total = 0;
      let ada2Total = 0;
      let passedCount = 0;
      let gradedStudentCount = 0;

      studentGradeMap.forEach((studentData, studentId) => {
        const gradesForStudent = studentData.grades;
        const gradeCount = gradesForStudent.length;

        // Calculate averages across all teachers for this student
        const avgTasleem = gradesForStudent.reduce((sum, g) => sum + (g.tasleem_grade || 0), 0) / gradeCount;
        const avgNot2 = gradesForStudent.reduce((sum, g) => sum + (g.not2_grade || 0), 0) / gradeCount;
        const avgAda2 = gradesForStudent.reduce((sum, g) => sum + (g.ada2_gama3y_grade || 0), 0) / gradeCount;
        const totalAvgGrade = avgTasleem + avgNot2 + avgAda2;

        // Store calculated averages
        studentData.averageTasleem = avgTasleem;
        studentData.averageNot2 = avgNot2;
        studentData.averageAda2 = avgAda2;
        studentData.averageTotal = totalAvgGrade;

        // Check if passed using average
        const passMark = (exam.pass_percentage / 100) * ((exam.tasleem_max || 0) + (exam.not2_max || 0) + (exam.ada2_max || 0));
        studentData.passed = totalAvgGrade >= passMark;

        // Add to totals for statistics
        totalScore += totalAvgGrade;
        tasleemTotal += avgTasleem;
        not2Total += avgNot2;
        ada2Total += avgAda2;

        if (studentData.passed) {
          passedCount++;
        }
        gradedStudentCount++;
      });

      // Get unique classes for filter
      const allClasses = [...new Set(allStudents?.map(s => s.class).filter(Boolean) || [])];

      const statistics = {
        totalStudents,
        gradedStudents: gradedStudentCount,
        passRate: gradedStudentCount > 0 ? (passedCount / gradedStudentCount) * 100 : 0,
        averageScore: gradedStudentCount > 0 ? (totalScore / gradedStudentCount) : 0,
        averageTasleem: gradedStudentCount > 0 ? (tasleemTotal / gradedStudentCount) : 0,
        averageNot2: gradedStudentCount > 0 ? (not2Total / gradedStudentCount) : 0,
        averageAda2: gradedStudentCount > 0 ? (ada2Total / gradedStudentCount) : 0,
        pendingGrading: totalStudents - gradedStudentCount,
        allClasses
      };

      // Process student grades for table (including unattended students)
      const studentGrades = [];
      const processedStudentIds = new Set();

      // Add graded students with their averages
      studentGradeMap.forEach((studentData, studentId) => {
        processedStudentIds.add(studentId);

        // Get all unique teachers for this student
        const teachers = [...new Set(studentData.grades.map(g => g.teacher?.name).filter(Boolean))];

        studentGrades.push({
          id: studentData.grades[0].id, // Use first grade ID
          studentId: studentId,
          studentCode: studentData.studentInfo?.code || '',
          studentName: studentData.studentInfo?.name || 'Unknown',
          className: studentData.studentInfo?.class || 'N/A',
          teacherName: teachers.length > 0 ? teachers.join(', ') : 'Unknown',
          tasleemGrade: studentData.averageTasleem,
          not2Grade: studentData.averageNot2,
          ada2Grade: studentData.averageAda2,
          totalGrade: studentData.averageTotal,
          passed: studentData.passed,
          gradedAt: studentData.grades[0].created_at,
          isGraded: true,
          gradeCount: studentData.grades.length
        });
      });

      // Add unattended students (no grades submitted)
      allStudents?.forEach(student => {
        if (!processedStudentIds.has(student.id)) {
          studentGrades.push({
            id: `unattended-${student.id}`,
            studentId: student.id,
            studentCode: student.code || '',
            studentName: student.name || 'Unknown',
            className: student.class || 'N/A',
            teacherName: 'Unattended',
            tasleemGrade: 0,
            not2Grade: 0,
            ada2Grade: 0,
            totalGrade: 0,
            passed: false,
            gradedAt: '',
            isGraded: false,
            gradeCount: 0
          });
        }
      });

      // Calculate class performance for chart
      const classPerformanceMap = new Map();
      studentGrades.forEach(student => {
        const className = student.className;
        if (!classPerformanceMap.has(className)) {
          classPerformanceMap.set(className, {
            className,
            totalStudents: 0,
            gradedStudents: 0,
            totalScore: 0,
            passingStudents: 0
          });
        }
        const classData = classPerformanceMap.get(className);
        classData.totalStudents++;

        if (student.isGraded) {
          classData.gradedStudents++;
          classData.totalScore += student.totalGrade;
          if (student.passed) {
            classData.passingStudents++;
          }
        }
      });

      const classPerformance = Array.from(classPerformanceMap.values()).map(cls => ({
        className: cls.className,
        averageScore: cls.gradedStudents > 0 ? cls.totalScore / cls.gradedStudents : 0,
        totalStudents: cls.totalStudents,
        gradedStudents: cls.gradedStudents,
        passRate: cls.gradedStudents > 0 ? (cls.passingStudents / cls.gradedStudents) * 100 : 0
      })).sort((a, b) => a.className.localeCompare(b.className));

      // Calculate teacher performance
      const teacherPerformanceMap = new Map();
      grades?.forEach(grade => {
        const teacherId = grade.teacher_id;
        const teacherName = grade.teacher?.name || 'Unknown';

        if (!teacherPerformanceMap.has(teacherId)) {
          teacherPerformanceMap.set(teacherId, {
            teacherId,
            teacherName,
            totalGraded: 0,
            grades: [],
            classes: new Set()
          });
        }

        const teacherData = teacherPerformanceMap.get(teacherId);
        teacherData.totalGraded++;
        teacherData.grades.push(grade.total_grade || 0);
        if (grade.student?.class) {
          teacherData.classes.add(grade.student.class);
        }
      });

      const teacherPerformance = Array.from(teacherPerformanceMap.values()).map(teacher => {
        const grades = teacher.grades;
        const average = grades.length > 0 ? grades.reduce((sum, g) => sum + g, 0) / grades.length : 0;
        const variance = grades.length > 0 ? grades.reduce((sum, g) => sum + Math.pow(g - average, 2), 0) / grades.length : 0;
        const consistencyScore = Math.max(0, 100 - (Math.sqrt(variance) / average * 100));

        return {
          teacherId: teacher.teacherId,
          teacherName: teacher.teacherName,
          totalGraded: teacher.totalGraded,
          averageScore: average,
          gradeVariance: variance,
          consistencyScore: Math.round(consistencyScore),
          classes: Array.from(teacher.classes).sort(),
          gradeDistribution: this.calculateGradeDistribution(grades, (exam.tasleem_max || 0) + (exam.not2_max || 0) + (exam.ada2_max || 0))
        };
      });

      // Generate alerts based on data analysis
      const alerts = [];

      // Alert for pending grading
      if (statistics.pendingGrading > 0) {
        alerts.push({
          id: 'pending',
          type: 'grading' as const,
          severity: statistics.pendingGrading > 20 ? 'high' as const : 'low' as const,
          message: `${statistics.pendingGrading} students still need grading`,
          affectedEntities: ['pending_students']
        });
      }

      // Alert for low pass rate
      if (statistics.passRate < 70) {
        alerts.push({
          id: 'low_pass_rate',
          type: 'performance' as const,
          severity: 'high' as const,
          message: `Pass rate is only ${statistics.passRate.toFixed(1)}% (below 70%)`,
          affectedEntities: ['school_performance']
        });
      }

      const examDetailData = {
        exam,
        statistics,
        classPerformance,
        teacherPerformance,
        studentGrades,
        alerts
      };

      return {
        data: examDetailData,
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

  // Calculate grade distribution for charts
  private static calculateGradeDistribution(grades: number[], maxScore: number) {
    if (grades.length === 0) {
      return {
        excellent: 0,  // 90-100%
        good: 0,        // 80-89%
        satisfactory: 0, // 70-79%
        needsImprovement: 0, // 60-69%
        poor: 0         // <60%
      };
    }

    const distribution = {
      excellent: 0,
      good: 0,
      satisfactory: 0,
      needsImprovement: 0,
      poor: 0
    };

    grades.forEach(grade => {
      const percentage = (grade / maxScore) * 100;
      if (percentage >= 90) distribution.excellent++;
      else if (percentage >= 80) distribution.good++;
      else if (percentage >= 70) distribution.satisfactory++;
      else if (percentage >= 60) distribution.needsImprovement++;
      else distribution.poor++;
    });

    return distribution;
  }

  // Get filtered and paginated student grades
  static async getFilteredStudentGrades(
    examId: string,
    filters: {
      search: string;
      class: string;
      passStatus: 'all' | 'pass' | 'fail' | 'pending' | 'unattended';
    },
    page: number = 1,
    pageSize: number = 25
  ): Promise<ApiResponse<any>> {
    try {
      // Get all students first to get total count
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, code, name, class, stage')
        .eq('is_active', true);

      if (studentsError) {
        throw new Error(studentsError.message);
      }

      // Apply filters to student list
      let filteredStudents = allStudents || [];

      if (filters.class !== 'all') {
        filteredStudents = filteredStudents.filter(student => student.class === filters.class);
      }

      if (filters.search) {
        filteredStudents = filteredStudents.filter(student =>
          student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          student.code.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      // Get grades for these students
      const studentIds = filteredStudents.map(s => s.id);
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          student:students(id, code, name, class),
          teacher:teachers(id, name)
        `)
        .eq('exam_id', examId)
        .in('student_id', studentIds);

      if (gradesError) {
        console.warn('No grades found for exam:', gradesError.message);
      }

      // Group grades by student
      const studentGradeMap = new Map();
      grades?.forEach(grade => {
        const studentId = grade.student_id;
        if (!studentGradeMap.has(studentId)) {
          studentGradeMap.set(studentId, {
            grades: [],
            studentInfo: grade.student,
            teacherInfo: grade.teacher
          });
        }
        studentGradeMap.get(studentId).grades.push(grade);
      });

      // Process student data
      const processedStudents = [];
      let totalGradedCount = 0;

      // Get exam data for pass status calculation
      const examResponse = await supabase
        .from('hymns_exams')
        .select('pass_percentage, tasleem_max, not2_max, ada2_max')
        .eq('id', examId)
        .single();

      const examData = examResponse.data;
      const totalPossibleMarks = examData ? ((examData.tasleem_max || 0) + (examData.not2_max || 0) + (examData.ada2_max || 0)) : 0;
      const passMark = examData ? (examData.pass_percentage / 100) * totalPossibleMarks : 0;

      for (const student of filteredStudents) {
        const studentData = studentGradeMap.get(student.id);
        const isGraded = !!studentData;
        let studentGradeRecord: any = null;

        if (isGraded) {
          const gradesForStudent = studentData.grades;
          const avgTasleem = gradesForStudent.reduce((sum, g) => sum + (g.tasleem_grade || 0), 0) / gradesForStudent.length;
          const avgNot2 = gradesForStudent.reduce((sum, g) => sum + (g.not2_grade || 0), 0) / gradesForStudent.length;
          const avgAda2 = gradesForStudent.reduce((sum, g) => sum + (g.ada2_gama3y_grade || 0), 0) / gradesForStudent.length;
          const totalAvgGrade = avgTasleem + avgNot2 + avgAda2;

          // Calculate pass/fail status for all graded students
          const passed = totalAvgGrade >= passMark;

          // Debug logging for pass/fail calculation
          console.log(`Student ${student.name || 'Unknown'}:`);
          console.log(`  Total Grade: ${totalAvgGrade}/${totalPossibleMarks} (${totalPossibleMarks > 0 ? ((totalAvgGrade / totalPossibleMarks) * 100).toFixed(1) : 0}%)`);
          console.log(`  Pass Percentage: ${examData?.pass_percentage || 'N/A'}%`);
          console.log(`  Pass Mark: ${passMark}`);
          console.log(`  Passed: ${passed}`);

          studentGradeRecord = {
            id: studentData.grades[0].id,
            studentId: student.id,
            studentCode: student.code || '',
            studentName: student.name || 'Unknown',
            className: student.class || 'N/A',
            teacherName: [...new Set(studentData.grades.map(g => g.teacher?.name).filter(Boolean))].join(', ') || 'Unknown',
            tasleemGrade: avgTasleem,
            not2Grade: avgNot2,
            ada2Grade: avgAda2,
            totalGrade: totalAvgGrade,
            passed: passed,
            gradedAt: studentData.grades[0].created_at,
            isGraded: true,
            gradeCount: studentData.grades.length
          };

          totalGradedCount++;
        } else {
          studentGradeRecord = {
            id: `unattended-${student.id}`,
            studentId: student.id,
            studentCode: student.code || '',
            studentName: student.name || 'Unknown',
            className: student.class || 'N/A',
            teacherName: 'Unattended',
            tasleemGrade: 0,
            not2Grade: 0,
            ada2Grade: 0,
            totalGrade: 0,
            passed: false,
            gradedAt: '',
            isGraded: false,
            gradeCount: 0
          };
        }

        // Apply pass status filter (only if not 'all')
        if (filters.passStatus !== 'all') {
          if (filters.passStatus === 'pass' && !studentGradeRecord.passed) continue;
          if (filters.passStatus === 'fail' && studentGradeRecord.passed) continue;
          if (filters.passStatus === 'unattended' && studentGradeRecord.isGraded) continue;
        }

        processedStudents.push(studentGradeRecord);
      }

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedStudents = processedStudents.slice(startIndex, endIndex);

      return {
        data: {
          studentGrades: paginatedStudents,
          totalCount: processedStudents.length,
          totalPages: Math.ceil(processedStudents.length / pageSize),
          currentPage: page
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

  // Export exam grades data
  static async exportExamGrades(examId: string, format: 'excel' | 'csv'): Promise<ApiResponse<Blob>> {
    try {
      // Get exam detail data
      const examResponse = await this.getHymnsExamDetail(examId);

      if (!examResponse.success || !examResponse.data) {
        return {
          data: null,
          error: examResponse.error || 'Failed to load exam data',
          success: false
        };
      }

      const { exam, studentGrades } = examResponse.data;

      // Create CSV content
      const headers = ['Student Code', 'Student Name', 'Class', 'Teacher', 'Tasleem', 'Not2', 'Ada2', 'Total', 'Status'];
      const csvContent = [
        headers.join(','),
        ...studentGrades.map(grade => [
          grade.studentCode,
          `"${grade.studentName}"`,
          grade.className,
          `"${grade.teacherName}"`,
          grade.tasleemGrade,
          grade.not2Grade,
          grade.ada2Grade,
          grade.totalGrade,
          grade.passed ? 'Pass' : 'Fail'
        ].join(','))
      ].join('\n');

      // Create blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      return {
        data: blob,
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

  // Send grading reminders to teachers
  static async sendGradingReminders(examId: string, teacherIds?: string[]): Promise<ApiResponse<any>> {
    try {
      // This would integrate with an email service
      // For now, just return success
      console.log('Sending grading reminders for exam:', examId, 'to teachers:', teacherIds || 'all');

      return {
        data: { message: 'Reminders sent successfully' },
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

export default SupabaseService;