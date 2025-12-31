// Note type definitions for student grade viewing system

export interface StudentNotes {
  action_type: 'hint' | 'warning' | 'danger' | 'note';
  message_ar: string;
  message_en: string;
}

export interface ExamNotes {
  display_mode: 'show' | 'hide' | 'hint' | 'warning' | 'danger';
  hint_message_ar?: string;
  hint_message_en?: string;
}

export interface GradeDisplaySettings {
  studentNotes?: StudentNotes;
  examNotes?: ExamNotes;
  finalDisplayMode: 'show' | 'hide' | 'hint' | 'warning' | 'danger';
  hintMessage?: string;
}

// Theme types
export type GradeTheme = 'blue' | 'orange' | 'red' | 'gray';

export interface GradeThemeConfig {
  background: string;
  text: string;
  border: string;
  icon?: 'Star' | 'AlertTriangle' | 'XCircle' | 'EyeOff';
}
