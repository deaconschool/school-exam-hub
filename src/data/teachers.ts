export interface Teacher {
  id: string;
  password: string;
  name: string;
}

export const teachersData: Record<string, Teacher> = {
  "T001": {
    id: "T001",
    password: "123456",
    name: "Mr. Andrew"
  },
  "T002": {
    id: "T002",
    password: "123456",
    name: "Mr. Antoon"
  },
  "T003": {
    id: "T003",
    password: "123456",
    name: "Mr. Mina"
  }
};