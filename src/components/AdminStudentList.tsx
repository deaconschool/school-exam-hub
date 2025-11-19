import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '@/services/adminService';
import { Stage, stagesData } from '@/data/stages';
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
  AlertCircle
} from 'lucide-react';
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
  const [stages] = useState<Stage[]>(stagesData);
  const [stageClasses, setStageClasses] = useState<string[]>([]);
  const [allClasses] = useState<string[]>(stagesData.flatMap(stage => stage.classes));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<AdminStudent | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const itemsPerPage = 20;

  // Set LTR direction when component mounts
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    return () => {
      // Restore original direction when unmounting
      const storedLanguage = localStorage.getItem('language') || 'ar';
      document.documentElement.setAttribute('dir', storedLanguage === 'ar' ? 'rtl' : 'ltr');
    };
  }, []);

  // Load stages and classes for filters
  useEffect(() => {
    loadFilterOptions();
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
      // Stages and classes are loaded from local data - no API calls needed
      console.log('Stages and classes loaded from local data');
    } catch (error) {
      console.error('Error loading filter options:', error);
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
      console.error('Error loading students:', error);
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
      const stage = stages.find(s =>
        s.name_en === stageName || s.name_ar === stageName
      );
      if (stage) {
        setStageClasses(stage.classes);
      }
    } else {
      setStageClasses([]);
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
              <div className="lg:col-span-2 flex items-end gap-3">
                <Button
                  onClick={handleSearch}
                  disabled={!searchTerm.trim() && !selectedStage && !selectedClass}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="w-4 h-4" />
                  Search
                </Button>
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Filter Options Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stage Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Stage</Label>
                <Select value={selectedStage || 'all'} onValueChange={handleStageChange}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {stages.map((stage) => (
                      <SelectItem key={stage.name_en} value={stage.name_en}>
                        {stage.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Class Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Class</Label>
                <Select value={selectedClass || 'all'} onValueChange={handleClassFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder="All Classes" />
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
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleAddStudent}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Single Student
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import (Excel)
            </Button>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(true)}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Bulk Export (Excel)
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

      {/* Student Table */}
      <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="font-semibold text-gray-700 w-16 text-center">#</TableHead>
                <TableHead className="font-semibold text-gray-700 w-32">Code</TableHead>
                <TableHead className="font-semibold text-gray-700 w-64">Name</TableHead>
                <TableHead className="font-semibold text-gray-700 w-48">Stage</TableHead>
                <TableHead className="font-semibold text-gray-700 w-48">Class</TableHead>
                <TableHead className="font-semibold text-gray-700 w-32">Status</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
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
                  <TableRow key={student.id} className="hover:bg-blue-50/50 transition-colors duration-150 border-b border-slate-100">
                    <TableCell className="text-gray-600 text-sm font-medium text-center w-16">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900 w-32">{student.code}</TableCell>
                    <TableCell className="text-gray-800 w-64">{student.name}</TableCell>
                    <TableCell className="text-gray-600 w-48">{student.stage_name || '-'}</TableCell>
                    <TableCell className="text-gray-600 w-48">{student.class_name || '-'}</TableCell>
                    <TableCell className="w-32">{getStatusBadge(student.is_active)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewStudent(student)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-150"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStudent(student)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors duration-150"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteStudent(student)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-150"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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