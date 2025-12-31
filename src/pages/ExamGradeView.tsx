import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, BookOpen, Loader2, Star, XCircle, Download, Trophy, Users, Search, ChevronUp, ChevronDown, Award } from 'lucide-react';
import { SupabaseService } from '@/services/supabaseService';
import { toast } from 'sonner';
import { ExamNotes, GradeTheme, GradeThemeConfig } from '@/types/notes';

// Helper function to format numbers - show 1 decimal for long floats
const formatNumber = (num: number): string => {
  // If it's a whole number, show as integer
  if (Number.isInteger(num)) {
    return num.toString();
  }
  // Otherwise, round to 1 decimal place
  return (Math.round(num * 10) / 10).toString();
};

// Types
interface AggregatedStudentGrade {
  student_id: string;
  student_code: string;
  student_name: string;
  class_name: string;
  tasleem_avg: number;
  not2_avg: number;
  ada2_avg: number;
  total_avg: number;
  grade_count: number;
  exam_notes: ExamNotes | null;
}

interface ExamDetails {
  id: string;
  title_en: string;
  title_ar: string;
  exam_month: number;
  exam_year: number;
  tasleem_max: number;
  not2_max: number;
  ada2_max: number;
  pass_percentage: number;
  // Default hints for each mode
  default_warning_hint_ar?: string;
  default_warning_hint_en?: string;
  default_danger_hint_ar?: string;
  default_danger_hint_en?: string;
  // Teacher-only publish option
  teacher_only_publish?: boolean;
}

interface ClassInfo {
  id: string;
  name: string;
  stage_level: number;
}

// Theme configurations - Professional and subtle colors
const THEME_CONFIGS: Record<GradeTheme, GradeThemeConfig> = {
  // Professional emerald theme for passing (success)
  blue: { background: 'from-emerald-50 to-teal-50', text: 'text-emerald-900', border: 'border-emerald-200', icon: 'Star' },
  // Amber theme for warnings (professional warning color)
  orange: { background: 'from-amber-50 to-yellow-50', text: 'text-amber-900', border: 'border-amber-300', icon: 'AlertTriangle' },
  // Red theme for danger (failed)
  red: { background: 'from-red-100 to-rose-100', text: 'text-red-900', border: 'border-red-400', icon: 'XCircle' },
  // Gray theme for hidden grades
  gray: { background: 'from-gray-100 to-slate-100', text: 'text-gray-500', border: 'border-gray-300', icon: 'XCircle' }
};

