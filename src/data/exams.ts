import { Stage } from './stages';

export interface Exam {
  id: string;
  title: string;
  url: string;
  date_created: string;
}

export interface ExamsData {
  [level: string]: {
    stage_name_ar: string;
    stage_name_en: string;
    classes: {
      [className: string]: {
        [subject: string]: Exam[];
      };
    };
  };
}

export const examsData: ExamsData = {
  "0": {
    stage_name_ar: "حضانة",
    stage_name_en: "Kindergarten",
    classes: {
      "الملاك ميخائيل": {
        "قبطى": [
          {
            id: "exam_001",
            title: "امتحان قبطى - يناير 2025",
            url: "https://forms.gle/demo001",
            date_created: "2025-01-01"
          }
        ],
        "طقس": [
          {
            id: "exam_002",
            title: "امتحان طقس - يناير 2025",
            url: "https://forms.gle/demo002",
            date_created: "2025-01-01"
          }
        ],
        "عقيدة": [
          {
            id: "exam_003",
            title: "امتحان عقيدة - يناير 2025",
            url: "https://forms.gle/demo003",
            date_created: "2025-01-01"
          }
        ]
      }
    }
  },
  "1": {
    stage_name_ar: "أولى وثانية",
    stage_name_en: "First & Second Primary",
    classes: {
      "القديس أبانوب": {
        "قبطى": [
          {
            id: "exam_004",
            title: "امتحان قبطى - يناير 2025",
            url: "https://forms.gle/demo004",
            date_created: "2025-01-01"
          }
        ],
        "طقس": [
          {
            id: "exam_005",
            title: "امتحان طقس - يناير 2025",
            url: "https://forms.gle/demo005",
            date_created: "2025-01-01"
          }
        ],
        "عقيدة": [
          {
            id: "exam_006",
            title: "امتحان عقيدة - يناير 2025",
            url: "https://forms.gle/demo006",
            date_created: "2025-01-01"
          }
        ]
      },
      "القديس كرياكوس": {
        "قبطى": [
          {
            id: "exam_007",
            title: "امتحان قبطى - يناير 2025",
            url: "https://forms.gle/demo007",
            date_created: "2025-01-01"
          }
        ],
        "طقس": [
          {
            id: "exam_008",
            title: "امتحان طقس - يناير 2025",
            url: "https://forms.gle/demo008",
            date_created: "2025-01-01"
          }
        ]
      },
      "القديس ونس": {
        "قبطى": [
          {
            id: "exam_009",
            title: "امتحان قبطى - يناير 2025",
            url: "https://forms.gle/demo009",
            date_created: "2025-01-01"
          },
          {
            id: "exam_010",
            title: "امتحان قبطى متقدم - يناير 2025",
            url: "https://forms.gle/demo010",
            date_created: "2025-01-01"
          }
        ],
        "عقيدة": [
          {
            id: "exam_011",
            title: "امتحان عقيدة - يناير 2025",
            url: "https://forms.gle/demo011",
            date_created: "2025-01-01"
          }
        ]
      },
      "المرتل داود": {
        "طقس": [
          {
            id: "exam_012",
            title: "امتحان طقس - يناير 2025",
            url: "https://forms.gle/demo012",
            date_created: "2025-01-01"
          }
        ],
        "عقيدة": [
          {
            id: "exam_013",
            title: "امتحان عقيدة - يناير 2025",
            url: "https://forms.gle/demo013",
            date_created: "2025-01-01"
          }
        ]
      }
    }
  },
  "2": {
    stage_name_ar: "ثالثة ورابعة",
    stage_name_en: "Third & Fourth Primary",
    classes: {
      "القديس استفانوس": {
        "قبطى": [
          {
            id: "exam_014",
            title: "امتحان قبطى - يناير 2025",
            url: "https://forms.gle/demo014",
            date_created: "2025-01-01"
          }
        ],
        "عقيدة": [
          {
            id: "exam_015",
            title: "امتحان عقيدة - يناير 2025",
            url: "https://forms.gle/demo015",
            date_created: "2025-01-01"
          }
        ]
      },
      "القديس مارمرقس": {
        "قبطى": [
          {
            id: "exam_016",
            title: "امتحان قبطى - يناير 2025",
            url: "https://forms.gle/demo016",
            date_created: "2025-01-01"
          }
        ],
        "طقس": [
          {
            id: "exam_017",
            title: "امتحان طقس - يناير 2025",
            url: "https://forms.gle/demo017",
            date_created: "2025-01-01"
          }
        ]
      },
      "القديس يوحنا المعمدان": {
        "قبطى": [
          {
            id: "exam_018",
            title: "امتحان قبطى - يناير 2025",
            url: "https://forms.gle/demo018",
            date_created: "2025-01-01"
          }
        ],
        "طقس": [
          {
            id: "exam_019",
            title: "امتحان طقس - يناير 2025",
            url: "https://forms.gle/demo019",
            date_created: "2025-01-01"
          }
        ],
        "عقيدة": [
          {
            id: "exam_020",
            title: "امتحان عقيدة - يناير 2025",
            url: "https://forms.gle/demo020",
            date_created: "2025-01-01"
          }
        ]
      }
    }
  },
  "3": {
    stage_name_ar: "خامسة وسادسة",
    stage_name_en: "Fifth & Sixth Primary",
    classes: {
      "البابا أثناسيوس": {
        "قبطى": [
          {
            id: "exam_021",
            title: "امتحان قبطى - يناير 2025",
            url: "https://forms.gle/demo021",
            date_created: "2025-01-01"
          }
        ]
      },
      "البابا كيرلس عمود الدين": {
        "عقيدة": [
          {
            id: "exam_022",
            title: "امتحان عقيدة متقدم - يناير 2025",
            url: "https://forms.gle/demo022",
            date_created: "2025-01-01"
          }
        ]
      },
      "القديسة دميانة": {
        "طقس": [
          {
            id: "exam_023",
            title: "امتحان طقس - يناير 2025",
            url: "https://forms.gle/demo023",
            date_created: "2025-01-01"
          }
        ]
      }
    }
  },
  "4": {
    stage_name_ar: "اعدادى وثانوى",
    stage_name_en: "Preparatory & Secondary",
    classes: {
      "القديسة العذراء مريم": {
        "قبطى": [
          {
            id: "exam_024",
            title: "امتحان قبطى متقدم - يناير 2025",
            url: "https://forms.gle/demo024",
            date_created: "2025-01-01"
          }
        ]
      },
      "القديس ديسقورس": {
        "عقيدة": [
          {
            id: "exam_025",
            title: "امتحان عقيدة متقدم - يناير 2025",
            url: "https://forms.gle/demo025",
            date_created: "2025-01-01"
          }
        ]
      }
    }
  }
};