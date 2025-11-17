export interface TeacherGrade {
  teacher_name: string;
  tasleem: number; // Delivery/Presentation (0-20)
  not2: number; // Pronunciation (0-20)
  ada2_gama3y: number; // Group Performance (0-20)
  timestamp: string;
}

export interface StudentGrades {
  average: number;
  [teacherId: string]: TeacherGrade | number;
}

export const gradesData: Record<string, StudentGrades> = {
  "11111": {
    average: 35,
    T001: {
      teacher_name: "Mr. Andrew",
      tasleem: 20,
      not2: 10,
      ada2_gama3y: 10,
      timestamp: "2025-01-15T10:30:00"
    },
    T002: {
      teacher_name: "Mr. Antoon",
      tasleem: 17,
      not2: 8,
      ada2_gama3y: 9,
      timestamp: "2025-01-15T11:00:00"
    }
  },
  "22222": {
    average: 34,
    T001: {
      teacher_name: "Mr. Andrew",
      tasleem: 18,
      not2: 9,
      ada2_gama3y: 10,
      timestamp: "2025-01-15T10:35:00"
    },
    T003: {
      teacher_name: "Mr. Mina",
      tasleem: 16,
      not2: 8,
      ada2_gama3y: 9,
      timestamp: "2025-01-15T11:05:00"
    }
  }
};