// Helper function - Failed students get danger theme by default
// 50-75% success gets warning theme with default hint
const getDisplaySettings = (examNotes: ExamNotes | null, totalGrade: number, maxGrade: number, passPercentage: number, examDefaultHints?: { warning_ar?: string; warning_en?: string; danger_ar?: string; danger_en?: string }) => {
  const passingGrade = (maxGrade * passPercentage) / 100;
  const actualPercentage = (totalGrade / maxGrade) * 100;
  const isPassing = totalGrade >= passingGrade;

  // Default hints
  const defaultWarningHintAr = examDefaultHints?.warning_ar || 'برجاء الاستعداد الجيد للتقييم المقبل';
  const defaultWarningHintEn = examDefaultHints?.warning_en || 'Prepare better for the next exam';
  const defaultDangerHintAr = examDefaultHints?.danger_ar || 'يجب تحسين الأداء في المرة القادمة';
  const defaultDangerHintEn = examDefaultHints?.danger_en || 'Performance must improve next time';

  if (examNotes) {
    const displayMode = examNotes.display_mode || 'show';
    let theme: GradeTheme = 'blue';
    let hintMessageAr: string | undefined;
    let hintMessageEn: string | undefined;

    switch (displayMode) {
      case 'show':
        // Check if percentage is between 50-75% -> warning theme with hint
        if (actualPercentage >= 50 && actualPercentage < 75) {
          theme = 'orange';
          hintMessageAr = examNotes.hint_message_ar || defaultWarningHintAr;
          hintMessageEn = examNotes.hint_message_en || defaultWarningHintEn;
        } else if (actualPercentage < 50) {
          theme = 'red';
          hintMessageAr = examNotes.hint_message_ar || defaultDangerHintAr;
          hintMessageEn = examNotes.hint_message_en || defaultDangerHintEn;
        } else {
          theme = 'blue';
        }
        break;
      case 'hide':
      case 'hint':
        theme = 'gray';
        hintMessageAr = examNotes.hint_message_ar;
        hintMessageEn = examNotes.hint_message_en;
        break;
      case 'warning':
        theme = 'orange';
        hintMessageAr = examNotes.hint_message_ar || defaultWarningHintAr;
        hintMessageEn = examNotes.hint_message_en || defaultWarningHintEn;
        break;
      case 'danger':
        theme = 'red';
        hintMessageAr = examNotes.hint_message_ar || defaultDangerHintAr;
        hintMessageEn = examNotes.hint_message_en || defaultDangerHintEn;
        break;
    }
    return {
      mode: displayMode,
      theme,
      hintMessageAr,
      hintMessageEn,
      actualPercentage
    };
  }

  // Default behavior without exam_notes
  if (actualPercentage >= 50 && actualPercentage < 75) {
    return { mode: 'show' as const, theme: 'orange' as GradeTheme, hintMessageAr: defaultWarningHintAr, hintMessageEn: defaultWarningHintEn, actualPercentage };
  } else if (actualPercentage < 50) {
    return { mode: 'show' as const, theme: 'red' as GradeTheme, hintMessageAr: defaultDangerHintAr, hintMessageEn: defaultDangerHintEn, actualPercentage };
  }
  return { mode: 'show' as const, theme: 'blue' as GradeTheme, hintMessageAr: undefined, hintMessageEn: undefined, actualPercentage };
};

