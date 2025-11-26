import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminService } from '@/services/adminService';
import { Exam } from '@/data/types';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Filter,
  Eye,
  EyeOff,
  Copy,
  BarChart3,
  Settings,
  FileText,
  Save,
  ExternalLink,
  Link,
  Power
} from 'lucide-react';

interface ExamFormData {
  title: string;
  examMonth: number;
  examYear: number;
  subject: string;
  level: number; // This maps to stage
  className: string;
  examUrl: string;
  isActive: boolean;
  pinRequired: boolean;
  pinPassword?: string;
  pinDescription?: string;
}

type SortField = 'title' | 'subject' | 'examDate' | 'className' | 'status';
type SortDirection = 'asc' | 'desc';

const AdminAcademicExams = () => {
  const navigate = useNavigate();

  // State management
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Table specific states
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('examDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    examMonth: new Date().getMonth() + 1,
    examYear: new Date().getFullYear(),
    subject: '',
    level: 0, // Default to first stage
    className: '',
    examUrl: '',
    isActive: true,
    pinRequired: false,
    pinPassword: '',
    pinDescription: ''
  });

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // Custom subject input state
  const [isAddingNewSubject, setIsAddingNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);

  const dateLocale = enUS;

  
  // Month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  
  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
  
      const [examsRes, classesRes, stagesRes, subjectsRes] = await Promise.all([
        AdminService.getAllExams(),
        AdminService.getClasses(),
        AdminService.getStages(),
        AdminService.getAllSubjects()
      ]);

  
      if (examsRes.success && examsRes.data) {
        // Filter only academic exams (exclude Hymns)
        const academicExams = examsRes.data.filter(exam => exam.subject !== 'Hymns');
          setExams(academicExams);
      } else {
        }

      if (classesRes.success && classesRes.data) {
          setClasses(classesRes.data);
      } else {
          }

      if (stagesRes.success && stagesRes.data) {
              setStages(stagesRes.data);
      } else {
            }

      if (subjectsRes.success && subjectsRes.data) {
        // Filter out Hymns subjects
        const academicSubjects = subjectsRes.data.filter(subject =>
          subject !== 'Hymns' && subject !== 'ألحان'
        );
            setSubjects(academicSubjects);
      } else {
              }
    } catch (error) {
        } finally {
      setLoading(false);
    }
  };

  // Clear filters function
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubject('all');
    setSelectedClass('all');
    setSelectedStatus('all');
    setSelectedStage('all');
    setSelectedMonth('all');
    setSelectedYear('all');
  };

  // Get unique years from exams data
  const availableYears = Array.from(new Set(exams.map(exam => exam.exam_year).filter(Boolean)))
    .sort((a, b) => (b || 0) - (a || 0));

  // Enhanced filtering
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || exam.subject === selectedSubject;
    const matchesClass = selectedClass === 'all' || exam.class === selectedClass;
    const matchesStage = selectedStage === 'all' || exam.level?.toString() === selectedStage;
    const matchesStatus = selectedStatus === 'all' ||
                         (selectedStatus === 'active' && exam.is_active !== false) ||
                         (selectedStatus === 'inactive' && exam.is_active === false);
    const matchesMonth = selectedMonth === 'all' || exam.exam_month?.toString() === selectedMonth;
    const matchesYear = selectedYear === 'all' || exam.exam_year?.toString() === selectedYear;

    return matchesSearch && matchesSubject && matchesClass && matchesStage && matchesStatus && matchesMonth && matchesYear;
  });

  // Sorting functionality
  const sortedExams = [...filteredExams].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'title':
        aValue = a.title || '';
        bValue = b.title || '';
        break;
      case 'subject':
        aValue = a.subject || '';
        bValue = b.subject || '';
        break;
      case 'examDate':
        // Create a date from exam_month and exam_year for sorting
        aValue = new Date(a.exam_year || 0, (a.exam_month || 1) - 1);
        bValue = new Date(b.exam_year || 0, (b.exam_month || 1) - 1);
        break;
      case 'className':
        aValue = a.class || '';
        bValue = b.class || '';
        break;
      case 'status':
        aValue = a.is_active !== false ? 1 : 0;
        bValue = b.is_active !== false ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedExams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExams = sortedExams.slice(startIndex, startIndex + itemsPerPage);

  // Table sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Bulk operations
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExams(paginatedExams.map(exam => exam.id));
    } else {
      setSelectedExams([]);
    }
  };

  const handleSelectExam = (examId: string, checked: boolean) => {
    if (checked) {
      setSelectedExams(prev => [...prev, examId]);
    } else {
      setSelectedExams(prev => prev.filter(id => id !== examId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedExams.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedExams.length} academic exams?`)) {
      try {
        const deletePromises = selectedExams.map(examId => AdminService.deleteExam(examId));
        await Promise.all(deletePromises);
        setSelectedExams([]);
        loadData();
      } catch (error) {
        console.error('Error deleting exams:', error);
      }
    }
  };

  const handleBulkStatusChange = async (status: boolean) => {
    if (selectedExams.length === 0) return;

    try {
      const updatePromises = selectedExams.map(examId =>
        AdminService.updateExam(examId, { is_active: status })
      );
      await Promise.all(updatePromises);
      setSelectedExams([]);
      loadData();
    } catch (error) {
      console.error('Error updating exam status:', error);
    }
  };

  
  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      examMonth: new Date().getMonth() + 1,
      examYear: new Date().getFullYear(),
      subject: '',
      level: 0,
      className: '',
      examUrl: '',
      isActive: true,
      pinRequired: false,
      pinPassword: '',
      pinDescription: ''
    });
    setShowPassword(false);
    setIsAddingNewSubject(false);
    setNewSubjectName('');
    setNewSubjectDescription('');
    setIsCreatingSubject(false);
    setEditingExam(null);
  };

  // Handle creating a new subject
  const handleCreateNewSubject = async () => {
    if (!newSubjectName.trim()) {
      alert('Please enter a subject name');
      return;
    }

    setIsCreatingSubject(true);
    try {
      const response = await AdminService.createSubject({
        name: newSubjectName.trim(),
        description: newSubjectDescription.trim() || undefined,
        category: 'academic'
      });

      if (response.success) {
        // Reload subjects to include the new one
        const subjectsRes = await AdminService.getAllSubjects();
        if (subjectsRes.success && subjectsRes.data) {
          const academicSubjects = subjectsRes.data.filter(subject =>
            subject !== 'Hymns' && subject !== 'ألحان'
          );
          setSubjects(academicSubjects);
        }

        // Set the new subject as selected
        setFormData(prev => ({ ...prev, subject: newSubjectName.trim() }));

        // Reset the new subject form
        setIsAddingNewSubject(false);
        setNewSubjectName('');
        setNewSubjectDescription('');
      } else {
        alert(`Failed to create subject: ${response.error}`);
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      alert('Failed to create subject. Please try again.');
    } finally {
      setIsCreatingSubject(false);
    }
  };

  // Handle subject selection change
  const handleSubjectChange = (value: string) => {
    if (value === '__add_new__') {
      setIsAddingNewSubject(true);
      setFormData(prev => ({ ...prev, subject: '' }));
    } else {
      setIsAddingNewSubject(false);
      setFormData(prev => ({ ...prev, subject: value }));
    }
  };

  // Handle create/update exam
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const examData = {
        title: formData.title,
        exam_month: formData.examMonth,
        exam_year: formData.examYear,
        subject: formData.subject,
        level: formData.level,
        class: formData.className,
        url: formData.examUrl,
        is_active: formData.isActive,
        require_pin: formData.pinRequired,
        pin_enabled: formData.pinRequired,
        pin_password: formData.pinRequired ? formData.pinPassword : null,
        pin_description: formData.pinRequired ? formData.pinDescription : null
      };

      let response;
      if (editingExam) {
        response = await AdminService.updateExam(editingExam.id, examData);
      } else {
        response = await AdminService.createExam(examData);
      }

      if (response.success) {
        setIsCreateDialogOpen(false);
        resetForm();
        loadData(); // Reload exams
      }
    } catch (error) {
      console.error('Error saving exam:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete exam
  const handleDeleteExam = async (examId: string) => {
    if (window.confirm('Are you sure you want to delete this academic exam?')) {
      try {
        const response = await AdminService.deleteExam(examId);
        if (response.success) {
          loadData();
        }
      } catch (error) {
        console.error('Error deleting exam:', error);
      }
    }
  };

// Handle toggle exam status
  const handleToggleExamStatus = async (exam: Exam) => {
    const newStatus = exam.is_active === false ? true : false;
    const action = newStatus ? 'activate' : 'deactivate';

    if (window.confirm(`Are you sure you want to ${action} this exam?`)) {
      try {
        const response = await AdminService.updateExam(exam.id, { is_active: newStatus });
        if (response.success) {
          loadData();
        }
      } catch (error) {
        console.error(`Error ${action} exam:`, error);
      }
    }
  };

// Handle redirect to exam link
  const handleOpenExamLink = (examUrl: string) => {
    if (examUrl) {
      window.open(examUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle edit exam
  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title || '',
      examMonth: exam.exam_month || new Date().getMonth() + 1,
      examYear: exam.exam_year || new Date().getFullYear(),
      subject: exam.subject || '',
      level: exam.level || 0,
      className: exam.class || '',
      examUrl: exam.url || '',
      isActive: exam.is_active !== undefined ? exam.is_active : true,
      pinRequired: exam.require_pin || exam.pin_enabled || false,
      pinPassword: exam.pin_password || '',
      pinDescription: exam.pin_description || ''
    });
    setIsCreateDialogOpen(true);
  };

  // Get status badge
  const getStatusBadge = (exam: Exam) => {
    const isActive = exam.is_active !== undefined ? exam.is_active : true;

    if (!isActive) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6" dir="ltr">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header with Stats */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 md:p-6 mb-6">
          {/* Back Button and Title Section */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/exam-management')}
              className="flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Exam Management
            </Button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                  Manage Academic Exams
                </h1>
                <p className="text-slate-600 mt-1 text-sm md:text-base">
                  Comprehensive exam management for academic subjects
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Academic Exam
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4" dir="ltr">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExam ? 'Edit Academic Exam' : 'Create New Academic Exam'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingExam ? 'Update academic exam information' : 'Create a new academic exam for subjects like Rituals, Doctrine, Theology, etc.'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 1. Exam Title */}
                    <div>
                      <Label htmlFor="title">Exam Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Monthly Rituals Exam"
                        required
                      />
                    </div>

                    {/* 2. Exam Month and Year */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="exam-month">Month *</Label>
                        <Select value={formData.examMonth.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, examMonth: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="exam-year">Year *</Label>
                        <Input
                          id="exam-year"
                          type="number"
                          min="2020"
                          max="2030"
                          value={formData.examYear}
                          onChange={(e) => setFormData(prev => ({ ...prev, examYear: parseInt(e.target.value) }))}
                          placeholder="2024"
                          required
                        />
                      </div>
                    </div>

                    {/* 3. Subject */}
                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      {!isAddingNewSubject ? (
                        <Select value={formData.subject} onValueChange={handleSubjectChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
                            ))}
                            <SelectItem value="__add_new__" className="text-indigo-600 font-medium">
                              + Add New Subject
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="space-y-3 p-3 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50/50">
                          <div>
                            <Label htmlFor="new-subject-name" className="text-sm font-medium">Subject Name *</Label>
                            <Input
                              id="new-subject-name"
                              value={newSubjectName}
                              onChange={(e) => setNewSubjectName(e.target.value)}
                              placeholder="e.g., Advanced Mathematics"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-subject-description" className="text-sm font-medium">Description (Optional)</Label>
                            <Textarea
                              id="new-subject-description"
                              value={newSubjectDescription}
                              onChange={(e) => setNewSubjectDescription(e.target.value)}
                              placeholder="Brief description of the subject"
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              type="button"
                              onClick={handleCreateNewSubject}
                              disabled={isCreatingSubject || !newSubjectName.trim()}
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              {isCreatingSubject ? 'Creating...' : 'Create Subject'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsAddingNewSubject(false);
                                setNewSubjectName('');
                                setNewSubjectDescription('');
                              }}
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Stage and Class (Linked) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="level">Stage *</Label>
                        <Select value={formData.level.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, level: parseInt(value), className: '' }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.level.toString()}>
                                {stage.name_en || stage.name_ar || stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="class">Class *</Label>
                        <Select value={formData.className} onValueChange={(value) => setFormData(prev => ({ ...prev, className: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes
                              .filter(cls => cls.stage_level === formData.level)
                              .map((cls) => (
                                <SelectItem key={cls.id} value={cls.name}>
                                  {cls.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 5. Exam URL */}
                    <div>
                      <Label htmlFor="exam-url">Exam URL *</Label>
                      <Input
                        id="exam-url"
                        type="url"
                        value={formData.examUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, examUrl: e.target.value }))}
                        placeholder="https://forms.google.com/exam"
                        required
                      />
                    </div>

                    {/* 6. Active Status & PIN Required */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <Label htmlFor="pin-required" className="text-sm font-medium">PIN Required</Label>
                        <button
                          type="button"
                          id="pin-required-toggle"
                          onClick={() => setFormData(prev => ({ ...prev, pinRequired: !prev.pinRequired }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.pinRequired
                              ? 'bg-indigo-600 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-2'
                              : 'bg-gray-200 focus:ring-gray-500 focus:ring-2 focus:ring-offset-2'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.pinRequired ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Label htmlFor="is-active" className="text-sm font-medium">Active</Label>
                        <button
                          type="button"
                          id="is-active-toggle"
                          onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.isActive
                              ? 'bg-green-600 focus:ring-green-500 focus:ring-2 focus:ring-offset-2'
                              : 'bg-gray-200 focus:ring-gray-500 focus:ring-2 focus:ring-offset-2'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* PIN Password Section - shown when PIN is required */}
                    {formData.pinRequired && (
                      <div className="pl-6 space-y-4 border-l-2 border-indigo-200">
                        <div>
                          <Label htmlFor="pin-password">Enter PIN *</Label>
                          <div className="relative">
                            <Input
                              id="pin-password"
                              type={showPassword ? "text" : "password"}
                              value={formData.pinPassword}
                              onChange={(e) => setFormData(prev => ({ ...prev, pinPassword: e.target.value }))}
                              placeholder="Enter PIN code"
                              required={formData.pinRequired}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="pin-description">PIN Description</Label>
                          <Textarea
                            id="pin-description"
                            value={formData.pinDescription}
                            onChange={(e) => setFormData(prev => ({ ...prev, pinDescription: e.target.value }))}
                            placeholder="Enter PIN description or instructions"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}

                    <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
                      >
                        {submitting ? 'Saving...' : (editingExam ? 'Update Exam' : 'Create Exam')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="bg-white/40 backdrop-blur-sm border-white/30">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-blue-700 font-medium">Total Exams</p>
                    <p className="text-lg md:text-2xl font-bold text-blue-900 truncate">{exams.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/40 backdrop-blur-sm border-white/30">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-green-700 font-medium">Active</p>
                    <p className="text-lg md:text-2xl font-bold text-green-900 truncate">{exams.filter(e => e.is_active !== false).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/40 backdrop-blur-sm border-white/30">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-purple-700 font-medium">Subjects</p>
                    <p className="text-lg md:text-2xl font-bold text-purple-900 truncate">{new Set(exams.filter(e => e.subject).map(e => e.subject)).size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/40 backdrop-blur-sm border-white/30">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-orange-700 font-medium">Classes</p>
                    <p className="text-lg md:text-2xl font-bold text-orange-900 truncate">{new Set(exams.filter(e => e.class).map(e => e.class)).size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-600 border-gray-200 hover:bg-gray-50 w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-indigo-600 w-full sm:w-auto"
                >
                  {showFilters ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search exams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.name}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Bulk Actions */}
        {selectedExams.length > 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {selectedExams.length} exam{selectedExams.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusChange(true)}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusChange(false)}
                    className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Deactivate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg md:text-xl">Academic Exams Table</CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm text-gray-600 text-center sm:text-left">
                  Showing {paginatedExams.length} of {filteredExams.length} exams
                </span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                  <SelectTrigger className="w-full sm:w-[80px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            {loading ? (
              <div className="text-center py-12 px-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="text-center py-12 px-4">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No academic exams found
                </h3>
                <p className="text-gray-500">
                  Get started by creating your first academic exam.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Table View */}
                <div className="block lg:hidden">
                  <div className="space-y-4 p-4">
                    {paginatedExams.map((exam) => (
                      <div key={exam.id} className="bg-white border rounded-lg p-4 space-y-3">
                        {/* Header with checkbox and title */}
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedExams.includes(exam.id)}
                            onCheckedChange={(checked) => handleSelectExam(exam.id, checked as boolean)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {exam.title || ''}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-indigo-600 border-indigo-200 text-xs">
                                📚 {exam.subject || ''}
                              </Badge>
                              <Badge variant="outline" className="text-gray-600 border-gray-200 text-xs">
                                {exam.class || ''}
                              </Badge>
                              {exam.require_pin || exam.pin_enabled ? (
                                <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
                                  🔒 PIN
                                </Badge>
                              ) : null}
                              <Badge
                                variant={exam.is_active === false ? "secondary" : "default"}
                                className={`text-xs ${exam.is_active === false ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}
                              >
                                {exam.is_active === false ? 'Inactive' : 'Active'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Exam details */}
                        <div className="text-sm text-gray-600 space-y-1 pl-8">
                          <p>📅 {monthOptions.find(m => m.value === exam.exam_month)?.label || exam.exam_month} {exam.exam_year}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 pl-8 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditExam(exam)}
                            className="text-xs h-8 px-3"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleExamStatus(exam)}
                            className={`text-xs h-8 px-3 ${exam.is_active === false ? 'text-green-600 border-green-200 hover:bg-green-50' : 'text-yellow-600 border-yellow-200 hover:bg-yellow-50'}`}
                          >
                            <Power className="w-3 h-3 mr-1" />
                            {exam.is_active === false ? 'Activate' : 'Deactivate'}
                          </Button>
                          {exam.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenExamLink(exam.url)}
                              className="text-xs h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Link className="w-3 h-3 mr-1" />
                              Link
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="text-xs h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedExams.length === paginatedExams.length && paginatedExams.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('title')}
                            className="p-0 h-auto font-semibold text-sm"
                          >
                            Title
                            {sortField === 'title' && (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('subject')}
                            className="p-0 h-auto font-semibold text-sm"
                          >
                            Subject
                            {sortField === 'subject' && (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('className')}
                            className="p-0 h-auto font-semibold text-sm"
                          >
                            Class
                            {sortField === 'className' && (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('examDate')}
                            className="p-0 h-auto font-semibold text-sm"
                          >
                            Period
                            {sortField === 'examDate' && (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Protection</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedExams.map((exam) => (
                        <TableRow key={exam.id} className="hover:bg-white/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedExams.includes(exam.id)}
                              onCheckedChange={(checked) => handleSelectExam(exam.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-gray-900 text-sm">
                              {exam.title || ''}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-indigo-600 border-indigo-200 text-xs">
                              📚 {exam.subject || ''}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{exam.class || ''}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{monthOptions.find(m => m.value === exam.exam_month)?.label || exam.exam_month} {exam.exam_year}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xs">{exam.is_active !== false ? 'Active' : 'Inactive'}</span>
                              {exam.require_pin || exam.pin_enabled ? (
                                <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
                                  🔒 PIN
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditExam(exam)}
                                className="h-8 w-8 p-0"
                                title="Edit Exam"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleExamStatus(exam)}
                                className={`h-8 w-8 p-0 ${exam.is_active === false ? 'text-green-600 border-green-200 hover:bg-green-50' : 'text-yellow-600 border-yellow-200 hover:bg-yellow-50'}`}
                                title={exam.is_active === false ? 'Activate Exam' : 'Deactivate Exam'}
                              >
                                <Power className="w-3 h-3" />
                              </Button>
                              {exam.url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenExamLink(exam.url)}
                                  className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  title="Open Exam Link"
                                >
                                  <Link className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteExam(exam.id)}
                                className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                                title="Delete Exam"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t gap-4 px-4 lg:px-0">
                    <div className="text-sm text-gray-600 text-center sm:text-left">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center justify-center sm:justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, index) => {
                          const page = index + 1;
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 text-sm"
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAcademicExams;