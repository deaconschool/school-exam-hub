import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminService } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  ArrowLeft,
  Edit,
  Trash2,
  Key,
  UserCheck,
  UserX,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

const AdminTeacherList = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  // Set LTR direction when component mounts
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    return () => {
      // Restore original direction when unmounting
      const storedLanguage = localStorage.getItem('language') || 'ar';
      document.documentElement.setAttribute('dir', storedLanguage === 'ar' ? 'rtl' : 'ltr');
    };
  }, []);

  // Load teachers on component mount and when filters change
  useEffect(() => {
    loadTeachers();
  }, [currentPage, statusFilter, searchTerm]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadTeachers();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadTeachers = async () => {
    try {
      setIsLoading(true);

      const filters = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active'
      };

      const response = await AdminService.getAllTeachers(filters);

      if (response.success && response.data) {
        setTeachers(response.data.teachers);
        setTotalTeachers(response.data.total);
        setTotalPages(Math.ceil(response.data.total / 10));
      } else {
        setTeachers([]);
      }
    } catch (error) {
      setTeachers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTeacher = (teacherId: string) => {
    navigate(`/admin/teachers/edit/${teacherId}`);
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      setIsPerformingAction(true);
      const response = await AdminService.deleteTeacher(teacherId);

      if (response.success) {
        await loadTeachers(); // Refresh the list
      } else {
        alert(`Failed to delete teacher: ${response.error}`);
      }
    } catch (error) {
      alert('Failed to delete teacher. Please try again.');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleToggleStatus = async (teacherId: string, currentStatus: boolean) => {
    try {
      setIsPerformingAction(true);
      const response = currentStatus
        ? await AdminService.deactivateTeacher(teacherId)
        : await AdminService.activateTeacher(teacherId);

      if (response.success) {
        await loadTeachers(); // Refresh the list
      } else {
        alert(`Failed to update teacher status: ${response.error}`);
      }
    } catch (error) {
      alert('Failed to update teacher status. Please try again.');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleResetPassword = async (teacherId: string) => {
    const newPassword = prompt('Enter new password for the teacher (min 4 characters):');
    if (!newPassword) return;

    // Basic password validation
    if (newPassword.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }

    try {
      setIsPerformingAction(true);
      const response = await AdminService.resetTeacherPassword(teacherId, newPassword);

      if (response.success) {
        alert('Password reset successfully!');
      } else {
        alert(`Failed to reset password: ${response.error}`);
      }
    } catch (error) {
      alert('Failed to reset password. Please try again.');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/admin/teachers')}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Teacher Management
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">
                All Teachers
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {totalTeachers} Total
              </Badge>
            </div>
            <Button
              onClick={() => navigate('/admin/teachers/add')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Teacher
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search teachers by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  All
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                  className="flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('inactive')}
                  className="flex items-center gap-2"
                >
                  <UserX className="w-4 h-4" />
                  Inactive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teachers List */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading teachers...</p>
                </div>
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first teacher'}
                </p>
                <Button
                  onClick={() => navigate('/admin/teachers/add')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Teacher
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Teacher ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Phone</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Created</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher, index) => (
                      <tr
                        key={teacher.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {teacher.id}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{teacher.name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {teacher.phone || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={teacher.is_active ? 'default' : 'secondary'}
                            className={
                              teacher.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }
                          >
                            {teacher.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(teacher.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Edit */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTeacher(teacher.id)}
                              disabled={isPerformingAction}
                              className="h-8 w-8 p-0"
                              title="Edit teacher"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            {/* Toggle Status */}
                            <Button
                              size="sm"
                              variant={teacher.is_active ? "outline" : "default"}
                              onClick={() => handleToggleStatus(teacher.id, teacher.is_active)}
                              disabled={isPerformingAction}
                              className={`h-8 w-8 p-0 ${
                                teacher.is_active
                                  ? 'text-orange-600 border-orange-600 hover:bg-orange-50'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                              title={teacher.is_active ? 'Deactivate teacher' : 'Activate teacher'}
                            >
                              {teacher.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </Button>

                            {/* Reset Password */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetPassword(teacher.id)}
                              disabled={isPerformingAction}
                              className="h-8 w-8 p-0 text-blue-600 border-blue-600 hover:bg-blue-50"
                              title="Reset password"
                            >
                              <Key className="w-4 h-4" />
                            </Button>

                            {/* Delete */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isPerformingAction}
                                  className="h-8 w-8 p-0 text-red-600 border-red-600 hover:bg-red-50"
                                  title="Delete teacher"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete teacher "{teacher.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTeacher(teacher.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalTeachers)} of {totalTeachers} teachers
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={isLoading}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminTeacherList;