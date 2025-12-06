import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Student, TeacherGrade, GradeInputData } from '@/data/types';
import { SupabaseService } from '@/services/supabaseService';
import { GradeService } from '@/services/gradeService';
import { useAutoSave, AutoSaveStatus } from '@/hooks/useAutoSave';
import { connectivityService } from '@/services/connectivityService';
import { OfflineBanner } from '@/components/OfflineBanner';
import { GradeCriteria } from '@/types/supabase';
import { GradeBackupService } from '@/services/backupService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Save, AlertCircle, CheckCircle, Users, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface GradeInputs {
  tasleem: string;
  not2: string;
  ada2_gama3y: string;
}

interface DynamicGradeCriteria {
  tasleem: { min: number; max: number; description_ar: string; description_en: string };
  not2: { min: number; max: number; description_ar: string; description_en: string };
  ada2_gama3y: { min: number; max: number; description_ar: string; description_en: string };
}

interface GradingTableProps {
  batchedStudents: Student[];
  teacherId: string;
  teacherName: string;
  examId?: string;
  onStudentRemove: (studentCode: string) => void;
  onClearBatch: () => void;
  onBatchSubmit?: () => Promise<boolean>;
}

const GradingTable = ({
  batchedStudents,
  teacherId,
  teacherName,
  examId = 'default_exam',
  onStudentRemove,
  onClearBatch,
  onBatchSubmit
}: GradingTableProps) => {
  const { t, language } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Subscribe to connectivity changes
  useEffect(() => {
    const status = connectivityService.getStatus();
    setIsOnline(status.online);

    const unsubscribe = connectivityService.subscribe((newStatus) => {
      setIsOnline(newStatus.online);
    });

    return unsubscribe;
  }, []);

  const isOffline = !isOnline;

  // Auto-save functionality
  const autoSaveConfig = {
    debounceMs: 500,
    storageStrategy: 'hybrid' as const,
    retryAttempts: 3
  };

  // Use a proper UUID for database operations
  const getDatabaseExamId = (): string => {
    // Try to parse the active exam ID if it's a valid UUID, otherwise use a default
    if (activeExamId && activeExamId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return activeExamId;
    }
    // Return a default UUID if no valid exam ID is available
    return '00000000-0000-0000-0000-000000000000';
  };

  // Use a simple storage key for auto-save (not used in database queries)
  const autoSaveStorageKey = `${teacherId}_autosave`;

  const {
    data: autoSaveData,
    status: autoSaveStatus,
    updateData: updateAutoSaveData,
    updateStudentGrades,
    forceSave,
    clearSavedData
  } = useAutoSave(teacherId, autoSaveStorageKey, {}, autoSaveConfig);

  const [gradeInputs, setGradeInputs] = useState<Record<string, GradeInputs>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [gradeCriteria, setGradeCriteria] = useState(GradeService.getGradeCriteria());
  const [dynamicGradeCriteria, setDynamicGradeCriteria] = useState<DynamicGradeCriteria | null>(null);
  const [criteriaLoading, setCriteriaLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const isRtl = language === 'ar';

  // Refs for preventing duplicate operations
  const saveTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastSaveTimesRef = useRef<Map<string, number>>(new Map());

  // Get active exam ID from hymns exams table
  const getActiveExamId = async (): Promise<string> => {
    try {
      const examResponse = await SupabaseService.getCurrentActiveHymnsExam(teacherId);
      if (examResponse.success && examResponse.data) {
        return examResponse.data.id;
      }
    } catch (error) {
      console.warn('Failed to get active exam ID:', error);
    }

    // Fallback to default ID if no active exam found
    return 'default_exam';
  };

  // Fetch grade criteria and initialize auto-save on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setCriteriaLoading(true);

        // Get the active exam ID first
        const examId = await getActiveExamId();
        setActiveExamId(examId);

        // Start auto-backup for this teacher
        if (batchedStudents.length > 0) {
          GradeBackupService.startAutoBackup(teacherId, autoSaveStorageKey, 30000); // 30 second intervals
        }

        // Fetch grade criteria from active hymns exam
        const criteriaResponse = await SupabaseService.getActiveHymnsExamGradingRanges();

        if (criteriaResponse.success && criteriaResponse.data) {
          // Convert hymns exam ranges to our component format
          const criteria: DynamicGradeCriteria = {
            tasleem: {
              min: criteriaResponse.data.tasleem_min,
              max: criteriaResponse.data.tasleem_max,
              description_ar: 'التسليم والأداء العام',
              description_en: 'Delivery and overall performance'
            },
            not2: {
              min: criteriaResponse.data.not2_min,
              max: criteriaResponse.data.not2_max,
              description_ar: 'دقة النطق ووضوحه',
              description_en: 'Pronunciation accuracy and clarity'
            },
            ada2_gama3y: {
              min: criteriaResponse.data.ada2_min,
              max: criteriaResponse.data.ada2_max,
              description_ar: 'التفاعل مع المجموعة',
              description_en: 'Group interaction and participation'
            }
          };

          setDynamicGradeCriteria(criteria);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing grading table:', error);
      } finally {
        setCriteriaLoading(false);
      }
    };

    initializeComponent();

    // Cleanup function
    return () => {
      GradeBackupService.stopAutoBackup(teacherId, autoSaveStorageKey);
    };
  }, [teacherId, batchedStudents.length]); // Remove examId from dependencies to prevent re-runs

  // Initialize grade inputs with existing grades from Supabase and auto-save data
  useEffect(() => {
    const loadGrades = async () => {
      try {
        let initialInputs: Record<string, GradeInputs> = {};

        // Priority 1: Try to load from auto-save data first (most recent)
        if (autoSaveData && Object.keys(autoSaveData).length > 0) {
          initialInputs = { ...autoSaveData };
        } else {
          // Priority 2: Load from Supabase if no auto-save data
          // Use batch query to load all grades at once (performance optimization)
          try {
            const studentCodes = batchedStudents.map(s => s.code);
            const batchGradesResponse = await SupabaseService.getBatchStudentGrades(studentCodes, teacherId);

            if (batchGradesResponse.success && batchGradesResponse.data) {
              batchedStudents.forEach(student => {
                const gradeData = batchGradesResponse.data[student.code];

                if (gradeData?.hasGrade && gradeData?.grade) {
                  initialInputs[student.code] = {
                    tasleem: gradeData.grade.tasleem_grade?.toString() || '',
                    not2: gradeData.grade.not2_grade?.toString() || '',
                    ada2_gama3y: gradeData.grade.ada2_gama3y_grade?.toString() || ''
                  };
                } else {
                  initialInputs[student.code] = {
                    tasleem: '',
                    not2: '',
                    ada2_gama3y: ''
                  };
                }
              });
            } else {
              // Fallback to empty inputs if batch query fails
              batchedStudents.forEach(student => {
                initialInputs[student.code] = {
                  tasleem: '',
                  not2: '',
                  ada2_gama3y: ''
                };
              });
            }
          } catch (error) {
            console.warn('Failed to load batch grades:', error);
            // Fallback to empty inputs
            batchedStudents.forEach(student => {
              initialInputs[student.code] = {
                tasleem: '',
                not2: '',
                ada2_gama3y: ''
              };
            });
          }
        }

        // Ensure all batched students have inputs
        batchedStudents.forEach(student => {
          if (!initialInputs[student.code]) {
            initialInputs[student.code] = {
              tasleem: '',
              not2: '',
              ada2_gama3y: ''
            };
          }
        });

        setGradeInputs(initialInputs);

      } catch (error) {
        console.error('Error loading grades:', error);

        // Set empty inputs as ultimate fallback
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

    if (isInitialized) {
      loadGrades();
    }
  }, [batchedStudents, teacherId, isInitialized]); // Removed autoSaveData and updateAutoSaveData to prevent infinite loop

  // Separate effect to sync loaded data with auto-save (runs once when gradeInputs are set)
  const hasInitializedAutoSave = useRef(false);
  useEffect(() => {
    if (gradeInputs && Object.keys(gradeInputs).length > 0 && !hasInitializedAutoSave.current) {
      // Only update auto-save data once, when we first have actual grade inputs
      updateAutoSaveData(gradeInputs);
      hasInitializedAutoSave.current = true;
    }
  }, [gradeInputs]); // Only depends on gradeInputs, and only runs once with the ref guard

  // Validate grade input using dynamic ranges from database
  const validateGradeInput = (value: string, criterion: 'tasleem' | 'not2' | 'ada2_gama3y'): boolean => {
    if (value === '') return true; // Empty is allowed
    const num = parseFloat(value);
    if (isNaN(num)) return false;

    // Use dynamic criteria if available, otherwise fallback to GradeService
    if (dynamicGradeCriteria) {
      const range = dynamicGradeCriteria[criterion];
      return num >= range.min && num <= range.max;
    } else {
      const range = gradeCriteria[criterion];
      return num >= range.min && num <= range.max;
    }
  };

  // Enhanced grade input change handler with auto-save integration
  const handleGradeChange = (studentCode: string, field: keyof GradeInputs, value: string) => {
    // Only allow numbers and empty string
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }

    const newGradeInputs = {
      ...gradeInputs,
      [studentCode]: {
        ...gradeInputs[studentCode],
        [field]: value
      }
    };

    setGradeInputs(newGradeInputs);

    // Update auto-save data immediately
    updateAutoSaveData(newGradeInputs);

    // Real-time validation
    const criterion = field as 'tasleem' | 'not2' | 'ada2_gama3y';
    const isValid = validateGradeInput(value, criterion);

    if (!isValid && value !== '') {
      // Get appropriate range for error message
      let min = 0, max = 20;
      if (dynamicGradeCriteria) {
        const range = dynamicGradeCriteria[criterion];
        min = range.min;
        max = range.max;
      } else {
        const range = gradeCriteria[criterion];
        min = range.min;
        max = range.max;
      }

      const criterionNames = {
        tasleem: { ar: 'التسليم', en: 'Delivery' },
        not2: { ar: 'النطق', en: 'Pronunciation' },
        ada2_gama3y: { ar: 'الأداء الجماعي', en: 'Group Performance' }
      };

      const criterionName = criterionNames[criterion][language === 'ar' ? 'ar' : 'en'];
      const errorMessage = t(
        `${criterionName} يجب أن يكون بين ${min} و ${max}`,
        `${criterionName} must be between ${min} and ${max}`
      );

      setErrors(prev => ({
        ...prev,
        [`${studentCode}_${field}`]: errorMessage
      }));
    } else {
      // Clear error for this field if valid
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${studentCode}_${field}`];
        return newErrors;
      });
    }
  };

  // Validate all inputs for a student with dynamic error messages
  const validateStudentGrades = (studentCode: string): boolean => {
    const inputs = gradeInputs[studentCode];
    if (!inputs) return false;

    const newErrors: Record<string, string> = {};

    ['tasleem', 'not2', 'ada2_gama3y'].forEach(field => {
      const value = inputs[field as keyof GradeInputs];
      const criterion = field as 'tasleem' | 'not2' | 'ada2_gama3y';

      if (!validateGradeInput(value, criterion)) {
        // Get appropriate range for error message
        let min = 0, max = 20;
        if (dynamicGradeCriteria) {
          const range = dynamicGradeCriteria[criterion];
          min = range.min;
          max = range.max;
        } else {
          const range = gradeCriteria[criterion];
          min = range.min;
          max = range.max;
        }

        const criterionNames = {
          tasleem: { ar: 'التسليم', en: 'Delivery' },
          not2: { ar: 'النطق', en: 'Pronunciation' },
          ada2_gama3y: { ar: 'الأداء الجماعي', en: 'Group Performance' }
        };

        const name = criterionNames[criterion];
        newErrors[`${studentCode}_${field}`] = t(
          `${name.ar} يجب أن يكون بين ${min} و ${max}`,
          `${name.en} must be between ${min} and ${max}`
        );
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return false;
    }

    return true;
  };

  // Enhanced save grades for a student with offline support
  const handleSaveGrades = async (studentCode: string) => {
    if (!validateStudentGrades(studentCode)) {
      return;
    }

    // Prevent duplicate saves within 2 seconds
    const lastSaveTime = lastSaveTimesRef.current.get(studentCode) || 0;
    const now = Date.now();
    if (now - lastSaveTime < 2000) {
      return;
    }
    lastSaveTimesRef.current.set(studentCode, now);

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

      // Validate inputs using dynamic criteria if available
      if (dynamicGradeCriteria) {
        // Manual validation using database ranges
        if (gradeInput.tasleem < dynamicGradeCriteria.tasleem.min || gradeInput.tasleem > dynamicGradeCriteria.tasleem.max) {
          throw new Error(` tasleem must be between ${dynamicGradeCriteria.tasleem.min} and ${dynamicGradeCriteria.tasleem.max}`);
        }
        if (gradeInput.not2 < dynamicGradeCriteria.not2.min || gradeInput.not2 > dynamicGradeCriteria.not2.max) {
          throw new Error(` not2 must be between ${dynamicGradeCriteria.not2.min} and ${dynamicGradeCriteria.not2.max}`);
        }
        if (gradeInput.ada2_gama3y < dynamicGradeCriteria.ada2_gama3y.min || gradeInput.ada2_gama3y > dynamicGradeCriteria.ada2_gama3y.max) {
          throw new Error(` ada2_gama3y must be between ${dynamicGradeCriteria.ada2_gama3y.min} and ${dynamicGradeCriteria.ada2_gama3y.max}`);
        }
      } else {
        // Fallback validation using GradeService
        const validation = GradeService.validateGradeInputs(gradeInput);
        if (!validation.isValid) {
          setErrors(prev => ({
            ...prev,
            [studentCode]: validation.errors.join(', ')
          }));
          setSavingStates(prev => ({ ...prev, [studentCode]: false }));
          return;
        }
      }

      // Create backup before saving
      await GradeBackupService.createEnhancedBackup(
        teacherId,
        autoSaveStorageKey,
        'manual_save',
        [{
          student_code: studentCode,
          tasleem_grade: gradeInput.tasleem,
          not2_grade: gradeInput.not2,
          ada2_gama3y_grade: gradeInput.ada2_gama3y,
          teacher_id: teacherId,
          exam_id: getDatabaseExamId(),
          notes: 'Graded via teacher dashboard'
        } as any]
      );

      // Get current active Hymns exam for grading
      const examResponse = await SupabaseService.getCurrentActiveHymnsExam();
      let actualExamId = '00000000-0000-0000-0000-000000000000'; // Default UUID

      if (examResponse.success && examResponse.data) {
        actualExamId = examResponse.data.id;
      } else {
        setErrors(prev => ({ ...prev, batch: t('لا يوجد امتحان ألحان نشط حالياً', 'No active Hymns exam currently available') }));
        setTimeout(() => setErrors(prev => ({ ...prev, batch: '' })), 5000);
        return false;
      }

      // Save grades using enhanced Supabase service with offline support
      const saveResponse = await SupabaseService.saveGrades(
        studentCode,
        teacherId,
        actualExamId,
        gradeInput.tasleem,
        gradeInput.not2,
        gradeInput.ada2_gama3y,
        'Graded via teacher dashboard'
      );

      if (saveResponse.success) {
        const successMessage = isOffline
          ? t('تم حفظ التقييمات محلياً. ستتم المزامنة عند استعادة الاتصال', 'Grades saved locally. Will sync when connection is restored')
          : t('تم حفظ التقييمات بنجاح وإزالة الطالب من الدفعة', 'Grades saved successfully and student removed from batch');

        setSuccess(successMessage);
        setLastSyncTime(new Date());

        // Remove student from batch after successful submission
        setTimeout(() => {
          onStudentRemove(studentCode);
          setSuccess('');
        }, isOffline ? 3000 : 2000);

        // Clear auto-save data for this student
        const updatedInputs = { ...gradeInputs };
        delete updatedInputs[studentCode];
        updateAutoSaveData(updatedInputs);

      } else {
        // Check if this was an offline queued operation
        if ((saveResponse as any).offlineQueued) {
          setSuccess(t('تم حفظ التقييمات في قائمة الانتظار للمزامنة', 'Grades queued for sync when connection is restored'));
          setLastSyncTime(new Date());

          // Remove student from batch after successful queue
          setTimeout(() => {
            onStudentRemove(studentCode);
            setSuccess('');
          }, 2000);

          // Clear auto-save data for this student
          const updatedInputs = { ...gradeInputs };
          delete updatedInputs[studentCode];
          updateAutoSaveData(updatedInputs);
        } else {
          setErrors(prev => ({
            ...prev,
            [studentCode]: saveResponse.error || t('فشل حفظ التقييمات. يرجى المحاولة مرة أخرى', 'Failed to save grades. Please try again')
          }));
        }
      }

    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [studentCode]: error instanceof Error ? error.message : t('حدث خطأ غير متوقع', 'An unexpected error occurred')
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

  // Handle batch submit for all students
  const handleBatchSubmitInternal = async (): Promise<boolean> => {
    try {

      const studentsWithGrades = batchedStudents.filter(student =>
        getExistingGrades(student.code)
      );

      if (studentsWithGrades.length === 0) {
        setErrors(prev => ({ ...prev, batch: t('لا توجد درجات لحفظها', 'No grades to save') }));
        setTimeout(() => setErrors(prev => ({ ...prev, batch: '' })), 3000);
        return false;
      }

      // Prepare all grade data for batch submission
      const gradePromises = studentsWithGrades.map(async (student) => {
        try {
          const inputs = gradeInputs[student.code];
          if (!inputs) throw new Error('No grade inputs found');

          const gradeInput = {
            tasleem: parseFloat(inputs.tasleem) || 0,
            not2: parseFloat(inputs.not2) || 0,
            ada2_gama3y: parseFloat(inputs.ada2_gama3y) || 0,
          };

          // Validate all grades first
          if (!validateStudentGrades(student.code)) {
            throw new Error('Validation failed');
          }

          // Get current active Hymns exam for grading
          const examResponse = await SupabaseService.getCurrentActiveHymnsExam();
          let examId = '00000000-0000-0000-0000-000000000000';

          if (examResponse.success && examResponse.data) {
            examId = examResponse.data.id;
          } else {
            throw new Error(t('لا يوجد امتحان ألحان نشط حالياً', 'No active Hymns exam currently available'));
          }

          // Save grades using Supabase service
          const saveResponse = await SupabaseService.saveGrades(
            student.code,
            teacherId,
            examId, // This is now the proper database exam ID
            gradeInput.tasleem,
            gradeInput.not2,
            gradeInput.ada2_gama3y,
            'Batch submitted via teacher dashboard'
          );

          return {
            student,
            success: saveResponse.success,
            error: saveResponse.error
          };

        } catch (error) {
          return {
            student,
            success: false,
            error: error instanceof Error ? error.message : t('فشل حفظ التقييمات', 'Failed to save grades')
          };
        }
      });

      // Execute all grade submissions in parallel
      const results = await Promise.all(gradePromises);

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      const successfulStudents = results.filter(r => r.success).map(r => r.student.code);

      // Remove successfully graded students from batch individually
      if (successfulStudents.length > 0) {
        successfulStudents.forEach(studentCode => {
          onStudentRemove(studentCode);
        });
      }

      if (successCount > 0) {
        const message = t(
          `تم حفظ تقييمات ${successCount} طالب بنجاح وإزالتهم من الدفعة${errorCount > 0 ? `، وفشل ${errorCount} طالب` : ''}`,
          `Successfully saved grades for ${successCount} student${successCount !== 1 ? 's' : ''} and removed them from batch${errorCount > 0 ? `, ${errorCount} failed` : ''}`
        );
        setSuccess(message);
        setTimeout(() => setSuccess(''), 5000);
      }

      if (errorCount > 0) {
        setErrors(prev => ({
          ...prev,
          batch: t(
            `فشل حفظ تقييمات ${errorCount} طالب`,
            `Failed to save grades for ${errorCount} student${errorCount !== 1 ? 's' : ''}`
          )
        }));
        setTimeout(() => setErrors(prev => ({ ...prev, batch: '' })), 5000);
      }

      return errorCount === 0;

    } catch (error) {
      setErrors(prev => ({
        ...prev,
        batch: error instanceof Error ? error.message : t('فشل حفظ التقييمات', 'Failed to save grades')
      }));
      setTimeout(() => setErrors(prev => ({ ...prev, batch: '' })), 5000);
      return false;
    }
  };

  // Expose the batch submit function through the onBatchSubmit prop
  React.useEffect(() => {
    if (onBatchSubmit) {
      // Store the function in a way that it can be called from parent
      (window as any).gradingTableBatchSubmit = handleBatchSubmitInternal;
    }
  }, [onBatchSubmit, batchedStudents, gradeInputs]);

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
    <>
      {/* Offline/Connectivity Banner */}
      <OfflineBanner
        showSyncProgress={true}
        syncProgress={{
          pending: autoSaveStatus.pendingChanges ? 1 : 0,
          syncing: autoSaveStatus.isSaving ? 1 : 0,
          completed: autoSaveStatus.saveCount,
          failed: autoSaveStatus.error ? 1 : 0
        }}
        onManualSync={forceSave}
        onRetryConnection={() => {
          // Force connection check
          window.location.reload();
        }}
      />

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

        {/* Auto-Save Status Indicator */}
        <div className="flex items-center gap-2 text-xs">
          {autoSaveStatus.isSaving ? (
            <>
              <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
              <span className="text-blue-600">{t('جاري الحفظ...', 'Saving...')}</span>
            </>
          ) : autoSaveStatus.lastSaved ? (
            <>
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-green-600">
                {t('آخر حفظ:', 'Last saved:')} {autoSaveStatus.lastSaved.toLocaleTimeString()}
              </span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-gray-500">{t('جاهز للحفظ', 'Ready to save')}</span>
            </>
          )}

          {autoSaveStatus.pendingChanges && (
            <span className="text-orange-600 ml-2">
              ({t('توجد تغييرات غير محفوظة', 'Unsaved changes')})
            </span>
          )}
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

        {/* Batch Error Message */}
        {errors.batch && (
          <Alert className="bg-red-50 border-red-200 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.batch}</AlertDescription>
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
                    <div className="text-xs text-slate-600">
                      ({criteriaLoading ? '...' : (dynamicGradeCriteria ? `${dynamicGradeCriteria.tasleem.min}-${dynamicGradeCriteria.tasleem.max}` : `${gradeCriteria.tasleem.min}-${gradeCriteria.tasleem.max}`)})
                    </div>
                  </div>
                </TableCell>
                {batchedStudents.map((student) => {
                  const inputs = gradeInputs[student.code] || { tasleem: '', not2: '', ada2_gama3y: '' };
                  const isSaving = savingStates[student.code];
                  const currentCriteria = dynamicGradeCriteria || gradeCriteria;
                  return (
                    <TableCell key={student.code} className="text-center">
                      <Input
                        type="number"
                        min={currentCriteria.tasleem.min}
                        max={currentCriteria.tasleem.max}
                        value={inputs.tasleem}
                        onChange={(e) => handleGradeChange(student.code, 'tasleem', e.target.value)}
                        className={`w-16 text-center text-sm ${errors[`${student.code}_tasleem`] ? 'border-red-500' : ''}`}
                        placeholder={`${currentCriteria.tasleem.min}-${currentCriteria.tasleem.max}`}
                        disabled={isSaving || criteriaLoading}
                      />
                      {errors[`${student.code}_tasleem`] && (
                        <div className="text-xs text-red-500 mt-1">{errors[`${student.code}_tasleem`]}</div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Pronunciation Row */}
              <TableRow>
                <TableCell className="font-medium">
                  <div>
                    {t('نطق', 'Pronunciation')}
                    <div className="text-xs text-slate-600">
                      ({criteriaLoading ? '...' : (dynamicGradeCriteria ? `${dynamicGradeCriteria.not2.min}-${dynamicGradeCriteria.not2.max}` : `${gradeCriteria.not2.min}-${gradeCriteria.not2.max}`)})
                    </div>
                  </div>
                </TableCell>
                {batchedStudents.map((student) => {
                  const inputs = gradeInputs[student.code] || { tasleem: '', not2: '', ada2_gama3y: '' };
                  const isSaving = savingStates[student.code];
                  const currentCriteria = dynamicGradeCriteria || gradeCriteria;
                  return (
                    <TableCell key={student.code} className="text-center">
                      <Input
                        type="number"
                        min={currentCriteria.not2.min}
                        max={currentCriteria.not2.max}
                        value={inputs.not2}
                        onChange={(e) => handleGradeChange(student.code, 'not2', e.target.value)}
                        className={`w-16 text-center text-sm ${errors[`${student.code}_not2`] ? 'border-red-500' : ''}`}
                        placeholder={`${currentCriteria.not2.min}-${currentCriteria.not2.max}`}
                        disabled={isSaving || criteriaLoading}
                      />
                      {errors[`${student.code}_not2`] && (
                        <div className="text-xs text-red-500 mt-1">{errors[`${student.code}_not2`]}</div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Group Performance Row */}
              <TableRow>
                <TableCell className="font-medium">
                  <div>
                    {t('أداء جماعي', 'Group Performance')}
                    <div className="text-xs text-slate-600">
                      ({criteriaLoading ? '...' : (dynamicGradeCriteria ? `${dynamicGradeCriteria.ada2_gama3y.min}-${dynamicGradeCriteria.ada2_gama3y.max}` : `${gradeCriteria.ada2_gama3y.min}-${gradeCriteria.ada2_gama3y.max}`)})
                    </div>
                  </div>
                </TableCell>
                {batchedStudents.map((student) => {
                  const inputs = gradeInputs[student.code] || { tasleem: '', not2: '', ada2_gama3y: '' };
                  const isSaving = savingStates[student.code];
                  const currentCriteria = dynamicGradeCriteria || gradeCriteria;
                  return (
                    <TableCell key={student.code} className="text-center">
                      <Input
                        type="number"
                        min={currentCriteria.ada2_gama3y.min}
                        max={currentCriteria.ada2_gama3y.max}
                        value={inputs.ada2_gama3y}
                        onChange={(e) => handleGradeChange(student.code, 'ada2_gama3y', e.target.value)}
                        className={`w-16 text-center text-sm ${errors[`${student.code}_ada2_gama3y`] ? 'border-red-500' : ''}`}
                        placeholder={`${currentCriteria.ada2_gama3y.min}-${currentCriteria.ada2_gama3y.max}`}
                        disabled={isSaving || criteriaLoading}
                      />
                      {errors[`${student.code}_ada2_gama3y`] && (
                        <div className="text-xs text-red-500 mt-1">{errors[`${student.code}_ada2_gama3y`]}</div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Total Row */}
              <TableRow className="bg-blue-50">
                <TableCell className="font-bold">
                  {t('المجموع', 'Total')}
                  <div className="text-xs text-slate-600 font-normal">
                    {t('من', 'out of')} {
                      criteriaLoading
                        ? '...'
                        : (dynamicGradeCriteria
                          ? (dynamicGradeCriteria.tasleem.max + dynamicGradeCriteria.not2.max + dynamicGradeCriteria.ada2_gama3y.max)
                          : (gradeCriteria.tasleem.max + gradeCriteria.not2.max + gradeCriteria.ada2_gama3y.max)
                        )
                    }
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
          {criteriaLoading ? (
            <div className="text-sm text-blue-700">
              {t('جاري تحميل معايير التقييم...', 'Loading grading criteria...')}
            </div>
          ) : (
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• {t('تسليم:', 'Delivery:')} {
                dynamicGradeCriteria
                  ? (language === 'ar' ? dynamicGradeCriteria.tasleem.description_ar : dynamicGradeCriteria.tasleem.description_en)
                  : (language === 'ar' ? gradeCriteria.tasleem.description_ar : gradeCriteria.tasleem.description_en)
              } ({
                dynamicGradeCriteria
                  ? `${dynamicGradeCriteria.tasleem.min}-${dynamicGradeCriteria.tasleem.max}`
                  : `${gradeCriteria.tasleem.min}-${gradeCriteria.tasleem.max}`
              })</li>
              <li>• {t('نطق:', 'Pronunciation:')} {
                dynamicGradeCriteria
                  ? (language === 'ar' ? dynamicGradeCriteria.not2.description_ar : dynamicGradeCriteria.not2.description_en)
                  : (language === 'ar' ? gradeCriteria.not2.description_ar : gradeCriteria.not2.description_en)
              } ({
                dynamicGradeCriteria
                  ? `${dynamicGradeCriteria.not2.min}-${dynamicGradeCriteria.not2.max}`
                  : `${gradeCriteria.not2.min}-${gradeCriteria.not2.max}`
              })</li>
              <li>• {t('أداء جماعي:', 'Group Performance:')} {
                dynamicGradeCriteria
                  ? (language === 'ar' ? dynamicGradeCriteria.ada2_gama3y.description_ar : dynamicGradeCriteria.ada2_gama3y.description_en)
                  : (language === 'ar' ? gradeCriteria.ada2_gama3y.description_ar : gradeCriteria.ada2_gama3y.description_en)
              } ({
                dynamicGradeCriteria
                  ? `${dynamicGradeCriteria.ada2_gama3y.min}-${dynamicGradeCriteria.ada2_gama3y.max}`
                  : `${gradeCriteria.ada2_gama3y.min}-${gradeCriteria.ada2_gama3y.max}`
              })</li>
              <li>• {t('المجموع الأقصى:', 'Maximum total:')} {
                dynamicGradeCriteria
                  ? (dynamicGradeCriteria.tasleem.max + dynamicGradeCriteria.not2.max + dynamicGradeCriteria.ada2_gama3y.max)
                  : (gradeCriteria.tasleem.max + gradeCriteria.not2.max + gradeCriteria.ada2_gama3y.max)
              } {t('درجة', 'points')}</li>
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
const MemoizedGradingTable = React.memo(GradingTable);

export default MemoizedGradingTable;