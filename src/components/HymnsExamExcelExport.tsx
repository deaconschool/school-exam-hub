import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface TeacherGrade {
  teacherName: string;
  tasleem: number | null;
  not2: number | null;
  ada2: number | null;
  total: number | null;
}

interface ExportStudent {
  name: string;
  code: string;
  averageGrade: number;
  teacherGrades: TeacherGrade[];
}

interface ExamInfo {
  title: string;
  maxTasleem: number;
  maxNot2: number;
  maxAda2: number;
  totalMax: number;
  passPercentage: number;
}

interface HymnsExamExcelExportProps {
  examInfo: ExamInfo;
  students: ExportStudent[];
  className: string;
}

const HymnsExamExcelExport: React.FC<HymnsExamExcelExportProps> = ({
  examInfo,
  students,
  className
}) => {
  const generateExcel = () => {
    try {
      // Create the worksheet data structure
      const worksheetData: any[][] = [];

      // Define criteria names in Arabic
      const criteriaNames = {
        tasleem: 'نطق',
        not2: 'أداء',
        ada2: 'مجموعة'
      };

      // Collect all unique teachers
      const allTeachers = new Set<string>();
      students.forEach(student => {
        student.teacherGrades.forEach(grade => {
          allTeachers.add(grade.teacherName);
        });
      });

      const teacherArray = Array.from(allTeachers);

      // Create header row
      const headerRow = ['اسم الطالب', 'متوسط الدرجات', 'الدرجة القصوى'];

      // Add teacher columns
      teacherArray.forEach(teacherName => {
        headerRow.push(`${teacherName}: ${criteriaNames.tasleem}`);
        headerRow.push(`${teacherName}: ${criteriaNames.not2}`);
        headerRow.push(`${teacherName}: ${criteriaNames.ada2}`);
        headerRow.push(`${teacherName}: المجموع`);
      });

      worksheetData.push(headerRow);

      // Add data rows
      students.forEach(student => {
        const row = [
          student.name,
          student.averageGrade.toFixed(1),
          examInfo.totalMax
        ];

        // Add teacher grades
        teacherArray.forEach(teacherName => {
          const teacherGrade = student.teacherGrades.find(g => g.teacherName === teacherName);
          if (teacherGrade) {
            row.push(teacherGrade.tasleem || '');
            row.push(teacherGrade.not2 || '');
            row.push(teacherGrade.ada2 || '');
            row.push(teacherGrade.total || '');
          } else {
            row.push('', '', '', '');
          }
        });

        worksheetData.push(row);
      });

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = [
        { wch: 25 }, // Student name
        { wch: 15 }, // Average grade
        { wch: 15 }  // Max grade
      ];

      // Add widths for teacher columns (4 columns per teacher)
      teacherArray.forEach(() => {
        colWidths.push({ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 });
      });

      ws['!cols'] = colWidths;

      // Apply styling to header row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellAddress]) continue;

        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: '4F81BD' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { auto: 1 } },
            bottom: { style: 'thin', color: { auto: 1 } },
            left: { style: 'thin', color: { auto: 1 } },
            right: { style: 'thin', color: { auto: 1 } }
          }
        };
      }

      // Apply styling to data rows
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;

          ws[cellAddress].s = {
            alignment: { horizontal: 'center' },
            border: {
              top: { style: 'thin', color: { auto: 1 } },
              bottom: { style: 'thin', color: { auto: 1 } },
              left: { style: 'thin', color: { auto: 1 } },
              right: { style: 'thin', color: { auto: 1 } }
            }
          };
        }
      }

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Grades');

      // Generate filename
      const today = new Date().toISOString().split('T')[0];
      const filename = `HymnsExam_${className}_${examInfo.title}_${today}.xlsx`;

      // Write file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

      // Convert to Blob
      const blob = new Blob([s2ab(wbout)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Save file
      saveAs(blob, filename);

      toast.success(`تم تصدير درجات الصف ${className} بنجاح`);

    } catch (error) {
      console.error('Error generating Excel file:', error);
      toast.error('حدث خطأ أثناء تصدير الملف');
    }
  };

  // Helper function to convert string to ArrayBuffer
  const s2ab = (s: string) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
  };

  return (
    <button
      onClick={generateExcel}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      تصدير إلى Excel
    </button>
  );
};

export default HymnsExamExcelExport;