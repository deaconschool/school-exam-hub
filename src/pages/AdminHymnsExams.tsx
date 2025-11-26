import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, Search, Edit, Users, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Music, BookOpen, BarChart3, TrendingUp, UserCheck, Award, Download, ArrowLeft,
  Filter, RefreshCw, AlertTriangle, Trash2, Power, Send, Eye, MoreHorizontal
} from 'lucide-react';
import { AdminService } from '@/services/adminService';
import { SupabaseService } from '@/services/supabaseService';
import { HymnsExam } from '../types/supabase';

interface HymnsExamStats {
  totalStudents: number;
  gradedStudents: number;
  pendingStudents: number;
  averageScore?: number;
  passRate?: number;
  topScore?: number;
  lowestScore?: number;
}

interface QuickStats {
  activeExams: number;
  totalExams: number;
  totalGraded: number;
  totalStudents: number;
}

const AdminHymnsExams = () => {
  const navigate = useNavigate();

  // State management
  const [exams, setExams] = useState<HymnsExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [examStats, setExamStats] = useState<Record<string, HymnsExamStats>>({});
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});
  const [quickStats, setQuickStats] = useState<QuickStats>({
    activeExams: 0,
    totalExams: 0,
    totalGraded: 0,
    totalStudents: 0
  });

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [toggleActivationDialogOpen, setToggleActivationDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<HymnsExam | null>(null);
  const [targetActivationState, setTargetActivationState] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Get available years from exams
  const availableYears = [...new Set(exams.map(exam =>
    new Date(exam.created_at).getFullYear()
  ))].sort((a, b) => b - a);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Load Hymns exams data
  const loadHymnsExams = async () => {
    setLoading(true);
    try {
      const result = await AdminService.getHymnsExamsList();

      if (result.success && result.data) {
        setExams(result.data);

        // Calculate quick stats
        const stats: QuickStats = {
          activeExams: result.data.filter(exam => exam.is_active).length,
          totalExams: result.data.length,
          totalGraded: 0,
          totalStudents: 0
        };

        // Load stats for each exam
        for (const exam of result.data) {
          loadExamStats(exam.id);
        }

        setQuickStats(stats);
      } else {
        console.error('Failed to load Hymns exams:', result.error);
      }
    } catch (error) {
      console.error('Error loading Hymns exams:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics for a specific exam
  const loadExamStats = async (examId: string) => {
    setLoadingStats(prev => ({ ...prev, [examId]: true }));

    try {
      // Use the Supabase service for detailed results
      const result = await SupabaseService.getHymnsExamDetail(examId);

      if (result.success && result.data) {
        const stats: HymnsExamStats = {
          totalStudents: result.data.statistics.totalStudents,
          gradedStudents: result.data.statistics.gradedStudents,
          pendingStudents: result.data.statistics.totalStudents - result.data.statistics.gradedStudents,
          averageScore: result.data.statistics.averageScore,
          passRate: result.data.statistics.passRate,
        };

        setExamStats(prev => ({ ...prev, [examId]: stats }));
      }
    } catch (error) {
      console.error('Error loading exam stats:', error);
    } finally {
      setLoadingStats(prev => ({ ...prev, [examId]: false }));
    }
  };

  // Filter exams
  const filteredExams = exams.filter(exam => {
    const searchMatch = searchTerm === '' ||
      exam.title_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.title_ar?.toLowerCase().includes(searchTerm.toLowerCase());

    const examDate = new Date(exam.created_at);
    const monthMatch = selectedMonth === 'all' || examDate.getMonth() + 1 === parseInt(selectedMonth);
    const yearMatch = selectedYear === 'all' || examDate.getFullYear() === parseInt(selectedYear);
    const statusMatch = selectedStatus === 'all' ||
      (selectedStatus === 'active' && exam.is_active) ||
      (selectedStatus === 'inactive' && !exam.is_active);

    return searchMatch && monthMatch && yearMatch && statusMatch;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMonth('all');
    setSelectedYear('all');
    setSelectedStatus('all');
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Get status badge
  const getStatusBadge = (exam: HymnsExam) => {
    const isActive = exam.is_active;
    const status = exam.status === 'draft';

    return (
      <div className="flex items-center gap-2">
        {/* Draft/Published Status */}
        <Badge
          variant={status ? "secondary" : "default"}
          className={`${status ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-blue-100 text-blue-800 border-blue-200'} px-3 py-1`}
        >
          {status ? '📝 Draft' : '📋 Published'}
        </Badge>

        {/* Active Indicator - Small and subtle */}
        {isActive && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-700 font-medium">Live</span>
          </div>
        )}
      </div>
    );
  };

  // Export grades function (placeholder)
  const exportExamGrades = async (examId: string) => {
    try {
      // TODO: Implement Excel export functionality
      alert('Excel export will be implemented in the next phase');
    } catch (error) {
      console.error('Error exporting grades:', error);
      alert('Failed to export grades');
    }
  };

  // Handler functions for delete/deactivate operations
  const handleDeleteExam = async () => {
    if (!selectedExam) return;

    setActionLoading(true);
    try {
      const result = await AdminService.deleteHymnsExam(selectedExam.id);
      if (result.success) {
        await loadHymnsExams(); // Reload the list
        setDeleteDialogOpen(false);
        setSelectedExam(null);
      } else {
        alert(`Failed to delete exam: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Failed to delete exam');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateExam = async () => {
    if (!selectedExam) return;

    setActionLoading(true);
    try {
      const result = await AdminService.deactivateHymnsExam(selectedExam.id);
      if (result.success) {
        await loadHymnsExams(); // Reload the list
        setDeactivateDialogOpen(false);
        setSelectedExam(null);
      } else {
        alert(`Failed to deactivate exam: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deactivating exam:', error);
      alert('Failed to deactivate exam');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteDialog = (exam: HymnsExam) => {
    setSelectedExam(exam);
    setDeleteDialogOpen(true);
  };

  const openDeactivateDialog = (exam: HymnsExam) => {
    setSelectedExam(exam);
    setDeactivateDialogOpen(true);
  };

  // Toggle activation handler
  const handleToggleActivation = async () => {
    if (!selectedExam) return;

    setActionLoading(true);
    try {
      const result = await AdminService.toggleHymnsExamActivation(
        selectedExam.id,
        targetActivationState
      );

      if (result.success) {
        await loadHymnsExams(); // Reload the list
        setToggleActivationDialogOpen(false);
        setSelectedExam(null);
        setTargetActivationState(false);
      } else {
        alert(`Failed to ${targetActivationState ? 'activate' : 'deactivate'} exam: ${result.error}`);
      }
    } catch (error) {
      console.error('Error toggling exam activation:', error);
      alert(`Failed to ${targetActivationState ? 'activate' : 'deactivate'} exam`);
    } finally {
      setActionLoading(false);
    }
  };

  // Publish exam handler
  const handlePublishExam = async (examId: string) => {
    setActionLoading(true);
    try {
      const result = await AdminService.publishHymnsExam(examId);
      if (result.success) {
        await loadHymnsExams(); // Reload the list
        alert('Exam published successfully!');
      } else {
        alert(`Failed to publish exam: ${result.error}`);
      }
    } catch (error) {
      console.error('Error publishing exam:', error);
      alert('Failed to publish exam');
    } finally {
      setActionLoading(false);
    }
  };

  // Open toggle activation dialog
  const openToggleActivationDialog = (exam: HymnsExam, activate: boolean) => {
    setSelectedExam(exam);
    setTargetActivationState(activate);
    setToggleActivationDialogOpen(true);
  };

  // Load data on component mount
  useEffect(() => {
    loadHymnsExams();
  }, []);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdowns = document.querySelectorAll('[id^="mobile-actions-"]');
      dropdowns.forEach((dropdown) => {
        if (!dropdown.contains(event.target as Node)) {
          dropdown.classList.add('hidden');
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8" dir="ltr">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hymns Exams Management</h1>
            <p className="text-gray-600 mt-1">Manage school-wide Hymns exams for teacher portal grading</p>
          </div>
          <Button
            onClick={() => navigate('/admin/hymns/create')}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create New Exam</span>
            <span className="sm:hidden">Create Exam</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Exams</p>
                  <p className="text-2xl font-bold text-gray-900">{quickStats.activeExams}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Music className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Exams</p>
                  <p className="text-2xl font-bold text-gray-900">{quickStats.totalExams}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Graded</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(examStats).reduce((sum, stat) => sum + stat.gradedStudents, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(examStats).reduce((sum, stat) => sum + stat.totalStudents, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar - Full width on mobile */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search Hymns exams by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Filters - Stack vertically on mobile */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex flex-1 min-w-0">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {monthNames.map((month, index) => (
                        <SelectItem key={month} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-1 min-w-0">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-1 min-w-0">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto justify-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>

                <Button variant="outline" onClick={loadHymnsExams} className="w-full sm:w-auto justify-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              School-Wide Hymns Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading Hymns exams...</p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="text-center py-12">
                <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Hymns exams found</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first school-wide Hymns exam.</p>
                <Button onClick={() => navigate('/admin/hymns/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Hymns Exam
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-[700px] sm:min-w-[760px] pr-2 sm:pr-4">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-2 sm:px-4 font-semibold text-sm text-gray-900 w-[180px] sm:w-[220px]">Exam Details</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-semibold text-sm text-gray-900 w-[90px] sm:w-[100px]">Period</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-semibold text-sm text-gray-900 w-[80px] sm:w-[90px]">Status</th>
                        <th className="text-center py-3 px-2 sm:px-4 font-semibold text-sm text-gray-900 w-[90px] sm:w-[100px]">Progress</th>
                        <th className="text-center py-3 px-2 sm:px-4 font-semibold text-sm text-gray-900 w-[90px] sm:w-[110px]">Performance</th>
                        <th className="text-center py-3 px-2 sm:px-4 font-semibold text-sm text-gray-900 w-[70px] sm:w-[80px]">Controls</th>
                        <th className="text-center py-3 px-2 sm:px-4 font-semibold text-sm text-gray-900 w-[140px] sm:w-[160px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredExams.map((exam) => {
                        const stats = examStats[exam.id];
                        const isActive = exam.is_active;

                        return (
                          <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                            {/* Exam Details */}
                            <td className="py-3 px-2 sm:px-4">
                              <div className="max-w-xs sm:max-w-sm">
                                <div className="font-medium text-gray-900 truncate text-sm">
                                  {exam.title_en || exam.title_ar}
                                </div>
                                <div
                                  className="text-xs text-gray-500 truncate"
                                  style={{ direction: exam.title_ar ? 'rtl' : 'ltr', textAlign: exam.title_ar ? 'right' : 'left' }}
                                >
                                  {exam.title_ar || exam.title_en}
                                </div>
                                {isActive && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-xs text-green-600 font-medium">Live</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Period */}
                            <td className="py-3 px-2 sm:px-4">
                              <div className="text-xs sm:text-sm">
                                <div className="font-medium text-gray-900 truncate">
                                  {formatDate(exam.created_at)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {exam.pass_percentage}%
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-2 sm:px-4">
                              <div className="scale-90 sm:scale-100">
                                {getStatusBadge(exam)}
                              </div>
                            </td>

                            {/* Progress */}
                            <td className="py-3 px-2 sm:px-4">
                              {loadingStats[exam.id] ? (
                                <div className="flex justify-center">
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>
                                </div>
                              ) : stats ? (
                                <div className="text-center">
                                  <div className="text-sm sm:text-lg font-bold text-gray-900">
                                    {stats.totalStudents > 0
                                      ? Math.round((stats.gradedStudents / stats.totalStudents) * 100)
                                      : 0}%
                                  </div>
                                  <div className="text-xs text-gray-500 hidden sm:block">
                                    {stats.gradedStudents}/{stats.totalStudents}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-xs sm:text-sm text-gray-500">—</div>
                              )}
                            </td>

                            {/* Performance */}
                            <td className="py-3 px-2 sm:px-4">
                              {loadingStats[exam.id] ? (
                                <div className="flex justify-center">
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>
                                </div>
                              ) : stats?.averageScore ? (
                                <div className="text-center">
                                  <div className="text-sm sm:text-lg font-bold text-blue-600">
                                    {stats.averageScore.toFixed(0)}%
                                  </div>
                                  {stats.passRate && (
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                      {stats.passRate.toFixed(0)}% pass
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center text-xs sm:text-sm text-gray-500">—</div>
                              )}
                            </td>

                            {/* Controls */}
                            <td className="py-3 px-2 sm:px-4">
                              <div className="flex justify-center">
                                <div className="flex items-center gap-1">
                                  <Switch
                                    checked={exam.is_active}
                                    onCheckedChange={(checked) => openToggleActivationDialog(exam, checked)}
                                    disabled={actionLoading}
                                    title="Toggle exam activation"
                                    className="scale-75 sm:scale-100"
                                  />
                                  <span className="text-xs text-gray-500 font-medium">
                                    {exam.is_active ? 'ON' : 'OFF'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-2 sm:px-4">
                              <div className="flex justify-center">
                                {/* Mobile Actions - More button */}
                                <div className="sm:hidden relative">
                                  <button
                                    onClick={() => {
                                      // Toggle dropdown menu
                                      const dropdown = document.getElementById(`mobile-actions-${exam.id}`);
                                      if (dropdown) {
                                        dropdown.classList.toggle('hidden');
                                      }
                                    }}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>

                                  {/* Mobile Dropdown Menu */}
                                  <div id={`mobile-actions-${exam.id}`} className="hidden fixed left-4 right-4 bottom-4 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[140px] max-h-[80vh] overflow-y-auto">
                                    <div className="flex flex-col">
                                      {/* View */}
                                      <button
                                        onClick={() => {
                                          closeAllDropdowns();
                                          navigate(`/admin/hymns/detail/${exam.id}`);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 transition-colors text-sm w-full text-left"
                                      >
                                        <Eye className="h-3 w-3" />
                                        View
                                      </button>

                                      {/* Edit */}
                                      <button
                                        onClick={() => {
                                          closeAllDropdowns();
                                          navigate(`/admin/hymns/edit/${exam.id}`);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors text-sm w-full text-left"
                                      >
                                        <Edit className="h-3 w-3" />
                                        Edit
                                      </button>

                                      {/* Publish */}
                                      {exam.status === 'draft' && (
                                        <button
                                          onClick={() => {
                                            closeAllDropdowns();
                                            handlePublishExam(exam.id);
                                          }}
                                          disabled={actionLoading}
                                          className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50 text-sm w-full text-left"
                                        >
                                          <Send className="h-3 w-3" />
                                          Publish
                                        </button>
                                      )}

                                      {/* Export */}
                                      <button
                                        onClick={() => {
                                          closeAllDropdowns();
                                          exportExamGrades(exam.id);
                                        }}
                                        disabled={!stats || stats.gradedStudents === 0}
                                        className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm w-full text-left"
                                      >
                                        <Download className="h-3 w-3" />
                                        Export
                                      </button>

                                      {/* Delete */}
                                      <button
                                        onClick={() => {
                                          closeAllDropdowns();
                                          openDeleteDialog();
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm w-full text-left border-t"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Desktop Actions - All buttons visible */}
                                <div className="hidden sm:flex justify-center flex-wrap gap-1">
                                  {/* View Results */}
                                  <button
                                    onClick={() => navigate(`/admin/hymns/detail/${exam.id}`)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View exam results and details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>

                                  {/* Edit Exam */}
                                  <button
                                    onClick={() => navigate(`/admin/hymns/edit/${exam.id}`)}
                                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Edit exam details"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>

                                  {/* Publish (Draft Only) */}
                                  {exam.status === 'draft' && (
                                    <button
                                      onClick={() => handlePublishExam(exam.id)}
                                      disabled={actionLoading}
                                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                                      title="Publish exam"
                                    >
                                      <Send className="h-4 w-4" />
                                    </button>
                                  )}

                                  {/* Export */}
                                  <button
                                    onClick={() => exportExamGrades(exam.id)}
                                    disabled={!stats || stats.gradedStudents === 0}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Export grades to Excel"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => openDeleteDialog(exam)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete exam"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Alert className="mt-6 bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>School-Wide Exams:</strong> Hymns exams created here are available to all teachers in the teacher portal.
            Teachers can grade any students using the existing 3-criteria system (Tasleem, Not2, Ada2).
            Only one exam can be active at a time to prevent confusion.
          </AlertDescription>
        </Alert>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-red-600">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="w-5 h-5" />
                </div>
                Confirm Delete
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Are you sure you want to delete this Hymns exam? This action cannot be undone and all associated grading data will be permanently removed.
              </DialogDescription>
            </DialogHeader>

            {selectedExam && (
              <div className="py-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedExam.title_en}</h4>
                  {selectedExam.title_ar && (
                    <p className="text-sm text-gray-600" style={{ direction: 'rtl', textAlign: 'right' }}>
                      {selectedExam.title_ar}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Created: {new Date(selectedExam.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-3 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSelectedExam(null);
                }}
                className="flex-1"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteExam}
                className="flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Exam'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deactivate Confirmation Dialog */}
        <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-orange-600">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Power className="w-5 h-5" />
                </div>
                Confirm Deactivate
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Are you sure you want to deactivate this Hymns exam? Teachers will no longer be able to grade students for this exam, but existing grading data will be preserved.
              </DialogDescription>
            </DialogHeader>

            {selectedExam && (
              <div className="py-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedExam.title_en}</h4>
                  {selectedExam.title_ar && (
                    <p className="text-sm text-gray-600" style={{ direction: 'rtl', textAlign: 'right' }}>
                      {selectedExam.title_ar}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Created: {new Date(selectedExam.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-3 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeactivateDialogOpen(false);
                  setSelectedExam(null);
                }}
                className="flex-1"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleDeactivateExam}
                className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deactivating...' : 'Deactivate Exam'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Toggle Activation Confirmation Dialog */}
        <Dialog open={toggleActivationDialogOpen} onOpenChange={setToggleActivationDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-blue-600">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Power className="w-5 h-5" />
                </div>
                {targetActivationState ? 'Confirm Activation' : 'Confirm Deactivation'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {targetActivationState
                  ? 'Are you sure you want to activate this Hymns exam? All other active Hymns exams will be automatically deactivated.'
                  : 'Are you sure you want to deactivate this Hymns exam? Teachers will no longer be able to grade students for this exam.'
                }
              </DialogDescription>
            </DialogHeader>

            {selectedExam && (
              <div className="py-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedExam.title_en}</h4>
                  {selectedExam.title_ar && (
                    <p className="text-sm text-gray-600" style={{ direction: 'rtl', textAlign: 'right' }}>
                      {selectedExam.title_ar}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {selectedExam.status} • Created: {new Date(selectedExam.created_at).toLocaleDateString()}
                  </div>
                </div>

                {targetActivationState && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <strong>Warning:</strong> This will deactivate all other active Hymns exams
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex gap-3 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setToggleActivationDialogOpen(false);
                  setSelectedExam(null);
                  setTargetActivationState(false);
                }}
                className="flex-1"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={targetActivationState ? "default" : "outline"}
                onClick={handleToggleActivation}
                className={`flex-1 ${targetActivationState ? 'bg-blue-600 hover:bg-blue-700' : 'text-orange-600 border-orange-300 hover:bg-orange-50'}`}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  targetActivationState ? 'Activating...' : 'Deactivating...'
                ) : (
                  targetActivationState ? 'Activate Exam' : 'Deactivate Exam'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminHymnsExams;