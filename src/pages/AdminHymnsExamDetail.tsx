import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft, Edit, Search, Download, Send, Users, TrendingUp,
  AlertTriangle, CheckCircle, XCircle, BarChart3, UserCheck,
  Clock, Calendar, Award, Filter, RefreshCw, Eye, Settings
} from 'lucide-react';
import { SupabaseService } from '@/services/supabaseService';
import { toast } from 'sonner';
import HymnsExamExcelExport from '@/components/HymnsExamExcelExport';
import ExamNotesEditor from '@/components/admin/ExamNotesEditor';
import { ExamNotes } from '@/types/notes';

// Interface definitions
interface ExamDetailData {
  exam: any;
  statistics: {
    totalStudents: number;
    gradedStudents: number;
    passRate: number;
    averageScore: number;
    averageTasleem: number;
    averageNot2: number;
    averageAda2: number;
    pendingGrading: number;
    allClasses: string[];
  };
  classPerformance: ClassPerformance[];
  teacherPerformance: TeacherPerformance[];
  studentGrades: StudentGradeDetail[];
  alerts: GradeAlert[];
  allClasses?: string[]; // Add at root level for easier access
}

interface ClassPerformance {
  className: string;
  totalStudents: number;
  gradedStudents: number;
  passRate: number;
  averageScore: number;
  failingStudents: number;
}

interface TeacherPerformance {
  teacherId: string;
  teacherName: string;
  totalGraded: number;
  averageScore: number;
  gradeVariance: number;
  consistencyScore: number;
  classes: string[];
  gradeDistribution: {
    excellent: number;
    good: number;
    satisfactory: number;
    needsImprovement: number;
    poor: number;
  };
}

interface StudentGradeDetail {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  teacherName: string;
  tasleemGrade: number;
  not2Grade: number;
  ada2Grade: number;
  totalGrade: number;
  passed: boolean;
  gradedAt: string;
  isGraded: boolean;
  gradeCount: number;
  examNotes?: ExamNotes | null;
}

interface GradeAlert {
  id: string;
  type: 'consistency' | 'performance' | 'grading';
  severity: 'high' | 'medium' | 'low';
  message: string;
  affectedEntities: string[];
}

interface ClassGradeDistribution {
  className: string;
  totalGraded: number;
  totalStudents: number;
  maxGrade: number;
  distribution: {
    range: string;
    count: number;
  }[];
}

const AdminHymnsExamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  // State management
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<ExamDetailData | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    class: 'all',
    passStatus: 'all' as 'all' | 'pass' | 'fail' | 'pending' | 'unattended'
  });
  const [exporting, setExporting] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [filteredData, setFilteredData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(25);
  const [showResults, setShowResults] = useState(false);

  // Class Grades Overview state
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classDistribution, setClassDistribution] = useState<ClassGradeDistribution | null>(null);
  const [loadingClassData, setLoadingClassData] = useState(false);

  // Export state
  const [selectedExportClass, setSelectedExportClass] = useState<string>('');
  const [exportData, setExportData] = useState<any>(null);

  // Exam Notes Editor state
  const [examNotesEditorOpen, setExamNotesEditorOpen] = useState(false);
  const [gradeForNotes, setGradeForNotes] = useState<StudentGradeDetail | null>(null);

  // Calculate distribution with dynamic range handling
  const calculateClassDistribution = useCallback((studentGrades: StudentGradeDetail[], className: string, exam: any, totalPossibleMarks: number): ClassGradeDistribution | null => {
    if (!studentGrades || !exam) return null;

    const classGrades = studentGrades
      .filter(g => g.className === className && g.isGraded)
      .map(g => g.totalGrade);

    const maxGrade = totalPossibleMarks;

    if (classGrades.length === 0 || maxGrade === 0) return null;

    const distribution = [];

    // Generate ranges dynamically
    // Each range is 5 marks, but handle edge cases
    for (let i = 0; i < maxGrade; i += 5) {
      const start = i;
      let end = i + 5;

      // Handle case where maxGrade is not divisible by 5
      if (end > maxGrade) {
        end = maxGrade;
      }

      // Count students in this range
      // Last range is inclusive: [35, 42] includes 42
      // Other ranges are half-open: [30, 35[ excludes 35
      const count = end === maxGrade
        ? classGrades.filter(grade => grade >= start && grade <= end).length
        : classGrades.filter(grade => grade >= start && grade < end).length;

      // Format range notation
      const rangeText = end === maxGrade
        ? `[${start},${end}]`  // Inclusive for last range
        : `[${start},${end}[`; // Half-open for others

      distribution.push({
        range: rangeText,
        count
      });
    }

    return {
      className,
      totalGraded: classGrades.length,
      totalStudents: classGrades.length, // Only students in this class
      maxGrade,
      distribution
    };
  }, []);

  // Load exam overview data (without student grades)
  useEffect(() => {
    const loadExamData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await SupabaseService.getHymnsExamOverview(id);

        if (response.success && response.data) {
          setExamData(response.data);
        } else {
          toast.error(response.error || 'Failed to load exam details');
          navigate('/admin/hymns');
        }

      } catch (error) {
        console.error('Error loading exam details:', error);
        toast.error('Failed to load exam details');
        navigate('/admin/hymns');
      } finally {
        setLoading(false);
      }
    };

    loadExamData();
  }, [id, navigate]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setShowResults(false);
    setCurrentPage(1);
  };

  // Apply filters and fetch paginated data
  const applyFilters = async (page = 1) => {
    setLoadingData(true);
    setCurrentPage(page);
    setShowResults(true);

    try {
      const response = await SupabaseService.getFilteredStudentGrades(
        id!,
        filters,
        page,
        pageSize
      );

      if (response.success && response.data) {
        setFilteredData(response.data);
        setTotalPages(response.data.totalPages || 1);
      } else {
        toast.error(response.error || 'Failed to load filtered data');
      }
    } catch (error) {
      console.error('Error filtering grades:', error);
      toast.error('An error occurred while filtering grades');
    } finally {
      setLoadingData(false);
    }
  };

  // Handle page changes
  const handlePageChange = async (page: number) => {
    await applyFilters(page);
  };

  // Export grades functionality
  const handleExportGrades = async () => {
    if (!id || !selectedExportClass) {
      toast.error('Please select a class for export');
      return;
    }

    try {
      setExporting(true);
      const response = await SupabaseService.exportHymnsExamGradesExcel(id, selectedExportClass);

      if (response.success && response.data) {
        setExportData(response.data);
        toast.success('Data loaded for export');
      } else {
        toast.error(response.error || 'Failed to load export data');
      }

    } catch (error) {
      console.error('Error preparing export data:', error);
      toast.error('Failed to prepare export data');
    } finally {
      setExporting(false);
    }
  };

  // Send grading reminders
  const handleSendReminders = async () => {
    if (!id) return;

    try {
      setSendingReminders(true);
      const response = await SupabaseService.sendGradingReminders(id);

      if (response.success) {
        toast.success('Grading reminders sent successfully');
      } else {
        toast.error(response.error || 'Failed to send reminders');
      }

    } catch (error) {
      console.error('Error sending reminders:', error);
      toast.error('Failed to send reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  // Exam Notes Editor handlers
  const handleOpenExamNotesEditor = (grade: StudentGradeDetail) => {
    setGradeForNotes(grade);
    setExamNotesEditorOpen(true);
  };

  const handleCloseExamNotesEditor = () => {
    setExamNotesEditorOpen(false);
    setGradeForNotes(null);
  };

  const handleSaveExamNotes = async (notes: ExamNotes): Promise<boolean> => {
    if (!gradeForNotes) return false;

    try {
      const response = await SupabaseService.updateGradeExamNotes(gradeForNotes.id, notes);
      if (response.success) {
        // Reload filtered data if showing results, otherwise reload overview
        if (showResults) {
          await applyFilters(currentPage);
        }
        return true;
      } else {
        toast.error(response.error || 'Failed to save display settings');
        return false;
      }
    } catch (error) {
      toast.error('Error saving display settings');
      return false;
    }
  };

  // Get current display data (either filtered or original)
  const displayGrades = showResults && filteredData ? (filteredData.studentGrades || []) : (examData?.studentGrades || []);
  const currentStats = examData?.statistics || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('Loading exam details...', 'Loading exam details...')}</p>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('Exam not found', 'Exam not found')}</h2>
          <Button onClick={() => navigate('/admin/hymns')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('Back to Exams', 'Back to Exams')}
          </Button>
        </div>
      </div>
    );
  }

  const { exam, classPerformance, teacherPerformance } = examData || {};
  const totalPossibleMarks = exam ? (exam.tasleem_max || 0) + (exam.not2_max || 0) + (exam.ada2_max || 0) : 0;

  // Handle class selection (fetches data when needed)
  const handleClassSelect = async (className: string) => {
    if (selectedClass === className) {
      setSelectedClass(null);
      setClassDistribution(null);
    } else {
      setSelectedClass(className);
      setLoadingClassData(true);

      try {
        // Fetch all student grades for this exam
        const response = await SupabaseService.getFilteredStudentGrades(
          id!,
          { search: '', class: className, passStatus: 'all' },
          1,
          1000 // Large page size to get all students
        );

        if (response.success && response.data) {
          const distribution = calculateClassDistribution(response.data.studentGrades, className, exam, totalPossibleMarks);
          setClassDistribution(distribution);
        }
      } catch (error) {
        console.error('Error fetching class grades:', error);
        toast.error('Failed to fetch class grades');
      } finally {
        setLoadingClassData(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50" dir="ltr">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/hymns')}
                className="flex items-center gap-2 p-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t('Back to List', 'Back to List')}</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {language === 'ar' ? exam.title_ar : exam.title_en}
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  {t('Month', 'Month')}: {exam.exam_month}/{exam.exam_year} • {t('Total Points', 'Total Points')}: {totalPossibleMarks}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/admin/hymns/edit/${exam.id}`)}
              className="flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Edit className="w-4 h-4" />
              {t('Edit', 'Edit')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* School-Wide Exam Overview */}
        <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-purple-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              {t('📊 School-Wide Exam Overview', 'School-Wide Exam Overview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Month & Pass Mark Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {t('Month', 'Month')}: {exam.exam_month}/2024
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {t('Pass Mark', 'Pass Mark')}: {exam.pass_percentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {t('Criteria', 'Criteria')}: {totalPossibleMarks}pt
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Students & Graded */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{currentStats.totalStudents}</div>
                    <div className="text-sm text-green-800">{t('Total Students', 'Total Students')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{currentStats.gradedStudents}/{currentStats.totalStudents}</div>
                    <div className="text-sm text-green-800">{t('Graded', 'Graded')}</div>
                  </div>
                </div>
              </div>

              {/* Pass Rate & Average */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{currentStats.passRate.toFixed(1)}%</div>
                    <div className="text-sm text-purple-800">{t('Pass Rate', 'Pass Rate')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {Number(currentStats.averageScore).toFixed(1)}/{totalPossibleMarks}
                    </div>
                    <div className="text-sm text-purple-800">{t('Average', 'Average')}</div>
                  </div>
                </div>
              </div>

              {/* Criteria Breakdown */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-orange-800">{t('Tasleem', 'Tasleem')}:</span>
                    <span className="font-bold text-orange-600">{Number(currentStats.averageTasleem).toFixed(1)}/{exam?.tasleem_max || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-orange-800">{t('Not2', 'Not2')}:</span>
                    <span className="font-bold text-orange-600">{Number(currentStats.averageNot2).toFixed(1)}/{exam?.not2_max || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-orange-800">{t('Ada2', 'Ada2')}:</span>
                    <span className="font-bold text-orange-600">{Number(currentStats.averageAda2).toFixed(1)}/{exam?.ada2_max || 0}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-orange-200">
                    <span className="font-medium text-orange-800">{t('Pending', 'Pending')}:</span>
                    <span className="font-bold text-orange-600">{currentStats.pendingGrading}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Grades Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('👥 All Student Grades (School-Wide)', 'All Student Grades (School-Wide)')} ({showResults ? displayGrades.length : examData?.studentGrades?.length || 0})
            </CardTitle>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('🔍 [Search student...]', '[Search student...]')}
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filters.class} onValueChange={(value) => handleFilterChange('class', value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('[Class A▼]', '[Class A▼]')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Classes', 'All Classes')}</SelectItem>
                  {currentStats.allClasses?.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.passStatus} onValueChange={(value: any) => handleFilterChange('passStatus', value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('[Pass/Fail▼]', '[Pass/Fail▼]')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All', 'All')}</SelectItem>
                  <SelectItem value="pass">{t('Pass', 'Pass')}</SelectItem>
                  <SelectItem value="fail">{t('Fail', 'Fail')}</SelectItem>
                  <SelectItem value="unattended">{t('Unattended', 'Unattended')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setFilters({ search: '', class: 'all', passStatus: 'all' })}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {t('Clear', 'Clear')}
              </Button>
              <Button
                onClick={() => applyFilters()}
                disabled={loadingData}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {loadingData ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {t('Show Results', 'Show Results')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Name', 'Name')}</TableHead>
                    <TableHead>{t('Class', 'Class')}</TableHead>
                    <TableHead className="text-center">{t('Tasleem', 'Tasleem')} (/{exam?.tasleem_max || 0})</TableHead>
                    <TableHead className="text-center">{t('Not2', 'Not2')} (/{exam?.not2_max || 0})</TableHead>
                    <TableHead className="text-center">{t('Ada2', 'Ada2')} (/{exam?.ada2_max || 0})</TableHead>
                    <TableHead className="text-center">{t('Total', 'Total')} (/{totalPossibleMarks})</TableHead>
                    <TableHead className="text-center">{t('Display', 'Display')}</TableHead>
                    <TableHead className="text-center">{t('Status', 'Status')}</TableHead>
                    <TableHead className="text-center">{t('Teacher', 'Teacher')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!showResults ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="text-gray-500">
                          <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-lg font-medium">{t('No data loaded yet', 'No data loaded yet')}</p>
                          <p className="text-sm mt-1">{t('Apply filters and click "Show Results" to view student grades', 'Apply filters and click "Show Results" to view student grades')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : displayGrades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="text-gray-500">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-lg font-medium">{t('No students found', 'No students found')}</p>
                          <p className="text-sm mt-1">{t('Try adjusting your filters', 'Try adjusting your filters')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayGrades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{grade.studentName}</div>
                            <div className="text-sm text-gray-500">{grade.studentCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>{grade.className}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{grade.isGraded ? grade.tasleemGrade.toFixed(1) : '-'}</span>
                            {grade.gradeCount > 1 && (
                              <span className="text-xs text-blue-600">({grade.gradeCount} teachers)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{grade.isGraded ? grade.not2Grade.toFixed(1) : '-'}</span>
                            {grade.gradeCount > 1 && (
                              <span className="text-xs text-blue-600">avg</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{grade.isGraded ? grade.ada2Grade.toFixed(1) : '-'}</span>
                            {grade.gradeCount > 1 && (
                              <span className="text-xs text-blue-600">avg</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {grade.isGraded ? grade.totalGrade.toFixed(1) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenExamNotesEditor(grade)}
                            className="h-7 px-2 text-xs"
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            {grade.examNotes ? (
                              <span className={`px-2 py-0.5 rounded text-xs border ${
                                grade.examNotes.display_mode === 'show' ? 'bg-green-100 text-green-800 border-green-300' :
                                grade.examNotes.display_mode === 'hide' ? 'bg-slate-100 text-slate-800 border-slate-400' :
                                grade.examNotes.display_mode === 'hint' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                                grade.examNotes.display_mode === 'warning' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                'bg-red-100 text-red-800 border-red-300'
                              }`}>
                                {grade.examNotes.display_mode}
                              </span>
                            ) : (
                              <span className="text-gray-400">show</span>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          {!grade.isGraded ? (
                            <Badge className="bg-gray-100 text-gray-800">
                              {t('Unattended', 'Unattended')}
                            </Badge>
                          ) : (
                            <Badge
                              variant={grade.passed ? "default" : "destructive"}
                              className={grade.passed ? "bg-green-100 text-green-800" : ""}
                            >
                              {grade.passed ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {grade.passed ? t('Pass', 'Pass') : t('Fail', 'Fail')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="text-sm">{grade.teacherName}</div>
                            {grade.isGraded && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs px-2 py-1"
                                onClick={() => navigate(`/admin/hymns/detail/${id}/student/${grade.studentId}`)}
                              >
                                {t('View Details', 'View Details')}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {showResults && totalPages > 1 && (
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-gray-600">
              {t('Showing', 'Showing')} {((currentPage - 1) * pageSize) + 1} {t('to', 'to')} {Math.min(currentPage * pageSize, filteredData?.totalCount || 0)} {t('of', 'of')} {filteredData?.totalCount || 0} {t('students', 'students')}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {t('Previous', 'Previous')}
              </Button>
              <div className="flex items-center gap-1">
                {/* Show smart pagination with ellipsis */}
                {(() => {
                  const pages = [];
                  const maxVisible = 7;

                  if (totalPages <= maxVisible) {
                    // Show all pages if total is small
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Smart pagination with ellipsis
                    if (currentPage <= 4) {
                      for (let i = 1; i <= 5; i++) {
                        pages.push(i);
                      }
                      pages.push('...');
                      pages.push(totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      pages.push(1);
                      pages.push('...');
                      for (let i = totalPages - 4; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      pages.push(1);
                      pages.push('...');
                      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                        pages.push(i);
                      }
                      pages.push('...');
                      pages.push(totalPages);
                    }
                  }

                  return pages.map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8"
                      >
                        {page}
                      </Button>
                    );
                  });
                })()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                {t('Next', 'Next')}
              </Button>
            </div>
          </div>
        )}

        {/* Grade Analysis Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pass/Fail Analysis */}
          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t('📈 Grade Analysis', 'Grade Analysis')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('Pass Rate:', 'Pass Rate:')}</span>
                  <span className="text-lg font-bold text-green-600">{currentStats.passRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('Failed Students:', 'Failed Students:')}</span>
                  <span className="text-lg font-bold text-red-600">
                    {currentStats.gradedStudents - Math.round((currentStats.passRate / 100) * currentStats.gradedStudents)} 
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('Highest Score:', 'Highest Score:')}</span>
                  <span className="text-lg font-bold text-blue-600">{totalPossibleMarks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('Unattended:', 'Unattended:')}</span>
                  <span className="text-lg font-bold text-orange-600">{currentStats.pendingGrading}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Performance */}
          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                {t('Teacher Performance', 'Teacher Performance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {teacherPerformance.map((teacher) => (
                  <div key={teacher.teacherId} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{teacher.teacherName}</span>
                      <Badge variant="outline" className="text-xs">
                        {teacher.totalGraded} students
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('Avg:', 'Avg:')}</span>
                        <span className="font-medium">
                          {Number(teacher.averageScore).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('Consistency:', 'Consistency:')}</span>
                        <span className="font-medium">{teacher.consistencyScore}%</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t('Higher consistency = more even grading', 'Higher consistency = more even grading')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t('Classes:', 'Classes:')} {teacher.classes.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
              {teacherPerformance.length > 3 && (
                <div className="text-center text-sm text-gray-500 pt-2 border-t">
                  {t(`Showing all ${teacherPerformance.length} teachers`, `Showing all ${teacherPerformance.length} teachers`)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Class Performance Clustered Bar Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t('📊 Class Performance Overview', 'Class Performance Overview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Chart Container */}
            <div className="h-64 mb-4 px-4 overflow-x-auto">
              <div className="flex items-end justify-center h-full gap-4 min-w-max">
                {classPerformance.slice(0, 15).map((cls, index) => {
                  const avgPercentage = (cls.averageScore / totalPossibleMarks) * 100;
                  const passPercentage = cls.passRate;
                  const avgColor = avgPercentage >= 80 ? 'bg-green-500' : avgPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500';
                  const passColor = passPercentage >= 80 ? 'bg-blue-600' : passPercentage >= 60 ? 'bg-blue-400' : 'bg-blue-300';

                  return (
                    <div key={cls.className} className="flex flex-col items-center gap-2 group">
                      {/* Clustered Bars Container */}
                      <div className="flex items-end gap-1 h-48">
                        {/* Average Score Bar */}
                        <div
                          className={`${avgColor} rounded-t transition-all duration-300 relative hover:opacity-80`}
                          style={{
                            width: '20px',
                            height: `${(avgPercentage / 100) * 180}px`
                          }}
                          title={`${cls.className} - Average Score: ${avgPercentage.toFixed(1)}%`}
                        >
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-1 rounded shadow-sm">
                            {avgPercentage.toFixed(0)}%
                          </div>
                        </div>

                        {/* Pass Rate Bar */}
                        <div
                          className={`${passColor} rounded-t transition-all duration-300 relative hover:opacity-80`}
                          style={{
                            width: '20px',
                            height: `${(passPercentage / 100) * 180}px`
                          }}
                          title={`${cls.className} - Pass Rate: ${passPercentage.toFixed(1)}%`}
                        >
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-1 rounded shadow-sm">
                            {passPercentage.toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      {/* Class Label */}
                      <div className="text-xs text-center text-gray-700 font-medium max-w-[80px] truncate" title={cls.className}>
                        {cls.className}
                      </div>

                      {/* Student Count */}
                      <div className="text-xs text-gray-500 text-center">
                        {cls.gradedStudents}/{cls.totalStudents}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-8 text-xs text-gray-600 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>{t('Average Score', 'Average Score')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>{t('Pass Rate', 'Pass Rate')}</span>
              </div>
            </div>

            {classPerformance.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                {t('No class data available', 'No class data available')}
              </div>
            )}
            {classPerformance.length > 15 && (
              <div className="text-center text-sm text-blue-600 mt-4">
                {t(`Showing 15 of ${classPerformance.length} classes`, `Showing 15 of ${classPerformance.length} classes`)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Grades Overview Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t('📊 Class Grades Overview', 'Class Grades Overview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Class Selection Buttons */}
            <div className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {examData?.statistics?.allClasses?.map((className) => (
                  <Button
                    key={className}
                    variant={selectedClass === className ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleClassSelect(className)}
                    disabled={loadingClassData}
                    className="text-xs h-8"
                  >
                    {className}
                  </Button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {loadingClassData && (
              <div className="text-center text-gray-500 py-8">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
                <p className="text-sm">{t('Loading class data...', 'Loading class data...')}</p>
              </div>
            )}

            {/* Grade Distribution Chart */}
            {selectedClass && classDistribution && !loadingClassData && (
              <div className="mt-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-800">
                    {t('Grade Distribution for', 'Grade Distribution for')} {selectedClass}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('Total graded students:', 'Total graded students:')} {classDistribution.totalGraded}
                    {t(` (Max grade: ${classDistribution.maxGrade})`, ` (Max grade: ${classDistribution.maxGrade})`)}
                  </p>
                </div>

                {/* Chart Container */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="mx-auto" style={{ maxWidth: '1000px' }}>
                    {/* Y-axis label */}
                    <div className="flex justify-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">{t('Number of Students', 'Number of Students')}</span>
                    </div>

                    {/* Chart */}
                    <div className="flex gap-4">
                      {/* Y-axis labels */}
                      <div className="flex flex-col justify-between text-xs text-gray-500 pr-2" style={{ height: '300px' }}>
                        {(() => {
                          const maxCount = Math.max(...classDistribution.distribution.map(d => d.count));
                          const yAxisLabels = [];
                          for (let i = maxCount; i >= 0; i -= Math.ceil(maxCount / 5)) {
                            yAxisLabels.push(i);
                          }
                          return yAxisLabels.map((label, index) => (
                            <div key={index} className="flex items-center h-6">
                              {label}
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Chart area with gridlines */}
                      <div className="flex-1 relative" style={{ height: '300px' }}>
                        {/* Horizontal gridlines */}
                        {(() => {
                          const maxCount = Math.max(...classDistribution.distribution.map(d => d.count));
                          const gridlines = [];
                          for (let i = 0; i <= 5; i++) {
                            gridlines.push(i);
                          }
                          return gridlines.map((_, index) => (
                            <div
                              key={index}
                              className="absolute w-full border-t border-gray-200"
                              style={{
                                top: `${(index * 100) / 5}%`
                              }}
                            />
                          ));
                        })()}

                        {/* Bars container */}
                        <div className="absolute inset-0 flex items-end justify-center gap-4 px-4 pb-8">
                          <div className="flex items-end gap-3 h-full w-full">
                            {classDistribution.distribution.map((item, index) => {
                              const maxCount = Math.max(...classDistribution.distribution.map(d => d.count));
                              const barHeight = maxCount > 0 ? (item.count / maxCount) * 250 : 0;

                              // Color based on performance with professional palette
                              const getBarColor = () => {
                                if (item.count === 0) return { bg: 'bg-slate-200' };
                                const rangeStart = parseInt(item.range.match(/\d+/)?.[0] || '0');
                                const performanceRatio = rangeStart / classDistribution.maxGrade;
                                if (performanceRatio >= 0.8) return {
                                  bg: 'bg-gradient-to-t from-emerald-600 to-emerald-500',
                                  hover: 'from-emerald-700 to-emerald-600'
                                };
                                if (performanceRatio >= 0.6) return {
                                  bg: 'bg-gradient-to-t from-blue-600 to-blue-500',
                                  hover: 'from-blue-700 to-blue-600'
                                };
                                if (performanceRatio >= 0.4) return {
                                  bg: 'bg-gradient-to-t from-amber-600 to-amber-500',
                                  hover: 'from-amber-700 to-amber-600'
                                };
                                return {
                                  bg: 'bg-gradient-to-t from-rose-600 to-rose-500',
                                  hover: 'from-rose-700 to-rose-600'
                                };
                              };

                              return (
                                <div key={index} className="flex flex-col items-center flex-1 max-w-[80px]">
                                  {/* Bar */}
                                  <div
                                    className={`w-full rounded-t-lg transition-all duration-300 hover:scale-105 relative group cursor-pointer shadow-lg ${getBarColor().bg} ${getBarColor().hover || ''}`}
                                    style={{
                                      height: `${barHeight}px`,
                                      minHeight: '4px'
                                    }}
                                    title={`${item.range}: ${item.count} students (${Math.round((item.count / classDistribution.totalGraded) * 100)}%)`}
                                  >
                                    {/* Count label on top of bar */}
                                    {item.count > 0 && (
                                      <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-700 whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        {item.count}
                                      </div>
                                    )}
                                    {/* Absolute number label inside bar */}
                                    {item.count > 0 && (
                                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-white font-medium drop-shadow-sm">
                                        {item.count}      
                                      </div>
                                    )}
                                  </div>

                                  {/* X-axis label */}
                                  <div className="text-xs text-gray-700 mt-3 text-center font-medium whitespace-nowrap">
                                    {item.range}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Y-axis line */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-400" />

                        {/* X-axis line */}
                        <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-400" />
                      </div>
                    </div>

                    {/* X-axis label */}
                    <div className="flex justify-center mt-2">
                      <span className="text-sm font-semibold text-gray-700">{t('Grade Range', 'Grade Range')}</span>
                    </div>
                  </div>

                  {/* Chart Legend */}
                  <div className="mt-6 flex justify-center items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded shadow-sm"></div>
                      <span className="text-gray-600 font-medium">{t('Excellent', 'Excellent')} (≥80%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded shadow-sm"></div>
                      <span className="text-gray-600 font-medium">{t('Good', 'Good')} (60-79%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded shadow-sm"></div>
                      <span className="text-gray-600 font-medium">{t('Average', 'Average')} (40-59%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-rose-500 rounded shadow-sm"></div>
                      <span className="text-gray-600 font-medium">{t('Below Average', 'Below Average')} (&lt;40%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-slate-200 rounded shadow-sm"></div>
                      <span className="text-gray-600 font-medium">{t('No Students', 'No Students')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!selectedClass && !loadingClassData && (
              <div className="text-center text-gray-500 py-8">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('Select a class to view grade distribution', 'Select a class to view grade distribution')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-purple-800 flex items-center gap-2">
              <Download className="w-5 h-5" />
              {t('📤 Export Grades to Excel', 'Export Grades to Excel')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Select Class', 'Select Class')}
                </label>
                <Select value={selectedExportClass} onValueChange={setSelectedExportClass}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('Choose a class to export...', 'Choose a class to export...')} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentStats.allClasses?.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleExportGrades}
                  disabled={!selectedExportClass || exporting}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? t('Loading...', 'Loading...') : t('Load Export Data', 'Load Export Data')}
                </Button>
                {exportData && (
                  <HymnsExamExcelExport
                    examInfo={exportData.examInfo}
                    students={exportData.students}
                    className={exportData.className}
                  />
                )}
              </div>
            </div>
            {exportData && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  {t('Ready to export', 'Ready to export')}: {exportData.students.length} {t('students in', 'students in')} {exportData.className}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <Button
            onClick={handleSendReminders}
            variant="outline"
            disabled={sendingReminders}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sendingReminders ? t('Sending...', 'Sending...') : t('📧 Send Teacher Reminders', 'Send Teacher Reminders')}
          </Button>
        </div>
      </div>

      {/* Exam Notes Editor Dialog */}
      {gradeForNotes && (
        <ExamNotesEditor
          isOpen={examNotesEditorOpen}
          onClose={handleCloseExamNotesEditor}
          onSave={handleSaveExamNotes}
          initialNotes={gradeForNotes.examNotes}
          studentName={gradeForNotes.studentName}
        />
      )}
    </div>
  );
};

export default AdminHymnsExamDetail;