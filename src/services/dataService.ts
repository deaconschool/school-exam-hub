// Local data service - being migrated to Supabase
import { stagesData, subjects } from '@/data/stages';
import { examsData } from '@/data/exams';
import { studentsData } from '@/data/students';
import { GradeService } from './gradeService';
import { supabase } from './supabaseService';
import type { Stage, Exam, Student, StudentGrades, GradeInputData } from '@/data/types';

// Teacher interface (migrated from deleted teachers.ts)
export interface Teacher {
  id: string;
  name: string;
  phone?: string;
  is_active?: boolean;
}

export class DataService {
  // Stages data
  static getStages(): Stage[] {
    return stagesData;
  }

  static getSubjects(): string[] {
    return subjects;
  }

  static getClassesByLevel(level: number): string[] {
    const stage = stagesData.find(s => s.level === level);
    return stage ? stage.classes : [];
  }

  // Exams data
  static getExamsByStageClassSubject(level: number, className: string, subject: string): Exam[] {
    const levelData = examsData[level.toString()];
    if (!levelData || !levelData.classes[className] || !levelData.classes[className][subject]) {
      return [];
    }
    return levelData.classes[className][subject];
  }

  static getAvailableSubjectsForStageClass(level: number, className: string): string[] {
    const levelData = examsData[level.toString()];
    if (!levelData || !levelData.classes[className]) {
      return [];
    }
    return Object.keys(levelData.classes[className]);
  }

  // Students data
  static getStudentByCode(code: string): Student | null {
    return studentsData[code] || null;
  }

  static getAllStudents(): Student[] {
    return Object.values(studentsData);
  }

  // Teachers data - migrated to Supabase for security
  static async getTeacherById(id: string): Promise<Teacher | null> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, phone, is_active')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  static async getAllTeachers(): Promise<Teacher[]> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, phone, is_active')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async validateTeacherCredentials(id: string, password: string): Promise<boolean> {
    try {
      // TEMPORARILY SIMPLIFIED - password should be "123456"
      if (password !== "123456") return false;

      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, is_active')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) return false;

      return true; // Teacher exists and is active
    } catch (error) {
      return false;
    }
  }

  // Grades data - now using GradeService
  static getStudentGrades(code: string): StudentGrades | null {
    return GradeService.getStudentGrades(code);
  }

  static getAllGrades(): Record<string, StudentGrades> {
    return GradeService.getAllGrades();
  }

  // Enhanced grade management methods
  static saveStudentGrades(
    studentCode: string,
    teacher: Teacher,
    gradeInput: GradeInputData
  ): boolean {
    return GradeService.saveStudentGrades(studentCode, teacher, gradeInput);
  }

  static validateGradeInputs(gradeInput: GradeInputData): { isValid: boolean; errors: string[] } {
    return GradeService.validateGradeInputs(gradeInput);
  }

  static calculateTotal(gradeInput: GradeInputData): number {
    return GradeService.calculateTotal(gradeInput);
  }

  static calculateStudentAverage(studentCode: string): number {
    return GradeService.calculateStudentAverage(studentCode);
  }

  static getTeacherGrades(teacherId: string): Record<string, any> {
    return GradeService.getTeacherGrades(teacherId);
  }

  static getGradeStatistics() {
    return GradeService.getGradeStatistics();
  }

  static addStudent(student: Student): void {
    // Placeholder for adding student - will be implemented with Supabase
  }

  static updateStudent(code: string, updates: Partial<Student>): void {
    // Placeholder for updating student - will be implemented with Supabase
  }

  static deleteStudent(code: string): void {
    // Placeholder for deleting student - will be implemented with Supabase
  }

  static addExam(exam: Exam, level: number, className: string, subject: string): void {
    // Placeholder for adding exam - will be implemented with Supabase
  }

  static updateExam(examId: string, updates: Partial<Exam>): void {
    // Placeholder for updating exam - will be implemented with Supabase
  }

  static deleteExam(examId: string): void {
    // Placeholder for deleting exam - will be implemented with Supabase
  }
}