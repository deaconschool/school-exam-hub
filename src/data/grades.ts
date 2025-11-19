export interface TeacherGrade {
  teacher_name: string;
  teacher_id: string;
  tasleem: number; // Delivery/Presentation (0-20)
  not2: number; // Pronunciation (0-20)
  ada2_gama3y: number; // Group Performance (0-20)
  total: number; // Sum of all grades (0-60)
  timestamp: string;
  updated_at?: string;
}

export interface StudentGrades {
  average: number;
  total_teachers: number;
  last_updated: string;
  [teacherId: string]: TeacherGrade | number;
}

// Grade input form data
export interface GradeInputData {
  tasleem: number;
  not2: number;
  ada2_gama3y: number;
}

// Grade calculation result
export interface GradeCalculationResult {
  total: number;
  average: number;
  teacher_count: number;
}

// Grade range configuration (for future admin settings)
export interface GradeRange {
  min: number;
  max: number;
  description_ar: string;
  description_en: string;
}

// Grade criteria configuration
export interface GradeCriteria {
  tasleem: GradeRange;
  not2: GradeRange;
  ada2_gama3y: GradeRange;
}

// Default grade criteria configuration (can be overridden by admin in Phase 4)
export const defaultGradeCriteria: GradeCriteria = {
  tasleem: {
    min: 0,
    max: 20,
    description_ar: 'التسليم والأداء العام',
    description_en: 'Delivery and overall performance'
  },
  not2: {
    min: 0,
    max: 20,
    description_ar: 'دقة النطق ووضوحه',
    description_en: 'Pronunciation accuracy and clarity'
  },
  ada2_gama3y: {
    min: 0,
    max: 20,
    description_ar: 'التفاعل مع المجموعة',
    description_en: 'Group interaction and participation'
  }
};

export const gradesData: Record<string, StudentGrades> = {
  "11111": {
    average: 35,
    total_teachers: 2,
    last_updated: "2025-01-15T11:00:00",
    T001: {
      teacher_name: "Mr. Andrew",
      teacher_id: "T001",
      tasleem: 20,
      not2: 10,
      ada2_gama3y: 10,
      total: 40,
      timestamp: "2025-01-15T10:30:00",
      updated_at: "2025-01-15T10:30:00"
    },
    T002: {
      teacher_name: "Mr. Antoon",
      teacher_id: "T002",
      tasleem: 17,
      not2: 8,
      ada2_gama3y: 9,
      total: 34,
      timestamp: "2025-01-15T11:00:00",
      updated_at: "2025-01-15T11:00:00"
    }
  },
  "22222": {
    average: 34,
    total_teachers: 2,
    last_updated: "2025-01-15T11:05:00",
    T001: {
      teacher_name: "Mr. Andrew",
      teacher_id: "T001",
      tasleem: 18,
      not2: 9,
      ada2_gama3y: 10,
      total: 37,
      timestamp: "2025-01-15T10:35:00",
      updated_at: "2025-01-15T10:35:00"
    },
    T003: {
      teacher_name: "Mr. Mina",
      teacher_id: "T003",
      tasleem: 16,
      not2: 8,
      ada2_gama3y: 9,
      total: 33,
      timestamp: "2025-01-15T11:05:00",
      updated_at: "2025-01-15T11:05:00"
    }
  },
  // Add more test students for better testing
  "33333": {
    average: 0,
    total_teachers: 0,
    last_updated: "2025-01-17T00:00:00"
  },
  "44444": {
    average: 0,
    total_teachers: 0,
    last_updated: "2025-01-17T00:00:00"
  },
  "55555": {
    average: 0,
    total_teachers: 0,
    last_updated: "2025-01-17T00:00:00"
  }
};