const ExamGradeView = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const isRtl = language === 'ar';

  // User role detection
  const isTeacher = sessionStorage.getItem('gradeViewIsTeacher') === 'true';
  const userId = isTeacher ? sessionStorage.getItem('gradeViewTeacherId') : sessionStorage.getItem('gradeViewStudentId');

  // State
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [allGrades, setAllGrades] = useState<AggregatedStudentGrade[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [classGradesCache, setClassGradesCache] = useState<Map<string, AggregatedStudentGrade[]>>(new Map());
  const [loadingClassId, setLoadingClassId] = useState<string | null>(null);

  // Table states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'code' | 'class' | 'tasleem' | 'not2' | 'ada2' | 'total'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Load exam and classes (not grades) on mount - Lazy Loading
  useEffect(() => {
    if (!examId) {
      toast.error(isRtl ? 'معرف الامتحان مفقود' : 'Exam ID is missing');
      navigate('/grades/exams');
      return;
    }
    loadInitialData();
  }, [examId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load exam details
      const examResponse = await SupabaseService.getHymnsExamById(examId!);
      if (!examResponse.success || !examResponse.data) {
        toast.error(isRtl ? 'الامتحان غير موجود' : 'Exam not found');
        navigate('/grades/exams');
        return;
      }
      setExam(examResponse.data);

      // For teachers, load assigned classes (NOT grades yet - lazy loading)
      if (isTeacher && userId) {
        const teacherResponse = await SupabaseService.getTeacherWithAssignedClasses(userId);
        if (teacherResponse.success && teacherResponse.data?.assigned_classes_details) {
          setAssignedClasses(teacherResponse.data.assigned_classes_details);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error(isRtl ? 'فشل في تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Lazy load class grades when teacher selects a class
  const loadClassGrades = useCallback(async (classId: string) => {
    // Check cache first
    if (classGradesCache.has(classId)) {
      setAllGrades(classGradesCache.get(classId)!);
      setSelectedClassId(classId);
      return;
    }

    setLoadingClassId(classId);
    try {
      const selectedClass = assignedClasses.find(c => c.id === classId);
      if (!selectedClass) return;

      const gradesResponse = await SupabaseService.getAggregatedGradesForTeacherExam(examId!, [selectedClass.name]);

      if (gradesResponse.success && gradesResponse.data) {
        setClassGradesCache(prev => new Map(prev).set(classId, gradesResponse.data));
        setAllGrades(gradesResponse.data);
      }
    } catch (error) {
      console.error('Error loading class grades:', error);
      toast.error(isRtl ? 'فشل في تحميل درجات الفصل' : 'Failed to load class grades');
    } finally {
      setLoadingClassId(null);
    }
  }, [assignedClasses, classGradesCache, examId]);

  // Load all classes grades (cached)
  const loadAllClassesGrades = useCallback(async () => {
    const cacheKey = 'all_classes';
    if (classGradesCache.has(cacheKey)) {
      setAllGrades(classGradesCache.get(cacheKey)!);
      setSelectedClassId(null);
      return;
    }

    setLoadingClassId('all');
    try {
      const classNames = assignedClasses.map(c => c.name);
      const gradesResponse = await SupabaseService.getAggregatedGradesForTeacherExam(examId!, classNames);

      if (gradesResponse.success && gradesResponse.data) {
        setClassGradesCache(prev => new Map(prev).set(cacheKey, gradesResponse.data));
        setAllGrades(gradesResponse.data);
      }
    } catch (error) {
      console.error('Error loading all grades:', error);
      toast.error(isRtl ? 'فشل في تحميل الدرجات' : 'Failed to load grades');
    } finally {
      setLoadingClassId(null);
    }
  }, [assignedClasses, classGradesCache, examId]);

  // Student mode - load their grades
  const loadStudentGrades = useCallback(async () => {
    if (!isTeacher && userId && exam) {
      const gradesResponse = await SupabaseService.getStudentGradesForExam(userId, exam.id!);
      if (gradesResponse.success && gradesResponse.data) {
        const studentGrades = gradesResponse.data.map(grade => ({
          student_id: grade.student_id,
          student_code: grade.students?.code || '',
          student_name: grade.students?.name || 'Unknown',
          class_name: grade.students?.class || '',
          tasleem_avg: grade.tasleem_grade,
          not2_avg: grade.not2_grade,
          ada2_avg: grade.ada2_gama3y_grade,
          total_avg: grade.total_grade,
          grade_count: 1,
          exam_notes: grade.exam_notes
        }));
        setAllGrades(studentGrades);
      }
    }
  }, [isTeacher, userId, exam]);

  // Load student grades when exam is loaded
  useEffect(() => {
    if (exam && !isTeacher) {
      loadStudentGrades();
    }
  }, [exam, isTeacher, loadStudentGrades]);

  // Handle class selection (lazy loading with caching)
  const handleClassSelect = useCallback((classId: string | null) => {
    if (classId === null) {
      loadAllClassesGrades();
    } else {
      loadClassGrades(classId);
    }
    setSelectedClassId(classId);
  }, [loadClassGrades, loadAllClassesGrades]);

  // Filter and sort grades
  const filteredGrades = useMemo(() => {
    return allGrades.filter(grade =>
      grade.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.student_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.class_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allGrades, searchTerm]);

  const sortedGrades = useMemo(() => {
    return [...filteredGrades].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'name': aVal = a.student_name; bVal = b.student_name; break;
        case 'code': aVal = a.student_code; bVal = b.student_code; break;
        case 'class': aVal = a.class_name; bVal = b.class_name; break;
        case 'tasleem': aVal = a.tasleem_avg; bVal = b.tasleem_avg; break;
        case 'not2': aVal = a.not2_avg; bVal = b.not2_avg; break;
        case 'ada2': aVal = a.ada2_avg; bVal = b.ada2_avg; break;
        case 'total': aVal = a.total_avg; bVal = b.total_avg; break;
        default: return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredGrades, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleBack = () => {
    navigate('/grades/exams');
  };

  const monthNames = {
    1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل',
    5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس',
    9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر'
  };

  // STUDENT CERTIFICATE VIEW - Full Screen Professional Certificate
  if (!isTeacher && allGrades.length > 0) {
    const studentGrade = allGrades[0];
    const maxGrade = (exam?.tasleem_max || 0) + (exam?.not2_max || 0) + (exam?.ada2_max || 0);
    const passingGrade = (maxGrade * (exam?.pass_percentage || 0)) / 100;
    const displaySettings = getDisplaySettings(studentGrade.exam_notes, studentGrade.total_avg, maxGrade, exam?.pass_percentage || 0, {
      warning_ar: exam?.default_warning_hint_ar,
      warning_en: exam?.default_warning_hint_en,
      danger_ar: exam?.default_danger_hint_ar,
      danger_en: exam?.default_danger_hint_en
    });
    const themeConfig = THEME_CONFIGS[displaySettings.theme];
    const isPassing = studentGrade.total_avg >= passingGrade;

    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeConfig.background} flex items-center justify-center p-3 sm:p-4 md:p-8`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl">
          {/* Back Button */}
          <button onClick={handleBack} className="mb-3 sm:mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
            <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${isRtl ? 'rotate-180' : ''}`} />
            <span className="text-sm sm:text-base">{t('العودة للاختبارات', 'Back to Exams')}</span>
          </button>

          {/* Certificate */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border-2 sm:border-4 border-white/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#91C6BC] to-[#4B9DA9] text-white p-4 sm:p-6 md:p-8 text-center">
              <div className="flex justify-center mb-2 sm:mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-white" />
                </div>
              </div>
              {/* Exam Subject */}
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-4">
                {exam && (isRtl ? exam.title_ar || exam.title_en : exam.title_en || exam.title_ar)}
              </p>
              <p className="text-white/90 text-sm sm:text-base md:text-lg font-medium mb-1">
                {t('مادة ألحان', 'Hymns Subject')}
              </p>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 md:p-8 lg:p-12">
              {/* Exam Info */}
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base md:text-lg">
                    {exam && `${monthNames[exam.exam_month as keyof typeof monthNames]} ${exam.exam_year}`}
                  </span>
                </div>
                <div className="text-gray-500 text-xs sm:text-sm">
                  {t('الكود', 'Code')}: {studentGrade.student_code}
                </div>
              </div>

              {/* Student Name */}
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <p className="text-gray-500 mb-1 sm:mb-2 text-xs sm:text-sm">{t('الطالب', 'Student')}</p>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{studentGrade.student_name}</h2>
                <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">{studentGrade.class_name}</p>
              </div>

              {/* Grade Display */}
              {displaySettings.mode === 'hide' ? (
                <div className="text-center py-8 sm:py-10 md:py-12">
                  <XCircle className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto text-gray-300 mb-3 sm:mb-4" />
                  <p className="text-lg sm:text-xl md:text-2xl font-medium text-gray-500">{t('الدرجة مخفية', 'Grade Hidden')}</p>
                </div>
              ) : displaySettings.mode === 'hint' && (displaySettings.hintMessageAr || displaySettings.hintMessageEn) ? (
                <div className="text-center py-8 sm:py-10 md:py-12">
                  <XCircle className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto text-gray-300 mb-3 sm:mb-4" />
                  <p className="text-lg sm:text-xl md:text-2xl font-medium text-gray-500">{isRtl ? (displaySettings.hintMessageAr || displaySettings.hintMessageEn) : (displaySettings.hintMessageEn || displaySettings.hintMessageAr)}</p>
                </div>
              ) : (
                <>
                  {/* Total Grade Circle */}
                  <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
                    <div className={`relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full bg-gradient-to-br ${themeConfig.background} border-3 sm:border-4 ${themeConfig.border} flex items-center justify-center shadow-lg shadow-black/5`}>
                      {/* Decorative inner ring */}
                      <div className={`absolute inset-2 sm:inset-2.5 rounded-full border-2 ${themeConfig.border}/30`}></div>
                      {/* Grade content */}
                      <div className="text-center z-10 flex flex-col items-center justify-center">
                        <div className={`text-4xl sm:text-5xl md:text-6xl font-bold leading-none ${themeConfig.text} tabular-nums`}>
                          {formatNumber(studentGrade.total_avg)}
                        </div>
                        {/* Separator line */}
                        <div className={`w-8 sm:w-10 md:w-12 h-px bg-gray-300/50 my-1.5 sm:my-2`}></div>
                        <div className={`text-lg sm:text-xl md:text-2xl font-medium tabular-nums ${themeConfig.text}/70`}>
                          {maxGrade}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grade Breakdown */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                    {[
                      { label: t('تسليم', 'Tasleem'), value: studentGrade.tasleem_avg, max: exam?.tasleem_max },
                      { label: t('نطق', 'Not2'), value: studentGrade.not2_avg, max: exam?.not2_max },
                      { label: t('أداء', 'Ada2'), value: studentGrade.ada2_avg, max: exam?.ada2_max }
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className={`text-xs sm:text-sm md:text-base ${themeConfig.text}/70 mb-1`}>{item.label}</div>
                        <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${themeConfig.text}`}>{formatNumber(item.value)}</div>
                        <div className={`text-xs sm:text-sm md:text-base ${themeConfig.text}/60`}>/ {item.max}</div>
                      </div>
                    ))}
                  </div>

                  {/* Hint Message (for warning/danger themes) */}
                  {displaySettings.theme !== 'blue' && displaySettings.theme !== 'gray' && (displaySettings.hintMessageAr || displaySettings.hintMessageEn) && (
                    <div className="text-center mb-4 sm:mb-6">
                      <span className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base md:text-lg font-medium ${displaySettings.theme === 'orange'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                        {isRtl ? (displaySettings.hintMessageAr || displaySettings.hintMessageEn) : (displaySettings.hintMessageEn || displaySettings.hintMessageAr)}
                      </span>
                    </div>
                  )}

                  {/* Grade Count */}
                  {studentGrade.grade_count > 1 && (
                    <div className="text-center mb-4 sm:mb-6">
                      <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 sm:px-4 py-1 sm:py-2 rounded-full">
                        {t(`متوسط ${studentGrade.grade_count} معلم`, `Average of ${studentGrade.grade_count} teachers`)}
                      </span>
                    </div>
                  )}

                  {/* Status */}
                  <div className="text-center">
                    {isPassing ? (
                      <span className="inline-flex items-center gap-1 sm:gap-2 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-green-100 text-green-800 rounded-full text-sm sm:text-base md:text-xl font-bold">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        {t('ناجح', 'Passed')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 sm:gap-2 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-red-100 text-red-800 rounded-full text-sm sm:text-base md:text-xl font-bold">
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        {t('أقل من درجة النجاح', 'Below Passing')}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-2 sm:p-3 md:p-4 text-center text-gray-500 text-xs sm:text-sm">
              {exam && `${exam.title_en || exam.title_ar} - ${monthNames[exam.exam_month as keyof typeof monthNames]} ${exam.exam_year}`}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TEACHER TABLE VIEW - Administrative table with sorting and filtering
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button onClick={handleBack} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
            <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
            {t('العودة للاختبارات', 'Back to Exams')}
          </button>

          {exam && (
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                  {isRtl ? exam.title_ar || exam.title_en : exam.title_en || exam.title_ar}
                </h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="text-sm">
                      {isRtl
                        ? `${monthNames[exam.exam_month as keyof typeof monthNames]} ${exam.exam_year}`
                        : `${monthNames[exam.exam_month as keyof typeof monthNames] || exam.exam_month} ${exam.exam_year}`
                      }
                    </span>
                  </div>
                  <span className="text-sm">{t('النجاح', 'Passing')}: {exam.pass_percentage}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <>
            {/* Class Filter - Lazy Loading: Only loads when teacher selects a class */}
            {isTeacher && assignedClasses.length > 0 && (
              <div className="mb-6">
                <Card className="bg-white border-2 border-purple-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-800">
                        {t('اختر الفصل لعرض الدرجات', 'Select a class to view grades')}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {assignedClasses.map((cls) => (
                        <button
                          key={cls.id}
                          onClick={() => handleClassSelect(cls.id)}
                          disabled={loadingClassId === cls.id}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedClassId === cls.id
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } ${loadingClassId === cls.id ? 'opacity-50' : ''}`}
                        >
                          {loadingClassId === cls.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t(`المرحلة ${cls.stage_level} - ${cls.name}`, `Stage ${cls.stage_level} - ${cls.name}`)
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => handleClassSelect(null)}
                        disabled={loadingClassId === 'all'}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedClassId === null
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } ${loadingClassId === 'all' ? 'opacity-50' : ''}`}
                      >
                        {loadingClassId === 'all' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          t('الكل', 'All')
                        )}
                      </button>
                    </div>
                    {selectedClassId === null && allGrades.length > 0 && (
                      <p className="text-sm text-gray-500 mt-2">({allGrades.length} {t('طالب', 'students')})</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Search Bar - Show when we have grades */}
            {allGrades.length > 0 && (
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder={isRtl ? 'ابحث عن طالب...' : 'Search for a student...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </div>
            )}

            {/* Empty State */}
            {allGrades.length === 0 && !loading && !loadingClassId && (
              <Card className="text-center py-16">
                <CardContent>
                  <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {isTeacher
                      ? t('اختر فصلاً لعرض الدرجات', 'Select a class to view grades')
                      : t('لا توجد درجات لهذا الامتحان', 'No grades found for this exam')
                    }
                  </h3>
                </CardContent>
              </Card>
            )}

            {/* Grades Table - Administrative View */}
            {allGrades.length > 0 && (
              <Card className="bg-white border-2 border-purple-100">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button onClick={() => handleSort('name')} className="flex items-center gap-1 font-semibold hover:text-purple-700">
                          {t('الاسم', 'Name')}
                          {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('code')} className="flex items-center gap-1 font-semibold hover:text-purple-700">
                          {t('الكود', 'Code')}
                          {sortField === 'code' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('class')} className="flex items-center gap-1 font-semibold hover:text-purple-700">
                          {t('الفصل', 'Class')}
                          {sortField === 'class' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('tasleem')} className="flex items-center gap-1 font-semibold hover:text-purple-700">
                          {t('تسليم', 'Tasleem')}
                          {sortField === 'tasleem' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('not2')} className="flex items-center gap-1 font-semibold hover:text-purple-700">
                          {t('نطق', 'Not2')}
                          {sortField === 'not2' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('ada2')} className="flex items-center gap-1 font-semibold hover:text-purple-700">
                          {t('أداء', 'Ada2')}
                          {sortField === 'ada2' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button onClick={() => handleSort('total')} className="flex items-center gap-1 font-semibold hover:text-purple-700">
                          {t('المجموع', 'Total')}
                          {sortField === 'total' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                        </button>
                      </TableHead>
                      <TableHead>{t('الحالة', 'Status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedGrades.map((grade) => {
                      const maxGrade = (exam?.tasleem_max || 0) + (exam?.not2_max || 0) + (exam?.ada2_max || 0);
                      const passingGrade = (maxGrade * (exam?.pass_percentage || 0)) / 100;
                      const isPassing = grade.total_avg >= passingGrade;

                      return (
                        <TableRow key={grade.student_id} className="hover:bg-purple-50/50">
                          <TableCell className="font-medium">{grade.student_name}</TableCell>
                          <TableCell>{grade.student_code}</TableCell>
                          <TableCell>{grade.class_name}</TableCell>
                          <TableCell>{formatNumber(grade.tasleem_avg)}/{exam?.tasleem_max}</TableCell>
                          <TableCell>{formatNumber(grade.not2_avg)}/{exam?.not2_max}</TableCell>
                          <TableCell>{formatNumber(grade.ada2_avg)}/{exam?.ada2_max}</TableCell>
                          <TableCell>
                            <span className={`font-bold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
                              {formatNumber(grade.total_avg)}/{maxGrade}
                            </span>
                          </TableCell>
                          <TableCell>
                            {isPassing ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                <Star className="w-3 h-3" />
                                {t('ناجح', 'Passed')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                <XCircle className="w-3 h-3" />
                                {t('راسب', 'Failed')}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {sortedGrades.length === 0 && (
                  <div className="text-center py-8 text-gray-500">{t('لا توجد نتائج مطابقة', 'No matching results')}</div>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExamGradeView;
