import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SupabaseService } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExcelExportProps {
  classFilter?: string;
  teacherId?: string;
}

interface ExportStudent {
  code: string;
  name: string;
  class: string;
  level: number;
  grades: {
    teacher_name: string;
    teacher_id: string;
    tasleem_grade: number | null;
    not2_grade: number | null;
    ada2_gama3y_grade: number | null;
    total_grade: number | null;
  }[];
  average: number;
}

const ExcelExport = ({ classFilter = '', teacherId = '' }: ExcelExportProps) => {
  const { t, language } = useLanguage();
  const [selectedClass, setSelectedClass] = useState<string>(classFilter);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const isRtl = language === 'ar';

  // Load available classes on component mount
  useEffect(() => {
    loadAvailableClasses();
  }, []);

  const loadAvailableClasses = async () => {
    try {
      const response = await SupabaseService.getStudents();
      if (response.success && response.data) {
        const classes = [...new Set(response.data.map(student => student.class).filter(Boolean))];
        setAvailableClasses(classes);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  // Export class grades to Excel
  const handleExport = async () => {
    if (!selectedClass) {
      setError(t('الرجاء اختيار الفصل', 'Please select a class'));
      return;
    }

    setIsExporting(true);
    setError('');
    setSuccess('');

    try {
      // Get all students in the selected class
      const studentsResponse = await SupabaseService.getStudents();
      if (!studentsResponse.success || !studentsResponse.data) {
        throw new Error(t('فشل الحصول على بيانات الطلاب', 'Failed to get student data'));
      }

      const classStudents = studentsResponse.data.filter(student => student.class === selectedClass);

      if (classStudents.length === 0) {
        setError(t('لا يوجد طلاب في هذا الفصل', 'No students found in this class'));
        return;
      }

      // Get grades for all students in the class
      const exportData: ExportStudent[] = [];

      for (const student of classStudents) {
        const gradesResponse = await SupabaseService.getStudentGrades(student.code);

        if (gradesResponse.success && gradesResponse.data) {
          // Group grades by teacher
          const teacherGrades = gradesResponse.data.reduce((acc, grade) => {
            if (!acc[grade.teacher_id]) {
              acc[grade.teacher_id] = [];
            }
            acc[grade.teacher_id].push(grade);
            return acc;
          }, {} as Record<string, any[]>);

          // Get the most recent grade from each teacher
          const grades = Object.values(teacherGrades).map(gradesArray => {
            const latestGrade = gradesArray.sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];

            return {
              teacher_name: latestGrade.teachers?.name || 'Unknown',
              teacher_id: latestGrade.teacher_id,
              tasleem_grade: latestGrade.tasleem_grade,
              not2_grade: latestGrade.not2_grade,
              ada2_gama3y_grade: latestGrade.ada2_gama3y_grade,
              total_grade: latestGrade.total_grade
            };
          });

          // Calculate average
          const validGrades = grades.filter(g => g.total_grade !== null);
          const average = validGrades.length > 0
            ? validGrades.reduce((sum, g) => sum + g.total_grade!, 0) / validGrades.length
            : 0;

          exportData.push({
            code: student.code,
            name: student.name,
            class: student.class,
            level: student.level,
            grades,
            average: Math.round(average * 100) / 100
          });
        } else {
          // Student with no grades
          exportData.push({
            code: student.code,
            name: student.name,
            class: student.class,
            level: student.level,
            grades: [],
            average: 0
          });
        }
      }

      // Create Excel data
      await createExcelExport(exportData, selectedClass);

      setSuccess(t(`تم تصدير بيانات ${exportData.length} طالب بنجاح`, `Successfully exported data for ${exportData.length} students`));
    } catch (err) {
      setError(t('خطأ في التصدير', 'Export error') + ': ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  };

  // Create Excel file
  const createExcelExport = async (data: ExportStudent[], className: string) => {
    // Determine unique teachers and create header
    const allTeachers = [...new Set(data.flatMap(s => s.grades.map(g => g.teacher_name)))].sort();
    const uniqueTeachers = allTeachers.length > 0 ? allTeachers : [t('معلم يتم التقييم بعد', 'Not graded yet')];

    // Create header row
    const headerRow = [
      t('اسم الطالب', 'Student Name'),
      t('الكود', 'Code'),
      t('الفصل', 'Class'),
      t('المستوى', 'Level')
    ];

    // Add teacher columns
    uniqueTeachers.forEach(teacherName => {
      headerRow.push(`${teacherName} - ${t('تسليم', 'Delivery')}`);
      headerRow.push(`${teacherName} - ${t('نطق', 'Pronunciation')}`);
      headerRow.push(`${teacherName} - ${t('أداء جماعي', 'Group Performance')}`);
      headerRow.push(`${teacherName} - ${t('المجموع', 'Total')}`);
    });

    // Add average column
    headerRow.push(t('المتوسط', 'Average'));

    // Create data rows
    const dataRows = [headerRow];

    data.forEach(student => {
      const row = [
        student.name,
        student.code,
        student.class,
        student.level.toString()
      ];

      // Add teacher grades
      uniqueTeachers.forEach(teacherName => {
        const teacherGrade = student.grades.find(g => g.teacher_name === teacherName);
        if (teacherGrade) {
          row.push(teacherGrade.tasleem_grade || '');
          row.push(teacherGrade.not2_grade || '');
          row.push(teacherGrade.ada2_gama3y_grade || '');
          row.push(teacherGrade.total_grade || '');
        } else {
          row.push('', '', '', '');
        }
      });

      // Add average
      row.push(student.average > 0 ? student.average : '');

      dataRows.push(row);
    });

    // Create summary statistics
    const summaryRow = [
      t('إحصائيات', 'Statistics'),
      '',
      '',
      ''
    ];

    uniqueTeachers.forEach(teacherName => {
      const teacherGrades = data.flatMap(s => s.grades.filter(g => g.teacher_name === teacherName));
      const validTotals = teacherGrades.filter(g => g.total_grade !== null).map(g => g.total_grade!);
      const avg = validTotals.length > 0 ? Math.round((validTotals.reduce((a, b) => a + b, 0) / validTotals.length) * 100) / 100 : 0;

      summaryRow.push(`${t('المتوسط:', 'Average:')} ${avg}`);
      summaryRow.push('');
      summaryRow.push('');
      summaryRow.push('');
    });

    const overallAverage = data.filter(s => s.average > 0).reduce((sum, s) => sum + s.average, 0) / data.filter(s => s.average > 0).length;
    summaryRow.push(`${t('متوسط الصف:', 'Class Average:')} ${Math.round(overallAverage * 100) / 100}`);

    dataRows.push([]);
    dataRows.push(summaryRow);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(dataRows);

    // Apply styling
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FF4F81BD" } },
        alignment: { horizontal: "center" }
      };
    }

    // Style the header row
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FF4F81BD" } },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin", color: { rgb: "FF000000" } },
          bottom: { style: "thin", color: { rgb: "FF000000" } },
          left: { style: "thin", color: { rgb: "FF000000" } },
          right: { style: "thin", color: { rgb: "FF000000" } }
        }
      };
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('نتائج التقييم', 'Grading Results'));

    // Save file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `${t('نتائج_تقييم', 'Grading_Results')}_${className}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          {t('تصدير نتائج التقييم إلى Excel', 'Export Grading Results to Excel')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('تعليمات التصدير', 'Export Instructions')}
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• {t('اختر الفصل لتصدير نتائج التقييم', 'Select class to export grading results')}</li>
            <li>• {t('سيتم تصدير جميع درجات المعلمين للطلاب في هذا الفصل', 'All teacher grades for students in this class will be exported')}</li>
            <li>• {t('يشمل الملف المتوسطات والإحصائيات', 'The file includes averages and statistics')}</li>
            <li>• {t('صيغة الملف: .xlsx', 'File format: .xlsx')}</li>
          </ul>
        </div>

        {/* Class Selection */}
        <div className="space-y-2">
          <Label htmlFor="class-select">{t('اختر الفصل', 'Select Class')}</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder={t('اختر الفصل لتصدير نتائجه', 'Select class to export results')} />
            </SelectTrigger>
            <SelectContent>
              {availableClasses.map(cls => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting || !selectedClass}
          className="w-full"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {isExporting ? t('جاري التصدير...', 'Exporting...') : t('تصدير نتائج الفصل', 'Export Class Results')}
        </Button>

        {/* Messages */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelExport;