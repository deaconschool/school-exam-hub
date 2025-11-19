// Local data service - to be replaced with Supabase implementation later
import { stagesData, subjects } from '@/data/stages';
import { examsData } from '@/data/exams';
import { studentsData } from '@/data/students';
import { teachersData } from '@/data/teachers';
import { gradesData } from '@/data/grades';
import { GradeService } from './gradeService';
import type { Stage, Exam, Student, Teacher, StudentGrades, GradeInputData } from '@/data/types';

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

  // Teachers data
  static getTeacherById(id: string): Teacher | null {
    return teachersData[id] || null;
  }

  static getAllTeachers(): Teacher[] {
    return Object.values(teachersData);
  }

  static validateTeacherCredentials(id: string, password: string): boolean {
    const teacher = this.getTeacherById(id);
    return teacher ? teacher.password === password : false;
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
    console.log('Adding student:', student);
  }

  static updateStudent(code: string, updates: Partial<Student>): void {
    // Placeholder for updating student - will be implemented with Supabase
    console.log('Updating student:', code, updates);
  }

  static deleteStudent(code: string): void {
    // Placeholder for deleting student - will be implemented with Supabase
    console.log('Deleting student:', code);
  }

  static addExam(exam: Exam, level: number, className: string, subject: string): void {
    // Placeholder for adding exam - will be implemented with Supabase
    console.log('Adding exam:', exam, 'to stage:', level, 'class:', className, 'subject:', subject);
  }

  static updateExam(examId: string, updates: Partial<Exam>): void {
    // Placeholder for updating exam - will be implemented with Supabase
    console.log('Updating exam:', examId, updates);
  }

  static deleteExam(examId: string): void {
    // Placeholder for deleting exam - will be implemented with Supabase
    console.log('Deleting exam:', examId);
  }
}