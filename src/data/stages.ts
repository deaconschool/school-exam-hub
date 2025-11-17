export interface Stage {
  name_ar: string;
  name_en: string;
  level: number;
  classes: string[];
}

export const stagesData: Stage[] = [
  {
    name_ar: "حضانة",
    name_en: "Kindergarten",
    level: 0,
    classes: ["الملاك ميخائيل"]
  },
  {
    name_ar: "أولى وثانية",
    name_en: "First & Second Primary",
    level: 1,
    classes: [
      "القديس أبانوب",
      "القديس كرياكوس",
      "القديس ونس",
      "المرتل داود"
    ]
  },
  {
    name_ar: "ثالثة ورابعة",
    name_en: "Third & Fourth Primary",
    level: 2,
    classes: [
      "القديس استفانوس",
      "القديس مارمرقس",
      "القديس يوحنا المعمدان"
    ]
  },
  {
    name_ar: "خامسة وسادسة",
    name_en: "Fifth & Sixth Primary",
    level: 3,
    classes: [
      "البابا أثناسيوس",
      "البابا كيرلس عمود الدين",
      "القديسة دميانة"
    ]
  },
  {
    name_ar: "اعدادى وثانوى",
    name_en: "Preparatory & Secondary",
    level: 4,
    classes: [
      "القديسة العذراء مريم",
      "القديس ديسقورس"
    ]
  }
];

export const subjects = ["قبطى", "طقس", "عقيدة"];