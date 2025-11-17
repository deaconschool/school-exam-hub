export interface Student {
  code: string;
  name: string;
  level: number;
  class: string;
}

export const studentsData: Record<string, Student> = {
  "11111": {
    code: "11111",
    name: "Youssef Kamel",
    level: 0,
    class: "الملاك ميخائيل"
  },
  "22222": {
    code: "22222",
    name: "Youhana Hany",
    level: 1,
    class: "القديس ونس"
  },
  "33333": {
    code: "33333",
    name: "Mina Adel",
    level: 1,
    class: "القديس أبانوب"
  },
  "44444": {
    code: "44444",
    name: "Marko Girgis",
    level: 2,
    class: "القديس استفانوس"
  },
  "55555": {
    code: "55555",
    name: "Beshoy Sameh",
    level: 3,
    class: "البابا أثناسيوس"
  },
  "66666": {
    code: "66666",
    name: "Karim Rafat",
    level: 4,
    class: "القديسة العذراء مريم"
  }
};