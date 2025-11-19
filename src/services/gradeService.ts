import { gradesData, TeacherGrade, StudentGrades, GradeInputData, GradeCalculationResult, defaultGradeCriteria, GradeCriteria } from '@/data/grades';
import { Student, Teacher } from '@/data/types';

// Local storage keys for persistence
const GRADES_STORAGE_KEY = 'school_exam_grades';
const GRADE_CRITERIA_STORAGE_KEY = 'school_grade_criteria';

export class GradeService {
  // Initialize grades from localStorage or use default data
  private static getStoredGrades(): Record<string, StudentGrades> {
    try {
      // Check if localStorage is available
      if (typeof localStorage === 'undefined') {
        console.log('localStorage not available, using default data');
        return gradesData;
      }

      const stored = localStorage.getItem(GRADES_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('Loaded grades from localStorage:', parsed);

          // Validate the loaded data structure
          if (!parsed || typeof parsed !== 'object') {
            console.warn('Invalid grades data structure, using default');
            return gradesData;
          }

          return parsed;
        } catch (parseError) {
          console.error('Error parsing stored grades:', parseError);
          // Clear corrupted data and use defaults
          localStorage.removeItem(GRADES_STORAGE_KEY);
          return gradesData;
        }
      } else {
        console.log('No grades in localStorage, using default data');
        return gradesData;
      }
    } catch (error) {
      console.error('Error loading grades from localStorage:', error);
      console.log('Falling back to default grades data');
      return gradesData;
    }
  }

  // Save grades to localStorage
  private static saveGradesToStorage(grades: Record<string, StudentGrades>): void {
    try {
      localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(grades));
    } catch (error) {
      console.error('Error saving grades to localStorage:', error);
    }
  }

  // Calculate total score from grade inputs
  static calculateTotal(gradeInput: GradeInputData): number {
    return gradeInput.tasleem + gradeInput.not2 + gradeInput.ada2_gama3y;
  }

  // Calculate average grades for a student across all teachers
  static calculateStudentAverage(studentCode: string): number {
    const grades = this.getStudentGrades(studentCode);
    if (!grades) return 0;

    let totalSum = 0;
    let teacherCount = 0;

    Object.keys(grades).forEach(key => {
      if (key.startsWith('T')) {
        const teacherGrade = grades[key] as TeacherGrade;
        totalSum += teacherGrade.total;
        teacherCount++;
      }
    });

    return teacherCount > 0 ? Math.round((totalSum / teacherCount) * 100) / 100 : 0;
  }

  // Save or update grades for a student
  static saveStudentGrades(
    studentCode: string,
    teacher: Teacher,
    gradeInput: GradeInputData
  ): boolean {
    try {
      const storedGrades = this.getStoredGrades();
      const now = new Date().toISOString();

      // Create or update student record
      if (!storedGrades[studentCode]) {
        storedGrades[studentCode] = {
          average: 0,
          total_teachers: 0,
          last_updated: now
        };
      }

      const studentGrades = storedGrades[studentCode];
      const total = this.calculateTotal(gradeInput);

      // Create/update teacher grade entry
      const teacherGrade: TeacherGrade = {
        teacher_name: teacher.name,
        teacher_id: teacher.id,
        tasleem: gradeInput.tasleem,
        not2: gradeInput.not2,
        ada2_gama3y: gradeInput.ada2_gama3y,
        total: total,
        timestamp: now,
        updated_at: now
      };

      // Check if this is an update or new entry
      const isUpdate = !!studentGrades[teacher.id];

      studentGrades[teacher.id] = teacherGrade;
      studentGrades.last_updated = now;

      // Recalculate average
      studentGrades.average = this.calculateStudentAverage(studentCode);

      // Count teachers
      let teacherCount = 0;
      Object.keys(studentGrades).forEach(key => {
        if (key.startsWith('T')) {
          teacherCount++;
        }
      });
      studentGrades.total_teachers = teacherCount;

      // Save to storage
      this.saveGradesToStorage(storedGrades);

      console.log(`Grades ${isUpdate ? 'updated' : 'saved'} for student ${studentCode} by teacher ${teacher.name}`);
      return true;

    } catch (error) {
      console.error('Error saving grades:', error);
      return false;
    }
  }

  // Get grades for a specific student
  static getStudentGrades(studentCode: string): StudentGrades | null {
    try {
      if (!studentCode || typeof studentCode !== 'string') {
        console.warn('Invalid student code provided:', studentCode);
        return null;
      }

      const storedGrades = this.getStoredGrades();
      return storedGrades[studentCode] || null;
    } catch (error) {
      console.error('Error getting student grades:', error);
      return null;
    }
  }

  // Get grades for a specific teacher
  static getTeacherGrades(teacherId: string): Record<string, TeacherGrade> {
    try {
      const storedGrades = this.getStoredGrades();
      const teacherGrades: Record<string, TeacherGrade> = {};

      Object.keys(storedGrades).forEach(studentCode => {
        const studentGrades = storedGrades[studentCode];
        if (studentGrades[teacherId]) {
          teacherGrades[studentCode] = studentGrades[teacherId] as TeacherGrade;
        }
      });

      return teacherGrades;
    } catch (error) {
      console.error('Error getting teacher grades:', error);
      return {};
    }
  }

  // Get all grades (for admin functions)
  static getAllGrades(): Record<string, StudentGrades> {
    try {
      return this.getStoredGrades();
    } catch (error) {
      console.error('Error getting all grades:', error);
      return {};
    }
  }

  // Get grade criteria configuration (from localStorage or defaults)
  static getGradeCriteria(): GradeCriteria {
    try {
      if (typeof localStorage === 'undefined') {
        return defaultGradeCriteria;
      }

      const stored = localStorage.getItem(GRADE_CRITERIA_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Validate that stored criteria has the right structure
          if (parsed && typeof parsed === 'object' &&
              parsed.tasleem && parsed.not2 && parsed.ada2_gama3y) {
            console.log('Loaded grade criteria from localStorage:', parsed);
            return parsed;
          } else {
            console.warn('Invalid grade criteria structure, using defaults');
          }
        } catch (parseError) {
          console.error('Error parsing stored grade criteria:', parseError);
          localStorage.removeItem(GRADE_CRITERIA_STORAGE_KEY);
        }
      }

      console.log('No grade criteria in localStorage, using defaults');
      return defaultGradeCriteria;
    } catch (error) {
      console.error('Error loading grade criteria:', error);
      return defaultGradeCriteria;
    }
  }

  // Save grade criteria configuration (for admin use in Phase 4)
  static saveGradeCriteria(criteria: GradeCriteria): boolean {
    try {
      localStorage.setItem(GRADE_CRITERIA_STORAGE_KEY, JSON.stringify(criteria));
      console.log('Grade criteria saved:', criteria);
      return true;
    } catch (error) {
      console.error('Error saving grade criteria:', error);
      return false;
    }
  }

  // Validate grade inputs using configurable criteria
  static validateGradeInputs(gradeInput: GradeInputData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const criteria = this.getGradeCriteria();

    // Validate tasleem (Delivery)
    if (gradeInput.tasleem < criteria.tasleem.min || gradeInput.tasleem > criteria.tasleem.max) {
      errors.push(`Delivery (تسليم) must be between ${criteria.tasleem.min} and ${criteria.tasleem.max}`);
    }

    // Validate not2 (Pronunciation)
    if (gradeInput.not2 < criteria.not2.min || gradeInput.not2 > criteria.not2.max) {
      errors.push(`Pronunciation (نطق) must be between ${criteria.not2.min} and ${criteria.not2.max}`);
    }

    // Validate ada2_gama3y (Group Performance)
    if (gradeInput.ada2_gama3y < criteria.ada2_gama3y.min || gradeInput.ada2_gama3y > criteria.ada2_gama3y.max) {
      errors.push(`Group Performance (أداء جماعي) must be between ${criteria.ada2_gama3y.min} and ${criteria.ada2_gama3y.max}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get grade statistics
  static getGradeStatistics(): {
    totalStudents: number;
    totalTeachers: number;
    averageGrade: number;
    gradesPerTeacher: Record<string, number>;
  } {
    try {
      const allGrades = this.getAllGrades();
      let totalStudents = 0;
      let totalGrades = 0;
      let totalSum = 0;
      const gradesPerTeacher: Record<string, number> = {};

      Object.keys(allGrades).forEach(studentCode => {
        const studentGrades = allGrades[studentCode];
        totalStudents++;

        Object.keys(studentGrades).forEach(key => {
          if (key.startsWith('T')) {
            const teacherGrade = studentGrades[key] as TeacherGrade;
            totalGrades++;
            totalSum += teacherGrade.total;

            // Count grades per teacher
            gradesPerTeacher[key] = (gradesPerTeacher[key] || 0) + 1;
          }
        });
      });

      return {
        totalStudents,
        totalTeachers: Object.keys(gradesPerTeacher).length,
        averageGrade: totalGrades > 0 ? Math.round((totalSum / totalGrades) * 100) / 100 : 0,
        gradesPerTeacher
      };

    } catch (error) {
      console.error('Error getting grade statistics:', error);
      return {
        totalStudents: 0,
        totalTeachers: 0,
        averageGrade: 0,
        gradesPerTeacher: {}
      };
    }
  }

  // Export grades data (for future admin export functionality)
  static exportGradesForStudents(studentCodes: string[]): any[] {
    try {
      const allGrades = this.getAllGrades();
      const exportData: any[] = [];

      studentCodes.forEach(studentCode => {
        const studentGrades = allGrades[studentCode];
        if (studentGrades) {
          const row: any = {
            studentCode: studentCode,
            average: studentGrades.average,
            totalTeachers: studentGrades.total_teachers,
            lastUpdated: studentGrades.last_updated
          };

          // Add teacher grades as columns
          Object.keys(studentGrades).forEach(key => {
            if (key.startsWith('T')) {
              const teacherGrade = studentGrades[key] as TeacherGrade;
              row[`${key}_name`] = teacherGrade.teacher_name;
              row[`${key}_tasleem`] = teacherGrade.tasleem;
              row[`${key}_not2`] = teacherGrade.not2;
              row[`${key}_ada2_gama3y`] = teacherGrade.ada2_gama3y;
              row[`${key}_total`] = teacherGrade.total;
            }
          });

          exportData.push(row);
        }
      });

      return exportData;

    } catch (error) {
      console.error('Error exporting grades:', error);
      return [];
    }
  }

  // Delete student grades (for admin functions)
  static deleteStudentGrades(studentCode: string): boolean {
    try {
      const storedGrades = this.getStoredGrades();
      if (storedGrades[studentCode]) {
        delete storedGrades[studentCode];
        this.saveGradesToStorage(storedGrades);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting student grades:', error);
      return false;
    }
  }
}