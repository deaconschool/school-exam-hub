import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { BatchStorageService } from '@/services/batchStorageService';
import { LogOut, Users, FileText, RefreshCw, Archive, RotateCcw, AlertTriangle } from 'lucide-react';

const TeacherDashboard = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user, logout, teacherName, teacherId } = useAuth();
  const [batchedStudents, setBatchedStudents] = useState<Student[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showBatchRecovery, setShowBatchRecovery] = useState(false);
  const [persistentBatchExists, setPersistentBatchExists] = useState(false);
  const [batchRecoveryLoading, setBatchRecoveryLoading] = useState(false);
  const isRtl = language === 'ar';

  // Ref to track if we've shown the confirmation dialog
  const navigationConfirmedRef = useRef(false);

  // Check if there are unsaved changes by checking with GradingTable
  const checkForUnsavedChanges = useCallback((): boolean => {
    try {
      // Check if auto-save data exists and has pending changes
      const gradingTable = (window as any).gradingTableInstance;
      if (gradingTable && gradingTable.hasUnsavedChanges) {
        return gradingTable.hasUnsavedChanges();
      }

      // Fallback: check if there are students in the batch (potential unsaved grades)
      if (batchedStudents.length > 0) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }, [batchedStudents.length]);

  // Handle navigation with confirmation
  const handleNavigationWithConfirmation = useCallback(
    (path: string, action: () => void) => {
      const hasChanges = checkForUnsavedChanges();

      if (hasChanges && !navigationConfirmedRef.current) {
        const message = language === 'ar'
          ? 'لديك تغييرات غير محفوظة. هل أنت متأكد أنك تريد المغادرة؟'
          : 'You have unsaved changes. Are you sure you want to leave?';

        if (confirm(message)) {
          navigationConfirmedRef.current = true;
          action();
          setTimeout(() => {
            navigationConfirmedRef.current = false;
          }, 1000);
        }
      } else {
        action();
      }
    },
    [checkForUnsavedChanges, language]
  );

  // Enhanced logout handler with confirmation
  const handleLogout = () => {
    handleNavigationWithConfirmation('/', () => {
      logout();
      navigate('/');
    });
  };

  // Handle browser navigation events
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (checkForUnsavedChanges() && !navigationConfirmedRef.current) {
        const message = language === 'ar'
          ? 'لديك تغييرات غير محفوظة. هل أنت متأكد أنك تريد المغادرة؟'
          : 'You have unsaved changes. Are you sure you want to leave?';

        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (checkForUnsavedChanges() && !navigationConfirmedRef.current && !isNavigating) {
        setIsNavigating(true);
        e.preventDefault();

        const message = language === 'ar'
          ? 'لديك تغييرات غير محفوظة. هل أنت متأكد أنك تريد المغادرة؟'
          : 'You have unsaved changes. Are you sure you want to leave?';

        if (confirm(message)) {
          navigationConfirmedRef.current = true;
          // Allow navigation to proceed
          setTimeout(() => {
            navigationConfirmedRef.current = false;
            setIsNavigating(false);
          }, 1000);
        } else {
          // Push state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
          setIsNavigating(false);
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Push initial state to enable popstate handling
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [checkForUnsavedChanges, language, isNavigating]);

  // Load persistent batch on component mount
  useEffect(() => {
    const loadPersistentBatch = async () => {
      try {
        const hasBatch = await BatchStorageService.hasPersistentBatch(teacherId);
        if (hasBatch) {
          const persistentStudents = await BatchStorageService.loadBatch(teacherId);
          if (persistentStudents && persistentStudents.length > 0) {
            setPersistentBatchExists(true);

            // Check if current batch is empty, then auto-restore
            if (batchedStudents.length === 0) {
              setBatchedStudents(persistentStudents);
              console.log(`Auto-restored batch with ${persistentStudents.length} students`);
            }
          }
        }
      } catch (error) {
        console.error('Failed to check for persistent batch:', error);
      }
    };

    loadPersistentBatch();
  }, [teacherId, batchedStudents.length]);

  // Monitor changes to batched students for unsaved changes detection and auto-save
  useEffect(() => {
    setHasUnsavedChanges(batchedStudents.length > 0);

    // Auto-save batch whenever it changes
    if (batchedStudents.length > 0) {
      BatchStorageService.updateBatch(teacherId, batchedStudents);
    }
  }, [batchedStudents, teacherId]);

  // Handle batch recovery
  const handleBatchRecovery = async () => {
    setBatchRecoveryLoading(true);
    try {
      const persistentStudents = await BatchStorageService.loadBatch(teacherId);
      if (persistentStudents && persistentStudents.length > 0) {
        setBatchedStudents(persistentStudents);
        setShowBatchRecovery(false);
        console.log(`Recovered batch with ${persistentStudents.length} students`);
      } else {
        alert(language === 'ar'
          ? 'لم يتم العثور على دفعة محفوظة'
          : 'No saved batch found');
      }
    } catch (error) {
      console.error('Failed to recover batch:', error);
      alert(language === 'ar'
        ? 'فشل استعادة الدفعة'
        : 'Failed to recover batch');
    } finally {
      setBatchRecoveryLoading(false);
    }
  };

  // Handle batch clearing with persistent storage
  const handleClearBatchWithPersistence = async (skipConfirmation = false) => {
    if (batchedStudents.length === 0) return;

    let shouldClear = skipConfirmation;
    if (!skipConfirmation) {
      const message = language === 'ar'
        ? `هل أنت متأكد أنك تريد مسح دفعة التقييم التي تحتوي على ${batchedStudents.length} طلاب؟`
        : `Are you sure you want to clear the grading batch containing ${batchedStudents.length} students?`;

      shouldClear = confirm(message);
    }

    if (shouldClear) {
      setBatchedStudents([]);
      setHasUnsavedChanges(false);
      setPersistentBatchExists(false);

      // Clear from persistent storage
      await BatchStorageService.clearBatch(teacherId);
    }
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

  // Clear entire batch with confirmation (use persistent version)
  const handleClearBatch = handleClearBatchWithPersistence;

  // Handle batch submit
  const handleBatchSubmit = async () => {
    try {
      // Call the batch submit function exposed by GradingTable
      if ((window as any).gradingTableBatchSubmit) {
        const success = await (window as any).gradingTableBatchSubmit();

        if (success) {
          // Batch was submitted successfully
          // Add a small delay to allow GradingTable to remove successfully graded students
          setTimeout(async () => {
            if (batchedStudents.length > 0) {
              // Some students might remain (if there were validation errors), clear the rest
              await handleClearBatchWithPersistence(true); // Skip confirmation
            }
          }, 100);

          // Show success message
          const successMessage = language === 'ar'
            ? `تم حفظ الدرجات بنجاح!`
            : `Grades saved successfully!`;

          alert(successMessage);
        } else {
          // Batch submission failed
          alert(t('فشل حفظ الدرجات، يرجى المحاولة مرة أخرى', 'Failed to save grades, please try again'));
        }
      } else {
        alert(t('يرجى التأكد من أن جدول التقييم جاهز لحفظ الدرجات', 'Please ensure the grading table is ready to save grades'));
      }
    } catch (error) {
      console.error('Batch submit error:', error);
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

  // Load grades for all students in the batch using optimized batch query
  useEffect(() => {
    const loadBatchGrades = async () => {
      try {
        // Extract student codes from batched students
        const studentCodes = batchedStudents
          .filter(student => student && student.code)
          .map(student => student.code);

        if (studentCodes.length === 0) {
          setStudentGrades({});
          return;
        }

        // Use the optimized batch grade loading method
        const response = await SupabaseService.getBatchStudentGrades(studentCodes, teacherId);

        if (response.success && response.data) {
          setStudentGrades(response.data);
        } else {
          // Fallback to empty grades if batch loading fails
          console.error('Batch grade loading failed:', response.error);
          setStudentGrades({});
          // Could implement fallback to individual queries here if needed
        }
      } catch (error) {
        console.error('Error loading batch grades:', error);
        setStudentGrades({});
      }
    };

    if (batchedStudents.length > 0) {
      loadBatchGrades();
    } else {
      setStudentGrades({});
    }
  }, [batchedStudents, teacherId]);

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
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 sm:p-6 mb-6">
            {/* Mobile-optimized header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-1 sm:mb-2 truncate">
                  {t('لوحة تحكم المعلم', 'Teacher Dashboard')}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 truncate">
                  {t('أهلاً بك،', 'Welcome back,')} {teacherName}
                </p>
              </div>

              {/* Status and Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {hasUnsavedChanges && (
                    <Badge variant="destructive" className="text-xs px-2 py-1 animate-pulse">
                      {language === 'ar' ? 'تغييرات غير محفوظة' : 'Unsaved Changes'}
                    </Badge>
                  )}
                  {batchedStudents.length > 0 && (
                    <>
                      {persistentBatchExists && (
                        <Badge variant="outline" className="text-xs px-2 py-1 border-green-200 text-green-600">
                          <Archive className="w-3 h-3 mr-1" />
                          {t('محفوظ', 'Saved')}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        {batchedStudents.length} {t('طالب', 'students')}
                      </Badge>
                    </>
                  )}
                </div>

                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 w-full sm:w-auto"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t('تسجيل الخروج', 'Logout')}
                  </span>
                  <span className="sm:hidden">
                    {t('خروج', 'Exit')}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* Batch Recovery Alert */}
          {persistentBatchExists && batchedStudents.length === 0 && !showBatchRecovery && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-lg p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Archive className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">
                    {t('دفعة محفوظة متاحة', 'Saved Batch Available')}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t('تم العثور على دفعة تقييم محفوظة من جلسة سابقة. هل تريد استعادتها؟', 'A saved grading batch was found from a previous session. Would you like to restore it?')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleBatchRecovery}
                    disabled={batchRecoveryLoading}
                    className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
                    size="sm"
                  >
                    <RotateCcw className={`w-4 h-4 mr-2 ${batchRecoveryLoading ? 'animate-spin' : ''}`} />
                    {t('استعادة الدفعة', 'Restore Batch')}
                  </Button>
                  <Button
                    onClick={() => setShowBatchRecovery(true)}
                    variant="outline"
                    className="border-amber-200 text-amber-600 hover:bg-amber-50 w-full sm:w-auto"
                    size="sm"
                  >
                    {t('تجاهل', 'Dismiss')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Current Hymns Exam Information */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:items-center gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">
                  {t('الامتحان الحالي', 'Current Exam')}
                </h2>
                {loadingExam ? (
                  <p className="text-sm text-slate-600">
                    {t('جاري التحميل...', 'Loading...')}
                  </p>
                ) : activeHymnsExam ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <p className="text-base sm:text-lg font-medium text-purple-600 truncate">
                      {language === 'ar' ? activeHymnsExam.title_ar : activeHymnsExam.title_en}
                    </p>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs sm:text-sm">
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

          {/* Main Content */}
          <ErrorBoundary>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
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
            <div className="mt-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">
                    {t('إجراءات الدفعة', 'Batch Actions')}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t('دفعة التقييم الحالية تحتوي على', 'Current grading batch contains')} {batchedStudents.length} {t('طالب', 'students')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleBatchSubmit}
                    disabled={batchedStudents.length === 0}
                    className="w-full sm:w-auto"
                    size="sm"
                  >
                    {t('إرسال الدرجات', 'Submit Grades')}
                  </Button>
                  <Button
                    onClick={handleClearBatch}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto"
                    size="sm"
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

// Memoize the component to prevent unnecessary re-renders
const MemoizedTeacherDashboard = React.memo(TeacherDashboard);

export default MemoizedTeacherDashboard;