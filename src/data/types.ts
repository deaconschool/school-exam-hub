// Unified type definitions for the school examination portal
export type { Stage } from './stages';
export type { Exam, ExamsData } from './exams';
export type { Student } from './students';
export type { Teacher } from './teachers';
export type { TeacherGrade, StudentGrades } from './grades';

// Additional shared types
export interface ExamCardProps {
  exam: {
    id: string;
    title: string;
    subject: string;
    class: string;
    url: string;
  };
}

export interface DropdownOption {
  value: string | number;
  label: string;
}

export interface NavigationState {
  selectedStage: string | null;
  selectedClass: string | null;
  selectedSubject: string | null;
}