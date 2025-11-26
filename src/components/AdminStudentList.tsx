import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '@/services/adminService';
import { SupabaseService } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ExcelImport from '@/components/ExcelImport';
import ExcelExport from '@/components/ExcelExport';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Users,
  User,
  AlertCircle,
  CheckSquare,
  Square,
  RotateCcw
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import AdminStudentDeleteDialog from './AdminStudentDeleteDialog';

interface AdminStudent {
  id: string;
  code: string;
  name: string;
  class_name?: string;
  stage_name?: string;
  level?: string;
  created_at?: string;
  is_active?: boolean;
}

interface StudentListProps {
  onStudentSelect?: (student: AdminStudent) => void;
  onStudentEdit?: (student: AdminStudent) => void;
  onStudentDelete?: (student: AdminStudent) => void;
}

const AdminStudentList = ({
  onStudentSelect,
  onStudentEdit,
  onStudentDelete
}: StudentListProps) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<AdminStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [loadingStages, setLoadingStages] = useState(true);
  const [stages, setStages] = useState<Array<{ name: string; level: number }>>([]);
  const [stageClasses, setStageClasses] = useState<string[]>([]);
  const [allClasses, setAllClasses] = useState<string[]>([]);
  const [stageClassesMap, setStageClassesMap] = useState<Record<string, string[]>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<AdminStudent | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Bulk selection state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkClass, setBulkClass] = useState('');
  const [bulkStage, setBulkStage] = useState('');
  const [bulkStageClasses, setBulkStageClasses] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const itemsPerPage = 20;

  // Force LTR direction permanently for admin pages - never restore RTL
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');

    // Also ensure it stays LTR even if other components try to change it
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'dir') {
          const currentDir = document.documentElement.getAttribute('dir');
          if (currentDir !== 'ltr') {
            document.documentElement.setAttribute('dir', 'ltr');
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load stages and classes for filters
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Load students on component mount and when page changes
  useEffect(() => {
    // Always load students on component mount, even without search
    loadStudents();
  }, []);

  // Load students when page changes (only if search has been triggered)
  useEffect(() => {
    if (hasSearched) {
      loadStudents();
    }
  }, [currentPage]);

  // Apply search functionality
  const handleSearch = () => {
    setHasSearched(true);
    setCurrentPage(1);
    loadStudents();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStage('');
    setSelectedClass('');
    setHasSearched(false);
    setStudents([]);
    setFilteredStudents([]);
    setCurrentPage(1);
    setTotalCount(0);
    setError('');
  };

  const loadFilterOptions = async () => {
    try {
      setLoadingStages(true);
      const response = await SupabaseService.getStagesAndClasses();

      if (response.success && response.data) {
        setStages(response.data.stages);
        setAllClasses(response.data.allClasses);
        setStageClassesMap(response.data.stageClasses);
      } else {
        // Fallback to empty arrays
        setStages([]);
        setAllClasses([]);
        setStageClassesMap({});
      }
    } catch (error) {
      // Fallback to empty arrays
      setStages([]);
      setAllClasses([]);
      setStageClassesMap({});
    } finally {
      setLoadingStages(false);
    }
  };

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      setError('');

      const filters: any = {
        page: currentPage,
        limit: itemsPerPage
      };

      // Filter priority: Class > Stage > Search
      let appliedFilters = [];

      // Priority 1: Class filter (highest priority)
      if (selectedClass) {
        filters.class_id = selectedClass;
        appliedFilters.push(`Class: ${selectedClass}`);
      }
      // Priority 2: Stage filter (only if no class filter)
      else if (selectedStage) {
        // Stage filter will be applied locally since backend doesn't support it
        appliedFilters.push(`Stage: ${selectedStage}`);
      }
      // Priority 3: Search filter (only if no class or stage filter)
      else if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
        appliedFilters.push(`Search: ${searchTerm.trim()}`);
      }

      const response = await AdminService.getAllStudents(filters);

      if (response.success) {
        let students = response.data.students || [];

        // Apply stage filter locally if needed (and no class filter was applied)
        if (selectedStage && !selectedClass) {
          students = students.filter(student =>
            student.stage_name === selectedStage
          );
        }

        // Apply search filter locally if both class and stage are not selected
        if (searchTerm.trim() && !selectedClass && !selectedStage) {
          const searchLower = searchTerm.toLowerCase();
          students = students.filter(student =>
            student.name.toLowerCase().includes(searchLower) ||
            student.code.toLowerCase().includes(searchLower)
          );
        }

        setStudents(students);
        setFilteredStudents(students);
        setTotalCount(response.data.total || 0);
        setTotalPages(Math.ceil(response.data.total / itemsPerPage));
      } else {
        setError(response.error || 'Failed to load students');
        setStudents([]);
        setFilteredStudents([]);
      }
    } catch (error) {
      setError('Error loading students');
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageChange = (stageName: string) => {
    setSelectedStage(stageName === 'all' ? '' : stageName);
    setSelectedClass(''); // Reset class when stage changes

    // Load classes for selected stage
    if (stageName && stageName !== 'all') {
      const classes = stageClassesMap[stageName] || [];
      setStageClasses(classes);
    } else {
      setStageClasses([]);
    }
  };

  const handleBulkStageChange = (stageName: string) => {
    setBulkStage(stageName);
    setBulkClass(''); // Reset class when stage changes

    // Load classes for selected stage
    if (stageName && stageName !== 'no_change') {
      const classes = stageClassesMap[stageName] || [];
      setBulkStageClasses(classes);
    } else {
      setBulkStageClasses([]);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleClassFilter = (className: string) => {
    setSelectedClass(className === 'all' ? '' : className);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddStudent = () => {
    navigate('/admin/students/add');
  };

  const handleEditStudent = (student: AdminStudent) => {
    navigate(`/admin/students/edit/${student.id}`);
  };

  const handleViewStudent = (student: AdminStudent) => {
    navigate(`/admin/students/view/${student.id}`);
  };

  const handleDeleteStudent = (student: AdminStudent) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
    if (onStudentDelete) {
      onStudentDelete(student);
    }
  };

  const handleDeleteConfirm = () => {
    // Reload students after successful deletion
    loadStudents();
  };

  const handleImportSuccess = () => {
    // Reload students after successful import
    loadStudents();
    setImportDialogOpen(false);
  };

  const handleExportSuccess = () => {
    // Close export dialog after successful export
    setExportDialogOpen(false);
  };

  // Bulk selection functions
  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    if (!isBulkMode) {
      setSelectedStudentIds([]);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAllStudentsSelection = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(student => student.id));
    }
  };

  const clearAllSelections = () => {
    setSelectedStudentIds([]);
    setBulkClass('');
    setBulkStage('');
  };

  const handleBulkUpdate = async () => {
    if (selectedStudentIds.length === 0) return;

    const updates: any = {};
    if (bulkClass && bulkClass !== 'no_change') {
      updates.class = bulkClass;
    }
    if (bulkStage && bulkStage !== 'no_change') {
      updates.stage = bulkStage;
      // Also update the level based on the stage
      const selectedStageData = stages.find(s =>
        s.name === bulkStage
      );
      if (selectedStageData) {
        updates.level = (selectedStageData.level || 0) + 1;
      }
    }

    if (Object.keys(updates).length === 0) {
      setError('Please select a class or stage to update');
      return;
    }

    setIsBulkUpdating(true);
    try {
      const response = await AdminService.bulkUpdateStudents(selectedStudentIds, updates);
      if (response.success) {
        // Reload students to show updated data
        await loadStudents();
        clearAllSelections();
        setError('');
      } else {
        setError(response.error || 'Failed to update students');
      }
    } catch (error) {
      setError('Error updating students');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const getStatusBadge = (isActive?: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            Student Management
            <Badge variant="outline" className="ml-2 border-blue-300 text-blue-700 bg-blue-50">
              {totalCount} Total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4 mb-6">
            {/* Search Input Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search Students</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search by name or code..."
                    value={searchTerm}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="lg:col-span-2 flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
                <Button
                  onClick={handleSearch}
                  disabled={!searchTerm.trim() && !selectedStage && !selectedClass}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  className="flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 text-sm sm:text-base"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            </div>

            {/* Filter Options Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stage Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Stage</Label>
                <Select value={selectedStage || 'all'} onValueChange={handleStageChange} disabled={loadingStages}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder={loadingStages ? "Loading..." : "All Stages"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {stages.map((stage) => (
                      <SelectItem key={stage.name} value={stage.name}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Class Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Class</Label>
                <Select value={selectedClass || 'all'} onValueChange={handleClassFilter} disabled={loadingStages}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder={loadingStages ? "Loading..." : "All Classes"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {(selectedStage ? stageClasses : allClasses).map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={handleAddStudent}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Student</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-sm sm:text-base"
            >
              <Upload className="w-4 h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Import</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(true)}
              className="border-purple-300 text-purple-700 hover:bg-purple-50 text-sm sm:text-base"
            >
              <Download className="w-4 h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button
              variant={isBulkMode ? "default" : "outline"}
              onClick={toggleBulkMode}
              className={isBulkMode
                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
                : "border-blue-300 text-blue-700 hover:bg-blue-50 text-sm sm:text-base"
              }
            >
              {isBulkMode ? (
                <>
                  <CheckSquare className="w-4 h-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Exit Bulk</span>
                  <span className="sm:hidden">Exit</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Bulk Select</span>
                  <span className="sm:hidden">Select</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-700">
              <div className="p-2 bg-red-200 rounded-full">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Controls */}
      {isBulkMode && (
        <Card className="mb-4 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="text-sm font-medium text-blue-800">
                    {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearAllSelections}
                    className="text-blue-600 border-blue-200 hover:bg-blue-200 text-xs sm:text-sm"
                  >
                    <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Clear</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleBulkMode}
                  className="text-blue-600 hover:bg-blue-200 text-xs sm:text-sm"
                >
                  Exit Bulk
                </Button>
              </div>

              {selectedStudentIds.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label htmlFor="bulkStage" className="text-sm font-medium text-blue-800 whitespace-nowrap">Stage:</Label>
                      <Select value={bulkStage} onValueChange={handleBulkStageChange}>
                        <SelectTrigger className="w-full sm:w-40 h-9 text-xs sm:text-sm">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no_change">No change</SelectItem>
                          {stages.map(stage => (
                            <SelectItem key={stage.name} value={stage.name}>
                              {stage.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label htmlFor="bulkClass" className="text-sm font-medium text-blue-800 whitespace-nowrap">Class:</Label>
                      <Select value={bulkClass} onValueChange={setBulkClass}>
                        <SelectTrigger className="w-full sm:w-40 h-9 text-xs sm:text-sm">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no_change">No change</SelectItem>
                          {(bulkStage && bulkStage !== 'no_change' ? bulkStageClasses : allClasses).map(className => (
                            <SelectItem key={className} value={className}>
                              {className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleBulkUpdate}
                    disabled={isBulkUpdating || (!bulkClass || bulkClass === 'no_change') && (!bulkStage || bulkStage === 'no_change')}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                  >
                    {isBulkUpdating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <CheckSquare className="w-4 h-4 mr-2" />
                    )}
                    Update {selectedStudentIds.length} Student{selectedStudentIds.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Table */}
      <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHead className={`font-semibold text-gray-700 text-center ${isBulkMode ? 'w-12 min-w-[48px]' : 'w-0'}`}>
                    {isBulkMode && (
                      <Checkbox
                        checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                        onCheckedChange={toggleAllStudentsSelection}
                        aria-label="Select all students"
                      />
                    )}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center w-16 min-w-[64px]">#</TableHead>
                  <TableHead className="font-semibold text-gray-700 min-w-[100px]">Code</TableHead>
                  <TableHead className="font-semibold text-gray-700 min-w-[150px]">Name</TableHead>
                  <TableHead className="font-semibold text-gray-700 min-w-[120px] hidden md:table-cell">Stage</TableHead>
                  <TableHead className="font-semibold text-gray-700 min-w-[120px] hidden md:table-cell">Class</TableHead>
                  <TableHead className="font-semibold text-gray-700 min-w-[80px]">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700 min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isBulkMode ? 8 : 7} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {searchTerm ? 'No students found matching your search' : 'No students found'}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {searchTerm ? 'Try adjusting your search terms' : 'Import students to get started'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => (
                  <TableRow key={student.id} className={`hover:bg-blue-50/50 transition-colors duration-150 border-b border-slate-100 ${isBulkMode && selectedStudentIds.includes(student.id) ? 'bg-blue-100' : ''}`}>
                    <TableCell className={`text-center ${isBulkMode ? 'w-12' : 'w-0 p-0'}`}>
                      {isBulkMode && (
                        <Checkbox
                          checked={selectedStudentIds.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                          aria-label={`Select ${student.name}`}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm font-medium text-center w-16 min-w-[64px]">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900 min-w-[100px]">{student.code}</TableCell>
                    <TableCell className="text-gray-800 min-w-[150px]">{student.name}</TableCell>
                    <TableCell className="text-gray-600 hidden md:table-cell min-w-[120px]">{student.stage_name || '-'}</TableCell>
                    <TableCell className="text-gray-600 hidden md:table-cell min-w-[120px]">{student.class_name || '-'}</TableCell>
                    <TableCell className="min-w-[80px]">{getStatusBadge(student.is_active)}</TableCell>
                    <TableCell className="text-right min-w-[120px]">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewStudent(student)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-150 p-1 sm:p-2"
                          title="View"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStudent(student)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors duration-150 p-1 sm:p-2"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteStudent(student)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-150 p-1 sm:p-2"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
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
      {totalPages > 1 && (
        <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Showing {filteredStudents.length}</span> of{' '}
                <span className="font-medium">{totalCount}</span> students
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={
                          currentPage === page
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                            : 'border-gray-200 hover:bg-gray-50'
                        }
                      >
                        {page}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-gray-500 px-2">...</span>
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        className={
                          currentPage === totalPages
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                            : 'border-gray-200 hover:bg-gray-50'
                        }
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {studentToDelete && (
        <AdminStudentDeleteDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          student={studentToDelete}
        />
      )}

      {/* Excel Import Dialog - Note: This component needs to be adapted for dialog usage */}
      {importDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Bulk Import Students from Excel</h2>
                <Button
                  variant="outline"
                  onClick={() => setImportDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
              <ExcelImport onImportComplete={handleImportSuccess} />
            </div>
          </div>
        </div>
      )}

      {/* Excel Export Dialog - Note: This component needs to be adapted for dialog usage */}
      {exportDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Export Students to Excel</h2>
                <Button
                  variant="outline"
                  onClick={() => setExportDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
              <ExcelExport />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentList;