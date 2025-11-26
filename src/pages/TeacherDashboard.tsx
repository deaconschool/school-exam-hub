import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StudentSearch from '@/components/StudentSearch';
import GradingTable from '@/components/GradingTable';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Student } from '@/data/types';
import { SupabaseService } from '@/services/supabaseService';
import { LogOut, Users, FileText, RefreshCw } from 'lucide-react';

const TeacherDashboard = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user, logout, teacherName, teacherId } = useAuth();
  const [batchedStudents, setBatchedStudents] = useState<Student[]>([]);
  const isRtl = language === 'ar';

  // Handle logout with navigation
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Add student to grading batch
  const handleStudentAdd = (student: Student) => {
    try {
      // Validate student object before adding
      if (!student || typeof student !== 'object') {
        return;
      }

      if (!student.code || typeof student.code !== 'string') {
        return;
      }

      setBatchedStudents(prev => {
        // Check if student is already in batch
        if (prev.some(s => s.code === student.code)) {
          return prev;
        }

        return [...prev, student];
      });
    } catch (error) {
      // Handle error silently
    }
  };

  // Remove student from grading batch
  const handleStudentRemove = (studentCode: string) => {
    setBatchedStudents(prev => prev.filter(s => s.code !== studentCode));
  };

  // Clear entire batch
  const handleClearBatch = () => {
    setBatchedStudents([]);
  };

  // Handle batch submit
  const handleBatchSubmit = async () => {
    try {
      // Call the batch submit function exposed by GradingTable
      if ((window as any).gradingTableBatchSubmit) {
        await (window as any).gradingTableBatchSubmit();
      } else {
        alert(t('يرجى التأكد من أن جدول التقييم جاهز لحفظ الدرجات', 'Please ensure the grading table is ready to save grades'));
      }
    } catch (error) {
      alert(t('حدث خطأ أثناء حفظ الدرجات', 'An error occurred while saving grades'));
    }
  };

  // State for storing student grades from database
  const [studentGrades, setStudentGrades] = useState<Record<string, any>>({});

  // State for active hymns exam information
  const [activeHymnsExam, setActiveHymnsExam] = useState<any>(null);
  const [loadingExam, setLoadingExam] = useState(true);

  // Load active hymns exam information
  useEffect(() => {
    const loadActiveHymnsExam = async () => {
      try {
        const examResponse = await SupabaseService.getCurrentActiveHymnsExam();
        if (examResponse.success && examResponse.data) {
          setActiveHymnsExam(examResponse.data);
        } else {
          setActiveHymnsExam(null);
        }
      } catch (error) {
        setActiveHymnsExam(null);
      } finally {
        setLoadingExam(false);
      }
    };

    loadActiveHymnsExam();
  }, []);

  // Load grades for all students in the batch when it changes
  useEffect(() => {
    const loadBatchGrades = async () => {
      const gradesData: Record<string, any> = {};

      for (const student of batchedStudents) {
        if (student && student.code) {
          try {
            const response = await SupabaseService.getStudentGrades(student.code);
            if (response.success && response.data) {
              // Check if current teacher has graded this student
              const teacherGrade = response.data.find(grade => grade.teacher_id === teacherId);
              gradesData[student.code] = {
                hasGrade: !!teacherGrade,
                grade: teacherGrade
              };
            } else {
              gradesData[student.code] = {
                hasGrade: false,
                grade: null
              };
            }
          } catch (error) {
            gradesData[student.code] = {
              hasGrade: false,
              grade: null
            };
          }
        }
      }

      setStudentGrades(gradesData);
    };

    if (batchedStudents.length > 0) {
      loadBatchGrades();
    } else {
      setStudentGrades({});
    }
  }, [batchedStudents, teacherId]);

  // Calculate batch statistics with SupabaseService integration
  const batchStats = {
    total: batchedStudents.length,
    graded: batchedStudents.filter(student => {
      try {
        // Check if student has been graded by current teacher
        if (!student || !student.code) {
          return false;
        }

        const studentGradeInfo = studentGrades[student.code];
        return studentGradeInfo?.hasGrade || false;
      } catch (error) {
        return false;
      }
    }).length,
    pending: batchedStudents.filter(student => {
      try {
        // Check if student hasn't been graded by current teacher
        if (!student || !student.code) {
          return false;
        }

        const studentGradeInfo = studentGrades[student.code];
        return !(studentGradeInfo?.hasGrade) || false;
      } catch (error) {
        return false;
      }
    }).length
  };

  return (
    <ProtectedRoute requiredRole="teacher">
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <Header />

        <main className="container mx-auto px-4 py-8 relative z-10">
          {/* Dashboard Header */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                  {t('لوحة تحكم المعلم', 'Teacher Dashboard')}
                </h1>
                <p className="text-slate-600">
                  {t('أهلاً بك،', 'Welcome back,')} {teacherName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {batchedStudents.length > 0 && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {batchedStudents.length} {t('طالب في الدفعة', 'students in batch')}
                  </Badge>
                )}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  {t('تسجيل الخروج', 'Logout')}
                </Button>
              </div>
            </div>
          </div>

          {/* Current Hymns Exam Information */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-800 mb-1">
                  {t('الامتحان الحالي', 'Current Exam')}
                </h2>
                {loadingExam ? (
                  <p className="text-sm text-slate-600">
                    {t('جاري التحميل...', 'Loading...')}
                  </p>
                ) : activeHymnsExam ? (
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-medium text-purple-600">
                      {language === 'ar' ? activeHymnsExam.title_ar : activeHymnsExam.title_en}
                    </p>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      {t('نشط', 'Active')}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    {t('لا يوجد امتحان نشط حالياً', 'No active exam currently')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white/60 backdrop-blur-sm border-white/20 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-600 font-medium">{t('الدفعة الحالية', 'Current Batch')}</p>
                  <p className="text-xl font-bold text-blue-600">{batchStats.total}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-white/20 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-600 font-medium">{t('قيد التقييم', 'In Progress')}</p>
                  <p className="text-xl font-bold text-yellow-600">{batchStats.pending}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-white/20 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-600 font-medium">{t('تم التقييم', 'Graded')}</p>
                  <p className="text-xl font-bold text-green-600">{batchStats.graded}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <ErrorBoundary>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Student Search */}
              <div className="space-y-6">
                <ErrorBoundary>
                  <StudentSearch
                    onStudentAdd={handleStudentAdd}
                    batchedStudents={batchedStudents.map(s => {
                      if (s && typeof s === 'object' && s.code) {
                        return s.code;
                      }
                      return '';
                    }).filter(code => code !== '')}
                  />
                </ErrorBoundary>
              </div>

              {/* Grading Table */}
              <div className="space-y-6">
                <ErrorBoundary>
                  <GradingTable
                    batchedStudents={batchedStudents}
                    teacherId={teacherId}
                    teacherName={teacherName}
                    onStudentRemove={handleStudentRemove}
                    onClearBatch={handleClearBatch}
                    onBatchSubmit={handleBatchSubmit}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </ErrorBoundary>

  
          {/* Batch Actions */}
          {batchedStudents.length > 0 && (
            <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    {t('إجراءات الدفعة', 'Batch Actions')}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t('دفعة التقييم الحالية تحتوي على', 'Current grading batch contains')} {batchedStudents.length} {t('طالب', 'students')}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleBatchSubmit}
                    disabled={batchedStudents.length === 0}
                  >
                    {t('إرسال الدرجات', 'Submit Grades')}
                  </Button>
                  <Button
                    onClick={handleClearBatch}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {t('مسح الدفعة', 'Clear Batch')}
                  </Button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TeacherDashboard;