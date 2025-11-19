import { useState } from 'react';
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
    console.log('🔹 Adding student to batch:', student);

    try {
      // Validate student object before adding
      if (!student || typeof student !== 'object') {
        console.error('❌ Invalid student object:', student);
        return;
      }

      if (!student.code || typeof student.code !== 'string') {
        console.error('❌ Invalid student code:', student.code);
        return;
      }

      setBatchedStudents(prev => {
        console.log('📊 Previous batch:', prev);

        // Check if student is already in batch
        if (prev.some(s => s.code === student.code)) {
          console.log('⚠️ Student already in batch:', student.code);
          return prev;
        }

        const newBatch = [...prev, student];
        console.log('✅ New batch after adding student:', newBatch);
        console.log('📈 New batch size:', newBatch.length);

        return newBatch;
      });
    } catch (error) {
      console.error('❌ Error adding student to batch:', error);
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

  // Calculate batch statistics with error handling and DataService safety check
  const batchStats = {
    total: batchedStudents.length,
    graded: batchedStudents.filter(student => {
      try {
        // Check if student has been graded by current teacher
        if (!student || !student.code) {
          console.warn('Invalid student object in batch:', student);
          return false;
        }

        // TODO: Implement with SupabaseService - temporarily simplified
        const studentGrades = null; // DataService.getStudentGrades(student.code);
        if (!studentGrades) {
          return false;
        }

        return studentGrades[teacherId] !== undefined;
      } catch (error) {
        console.error('Error checking if student is graded:', error);
        return false;
      }
    }).length,
    pending: batchedStudents.filter(student => {
      try {
        // Check if student hasn't been graded by current teacher
        if (!student || !student.code) {
          console.warn('Invalid student object in batch:', student);
          return false;
        }

        // TODO: Implement with SupabaseService - temporarily simplified
        const studentGrades = null; // DataService.getStudentGrades(student.code);
        if (!studentGrades) {
          return true; // No grades means pending
        }

        return studentGrades[teacherId] === undefined;
      } catch (error) {
        console.error('Error checking if student is pending:', error);
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
                      console.warn('Invalid student object in batch:', s);
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
                    onClick={() => {
                      // Save all pending grades in the batch
                      console.log('Submitting all grades for batch');
                      // This could be implemented in a future iteration
                    }}
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