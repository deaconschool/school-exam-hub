import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Student, TeacherGrade, GradeInputData } from '@/data/types';
import { SupabaseService } from '@/services/supabaseService';
import { GradeService } from '@/services/gradeService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Save, AlertCircle, CheckCircle, Users } from 'lucide-react';

interface GradeInputs {
  tasleem: string;
  not2: string;
  ada2_gama3y: string;
}

interface GradingTableProps {
  batchedStudents: Student[];
  teacherId: string;
  teacherName: string;
  onStudentRemove: (studentCode: string) => void;
  onClearBatch: () => void;
}

const GradingTable = ({
  batchedStudents,
  teacherId,
  teacherName,
  onStudentRemove,
  onClearBatch
}: GradingTableProps) => {
  const { t, language } = useLanguage();
  const [gradeInputs, setGradeInputs] = useState<Record<string, GradeInputs>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [gradeCriteria, setGradeCriteria] = useState(GradeService.getGradeCriteria());
  const isRtl = language === 'ar';

  // Initialize grade inputs with existing grades from Supabase
  useEffect(() => {
    const loadGrades = async () => {
      try {
        const initialInputs: Record<string, GradeInputs> = {};

        // Load grades for all students in batch
        for (const student of batchedStudents) {
          try {
            const gradesResponse = await SupabaseService.getStudentGrades(student.code);

            if (gradesResponse.success && gradesResponse.data && gradesResponse.data.length > 0) {
              // Find the most recent grade for the current teacher
              const teacherGrade = gradesResponse.data.find(grade =>
                grade.teacher_id === teacherId
              );

              if (teacherGrade) {
                initialInputs[student.code] = {
                  tasleem: teacherGrade.tasleem_grade?.toString() || '',
                  not2: teacherGrade.not2_grade?.toString() || '',
                  ada2_gama3y_grade: teacherGrade.ada2_gama3y_grade?.toString() || ''
                };
              } else {
                initialInputs[student.code] = {
                  tasleem: '',
                  not2: '',
                  ada2_gama3y: ''
                };
              }
            } else {
              initialInputs[student.code] = {
                tasleem: '',
                not2: '',
                ada2_gama3y: ''
              };
            }
          } catch (error) {
            console.error(`Error loading grades for student ${student.code}:`, error);
            // Fallback to empty inputs
            initialInputs[student.code] = {
              tasleem: '',
              not2: '',
              ada2_gama3y: ''
            };
          }
        }

        setGradeInputs(initialInputs);
      } catch (error) {
        console.error('Error in grade inputs initialization:', error);
        // Set empty inputs as fallback
        const fallbackInputs: Record<string, GradeInputs> = {};
        batchedStudents.forEach(student => {
          fallbackInputs[student.code] = {
            tasleem: '',
            not2: '',
            ada2_gama3y: ''
          };
        });
        setGradeInputs(fallbackInputs);
      }
    };

    loadGrades();
  }, [batchedStudents, teacherId]);

  // Validate grade input using configurable ranges
  const validateGradeInput = (value: string, criterion: 'tasleem' | 'not2' | 'ada2_gama3y'): boolean => {
    if (value === '') return true; // Empty is allowed
    const num = parseFloat(value);
    if (isNaN(num)) return false;

    const range = gradeCriteria[criterion];
    return num >= range.min && num <= range.max;
  };

  // Handle grade input change
  const handleGradeChange = (studentCode: string, field: keyof GradeInputs, value: string) => {
    // Only allow numbers and empty string
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setGradeInputs(prev => ({
      ...prev,
      [studentCode]: {
        ...prev[studentCode],
        [field]: value
      }
    }));

    // Clear error for this field if valid (use the field name as criterion)
    if (validateGradeInput(value, field as 'tasleem' | 'not2' | 'ada2_gama3y')) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${studentCode}_${field}`];
        return newErrors;
      });
    }
  };

  // Validate all inputs for a student
  const validateStudentGrades = (studentCode: string): boolean => {
    const inputs = gradeInputs[studentCode];
    if (!inputs) return false;

    const newErrors: Record<string, string> = {};

    ['tasleem', 'not2', 'ada2_gama3y'].forEach(field => {
      const value = inputs[field as keyof GradeInputs];
      if (!validateGradeInput(value)) {
        newErrors[`${studentCode}_${field}`] = t('القيمة يجب أن تكون بين 0 و 20', 'Value must be between 0 and 20');
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return false;
    }

    return true;
  };

  // Save grades for a student
  const handleSaveGrades = async (studentCode: string) => {
    if (!validateStudentGrades(studentCode)) {
      return;
    }

    setSavingStates(prev => ({ ...prev, [studentCode]: true }));
    setSuccess('');
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[studentCode];
      return newErrors;
    });

    try {
      const inputs = gradeInputs[studentCode];

      // Convert to numbers
      const gradeInput: GradeInputData = {
        tasleem: parseFloat(inputs.tasleem) || 0,
        not2: parseFloat(inputs.not2) || 0,
        ada2_gama3y: parseFloat(inputs.ada2_gama3y) || 0
      };

      // Create teacher object
      const teacher = {
        id: teacherId,
        name: teacherName,
        password: '' // Not needed for grading
      };

      // Validate inputs
      const validation = GradeService.validateGradeInputs(gradeInput);
      if (!validation.isValid) {
        setErrors(prev => ({
          ...prev,
          [studentCode]: validation.errors.join(', ')
        }));
        setSavingStates(prev => ({ ...prev, [studentCode]: false }));
        return;
      }

      // Get exams to use for grading (use first available exam)
      const examsResponse = await SupabaseService.getExams();
      let examId = '00000000-0000-0000-0000-000000000000'; // Default UUID

      if (examsResponse.success && examsResponse.data && examsResponse.data.length > 0) {
        examId = examsResponse.data[0].id;
      }

      // Save grades using Supabase service
      const saveResponse = await SupabaseService.saveGrades(
        studentCode,
        teacherId,
        examId,
        gradeInput.tasleem,
        gradeInput.not2,
        gradeInput.ada2_gama3y,
        'Graded via teacher dashboard'
      );

      if (saveResponse.success) {
        setSuccess(t('تم حفظ التقييمات بنجاح', 'Grades saved successfully'));

        // Update UI to show saved state
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setErrors(prev => ({
          ...prev,
          [studentCode]: saveResponse.error || t('فشل حفظ التقييمات. يرجى المحاولة مرة أخرى', 'Failed to save grades. Please try again')
        }));
      }

    } catch (error) {
      console.error('Error saving grades:', error);
      setErrors(prev => ({
        ...prev,
        [studentCode]: t('حدث خطأ غير متوقع', 'An unexpected error occurred')
      }));
    } finally {
      setSavingStates(prev => ({ ...prev, [studentCode]: false }));
    }
  };

  // Calculate total score for a student
  const calculateTotal = (studentCode: string): number => {
    const inputs = gradeInputs[studentCode];
    if (!inputs) return 0;

    const tasleem = parseFloat(inputs.tasleem) || 0;
    const not2 = parseFloat(inputs.not2) || 0;
    const ada2_gama3y = parseFloat(inputs.ada2_gama3y) || 0;

    return tasleem + not2 + ada2_gama3y;
  };

  // Get existing grade info for a student (check if grades are already loaded)
  const getExistingGrades = (studentCode: string): boolean => {
    const inputs = gradeInputs[studentCode];
    if (!inputs) return false;
    return inputs.tasleem !== '' || inputs.not2 !== '' || inputs.ada2_gama3y !== '';
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
  };

  if (batchedStudents.length === 0) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {t('لا يوجد طلاب في الدفعة', 'No Students in Batch')}
          </h3>
          <p className="text-gray-600">
            {t('ابحث عن الطلاب وأضفهم إلى الدفعة لبدء التقييم', 'Search for students and add them to the batch to start grading')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            {t('دفعة التقييم', 'Grading Batch')} ({batchedStudents.length} {t('طالب', 'students')})
          </CardTitle>
          <Button
            onClick={onClearBatch}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {t('إنهاء الدفعة', 'End Batch')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Success Message */}
        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Transposed Grading Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">{t('المعيار', 'Criterion')}</TableHead>
                {batchedStudents.map((student) => {
                  const existingGrades = getExistingGrades(student.code);
                  return (
                    <TableHead key={student.code} className="text-center min-w-[140px]">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{student.name}</div>
                        <div className="text-xs text-slate-600 font-mono">{student.code}</div>
                        {existingGrades && (
                          <Badge variant="secondary" className="text-xs">
                            {t('مقيم', 'Graded')}
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Delivery Row */}
              <TableRow>
                <TableCell className="font-medium">
                  <div>
                    {t('تسليم', 'Delivery')}
                    <div className="text-xs text-slate-600">({gradeCriteria.tasleem.min}-{gradeCriteria.tasleem.max})</div>
                  </div>
                </TableCell>
                {batchedStudents.map((student) => {
                  const inputs = gradeInputs[student.code] || { tasleem: '', not2: '', ada2_gama3y: '' };
                  const isSaving = savingStates[student.code];
                  return (
                    <TableCell key={student.code} className="text-center">
                      <Input
                        type="number"
                        min={gradeCriteria.tasleem.min}
                        max={gradeCriteria.tasleem.max}
                        step="0.5"
                        value={inputs.tasleem}
                        onChange={(e) => handleGradeChange(student.code, 'tasleem', e.target.value)}
                        className={`w-16 text-center text-sm ${errors[`${student.code}_tasleem`] ? 'border-red-500' : ''}`}
                        placeholder={`${gradeCriteria.tasleem.min}-${gradeCriteria.tasleem.max}`}
                        disabled={isSaving}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Pronunciation Row */}
              <TableRow>
                <TableCell className="font-medium">
                  <div>
                    {t('نطق', 'Pronunciation')}
                    <div className="text-xs text-slate-600">({gradeCriteria.not2.min}-{gradeCriteria.not2.max})</div>
                  </div>
                </TableCell>
                {batchedStudents.map((student) => {
                  const inputs = gradeInputs[student.code] || { tasleem: '', not2: '', ada2_gama3y: '' };
                  const isSaving = savingStates[student.code];
                  return (
                    <TableCell key={student.code} className="text-center">
                      <Input
                        type="number"
                        min={gradeCriteria.not2.min}
                        max={gradeCriteria.not2.max}
                        step="0.5"
                        value={inputs.not2}
                        onChange={(e) => handleGradeChange(student.code, 'not2', e.target.value)}
                        className={`w-16 text-center text-sm ${errors[`${student.code}_not2`] ? 'border-red-500' : ''}`}
                        placeholder={`${gradeCriteria.not2.min}-${gradeCriteria.not2.max}`}
                        disabled={isSaving}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Group Performance Row */}
              <TableRow>
                <TableCell className="font-medium">
                  <div>
                    {t('أداء جماعي', 'Group Performance')}
                    <div className="text-xs text-slate-600">({gradeCriteria.ada2_gama3y.min}-{gradeCriteria.ada2_gama3y.max})</div>
                  </div>
                </TableCell>
                {batchedStudents.map((student) => {
                  const inputs = gradeInputs[student.code] || { tasleem: '', not2: '', ada2_gama3y: '' };
                  const isSaving = savingStates[student.code];
                  return (
                    <TableCell key={student.code} className="text-center">
                      <Input
                        type="number"
                        min={gradeCriteria.ada2_gama3y.min}
                        max={gradeCriteria.ada2_gama3y.max}
                        step="0.5"
                        value={inputs.ada2_gama3y}
                        onChange={(e) => handleGradeChange(student.code, 'ada2_gama3y', e.target.value)}
                        className={`w-16 text-center text-sm ${errors[`${student.code}_ada2_gama3y`] ? 'border-red-500' : ''}`}
                        placeholder={`${gradeCriteria.ada2_gama3y.min}-${gradeCriteria.ada2_gama3y.max}`}
                        disabled={isSaving}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Total Row */}
              <TableRow className="bg-blue-50">
                <TableCell className="font-bold">
                  {t('المجموع', 'Total')}
                  <div className="text-xs text-slate-600 font-normal">
                    {t('من', 'out of')} {gradeCriteria.tasleem.max + gradeCriteria.not2.max + gradeCriteria.ada2_gama3y.max}
                  </div>
                </TableCell>
                {batchedStudents.map((student) => (
                  <TableCell key={student.code} className="text-center">
                    <div className="font-bold text-lg text-blue-600">
                      {calculateTotal(student.code)}
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Actions Row */}
              <TableRow>
                <TableCell className="font-medium">{t('الإجراءات', 'Actions')}</TableCell>
                {batchedStudents.map((student) => {
                  const isSaving = savingStates[student.code];
                  const hasErrors = Object.keys(errors).some(key => key.startsWith(student.code));
                  return (
                    <TableCell key={student.code} className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          onClick={() => handleSaveGrades(student.code)}
                          size="sm"
                          disabled={isSaving}
                          className={`flex items-center gap-1 text-xs px-2 py-1 ${hasErrors ? 'bg-red-100 hover:bg-red-200' : ''}`}
                        >
                          {isSaving ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                          {t('حفظ', 'Save')}
                        </Button>
                        <Button
                          onClick={() => onStudentRemove(student.code)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2 py-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {t('تعليمات التقييم', 'Grading Instructions')}
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• {t('تسليم:', 'Delivery:')} {language === 'ar' ? gradeCriteria.tasleem.description_ar : gradeCriteria.tasleem.description_en} ({gradeCriteria.tasleem.min}-{gradeCriteria.tasleem.max})</li>
            <li>• {t('نطق:', 'Pronunciation:')} {language === 'ar' ? gradeCriteria.not2.description_ar : gradeCriteria.not2.description_en} ({gradeCriteria.not2.min}-{gradeCriteria.not2.max})</li>
            <li>• {t('أداء جماعي:', 'Group Performance:')} {language === 'ar' ? gradeCriteria.ada2_gama3y.description_ar : gradeCriteria.ada2_gama3y.description_en} ({gradeCriteria.ada2_gama3y.min}-{gradeCriteria.ada2_gama3y.max})</li>
            <li>• {t('المجموع الأقصى:', 'Maximum total:')} {gradeCriteria.tasleem.max + gradeCriteria.not2.max + gradeCriteria.ada2_gama3y.max} {t('درجة', 'points')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GradingTable;