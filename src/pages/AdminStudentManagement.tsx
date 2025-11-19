import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminService } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminStudentList from '@/components/AdminStudentList';
import AdminLayout from '@/components/AdminLayout';
import { StudentListSkeleton } from '@/components/AdminLoadingStates';
import {
  Users,
  Plus,
  Upload,
  Download,
  Search,
  Settings,
  ArrowLeft,
  UserPlus,
  FileSpreadsheet,
  Filter
} from 'lucide-react';

const AdminStudentManagement = () => {
  const [studentStats, setStudentStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statsVisible, setStatsVisible] = useState(false);
  const navigate = useNavigate();
  const { action } = useParams();
  const { user, logout, adminName } = useAuth();

  // Set LTR direction when component mounts
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    return () => {
      // Restore original direction when unmounting
      const storedLanguage = localStorage.getItem('language') || 'ar';
      document.documentElement.setAttribute('dir', storedLanguage === 'ar' ? 'rtl' : 'ltr');
    };
  }, []);

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setStatsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load student statistics on component mount
  useEffect(() => {
    const loadStudentStats = async () => {
      try {
        const statsResponse = await AdminService.getStudentStats();
        if (statsResponse.success) {
          setStudentStats(statsResponse.data);
        }
      } catch (error) {
        console.error('Error loading student stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const goToDashboard = () => {
    navigate('/admin/dashboard');
  };

  if (isLoading) {
    return <StudentListSkeleton />;
  }

  // Statistics Cards
  const statsCards = [
    {
      title: 'Total Students',
      value: studentStats?.totalStudents || 0,
      icon: Users
    },
    {
      title: 'Active Classes',
      value: studentStats?.activeClasses || 0,
      icon: Settings
    },
    {
      title: 'Students This Month',
      value: studentStats?.newThisMonth || 0,
      icon: UserPlus
    },
    {
      title: 'Classes with Students',
      value: studentStats?.classesWithStudents || 0,
      icon: FileSpreadsheet
    }
  ];

  // Management Actions
  const managementActions = [
    {
      title: 'View All Students',
      description: 'Search, filter, and manage all students with bulk operations',
      icon: Search,
      action: () => navigate('/admin/students/list'),
      buttonText: 'View Students'
    },
    {
      title: 'Add Single Student',
      description: 'Create a new individual student record',
      icon: Plus,
      action: () => navigate('/admin/students/add'),
      buttonText: 'Add Student'
    },
    {
      title: 'Class Management',
      description: 'Manage classes and assignments',
      icon: Settings,
      action: () => navigate('/admin/classes'),
      buttonText: 'Manage Classes'
    }
  ];

  // Handle different actions
  if (action === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate('/admin/students')}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Student Management
                </Button>
                <h1 className="text-2xl font-bold text-gray-800">
                  All Students
                </h1>
              </div>
              <Button
                onClick={handleLogout}
                size="sm"
                variant="outline"
                className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 py-8">
          <AdminStudentList />
        </main>
      </div>
    );
  }

  // Redirect all other actions to the form component
  if (action) {
    const Element = () => {
      const [Component, setComponent] = useState(null);

      React.useEffect(() => {
        import('@/components/AdminStudentForm').then(module => {
          setComponent(() => module.default);
        });
      }, []);

      if (!Component) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        );
      }

      return <Component />;
    };

    return <Element />;
  }

  return (
  <AdminLayout title="Student Management" subtitle="Manage student records, classes, and academic information">
    {/* Statistics Cards */}
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const colors = [
            { bg: 'bg-blue-50', iconColor: 'text-blue-600', trend: '+12%' },
            { bg: 'bg-emerald-50', iconColor: 'text-emerald-600', trend: '+8%' },
            { bg: 'bg-purple-50', iconColor: 'text-purple-600', trend: '+15%' },
            { bg: 'bg-orange-50', iconColor: 'text-orange-600', trend: '+22%' }
          ];
          const color = colors[index % colors.length];
          return (
            <Card
              key={index}
              className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1 ${color.bg} ${
                statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{stat.title}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        {color.trend}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    </div>
                  </div>
                  <div className={`p-3 ${color.bg} rounded-full transition-transform duration-300 hover:scale-110`}>
                    <stat.icon className={`w-6 h-6 ${color.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>

    {/* Management Actions */}
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Student Management Actions
        </h2>
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-600">Quick Actions</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementActions.map((action, index) => {
          const gradients = [
            'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
            'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
            'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
            'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
            'from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700',
            'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
          ];
          const gradient = gradients[index % gradients.length];
          return (
            <Card
              key={index}
              className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${(index + 4) * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} transition-transform duration-300 hover:scale-110`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                    <Button
                      onClick={action.action}
                      className={`bg-gradient-to-r ${gradient} text-white shadow-md hover:shadow-lg transition-all duration-200`}
                    >
                      {action.buttonText}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>

    {/* Quick Summary */}
    <Card
      className={`bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-500 ${
        statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: '1000ms' }}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Quick Summary
          </h3>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-600 font-medium">Live Data</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-2">Total Enrolled</p>
            <p className="text-3xl font-bold text-blue-600">{studentStats?.totalStudents || 0}</p>
            <div className="flex items-center justify-center gap-1 text-xs text-green-600 mt-3">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              +12% this month
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="p-3 bg-emerald-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Settings className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-600 mb-2">Active Classes</p>
            <p className="text-3xl font-bold text-emerald-600">{studentStats?.activeClasses || 0}</p>
            <div className="flex items-center justify-center gap-1 text-xs text-green-600 mt-3">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              +8% this month
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-2">New This Month</p>
            <p className="text-3xl font-bold text-purple-600">{studentStats?.newThisMonth || 0}</p>
            <div className="flex items-center justify-center gap-1 text-xs text-green-600 mt-3">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              New registrations
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </AdminLayout>
);
};

export default AdminStudentManagement;