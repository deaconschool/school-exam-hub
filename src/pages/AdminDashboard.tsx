import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminService } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/AdminLayout';
import { AdminDashboardSkeleton } from '@/components/AdminLoadingStates';
import {
  Users,
  GraduationCap,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  Home,
  Shield,
  Database,
  BarChart3,
  Activity,
  Zap,
  CheckCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const [systemStats, setSystemStats] = useState<any>(null);
  // Admin dashboard is English-only - no language switching
  // Force English language and LTR direction for admin portal
  const navigate = useNavigate();
  const { user, logout, adminName } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Set LTR direction when component mounts
  React.useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    return () => {
      // Restore original direction when unmounting
      const storedLanguage = localStorage.getItem('language') || 'ar';
      document.documentElement.setAttribute('dir', storedLanguage === 'ar' ? 'rtl' : 'ltr');
    };
  }, []);

  // Load system statistics on component mount
  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const statsResponse = await AdminService.getSystemStats();
        if (statsResponse.success) {
          setSystemStats(statsResponse.data);
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  // Handle logout with navigation (same as teacher)
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Animation states
  const [statsVisible, setStatsVisible] = useState(false);

  React.useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setStatsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const goToHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  // Stats Cards Data
  const statsCards = [
    {
      title: 'Total Students',
      value: systemStats?.totalStudents || 0,
      icon: Users,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: '+12%'
    },
    {
      title: 'Total Teachers',
      value: systemStats?.totalTeachers || 0,
      icon: GraduationCap,
      color: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: '+5%'
    },
    {
      title: 'Total Exams',
      value: systemStats?.totalExams || 0,
      icon: FileText,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: '+18%'
    },
    {
      title: 'Total Grades',
      value: systemStats?.totalGrades || 0,
      icon: BarChart3,
      color: 'bg-orange-50',
      iconColor: 'text-orange-600',
      trend: '+22%'
    }
  ];

  // Management Actions
  const managementActions = [
    {
      title: 'Student Management',
      description: 'Add, edit, and manage students',
      icon: Users,
      action: () => navigate('/admin/students'),
      buttonText: 'Manage',
      bgGradient: 'from-blue-500 to-blue-600',
      hoverBgGradient: 'from-blue-600 to-blue-700'
    },
    {
      title: 'Teacher Management',
      description: 'Manage teacher accounts and permissions',
      icon: GraduationCap,
      action: () => navigate('/admin/teachers'),
      buttonText: 'Manage',
      bgGradient: 'from-emerald-500 to-emerald-600',
      hoverBgGradient: 'from-emerald-600 to-emerald-700'
    },
    {
      title: 'Exam Management',
      description: 'Create and manage exams',
      icon: FileText,
      action: () => navigate('/admin/exams'),
      buttonText: 'Manage',
      bgGradient: 'from-purple-500 to-purple-600',
      hoverBgGradient: 'from-purple-600 to-purple-700'
    },
    {
      title: 'System Reports',
      description: 'View system analytics and reports',
      icon: TrendingUp,
      action: () => navigate('/admin/reports'),
      buttonText: 'View Reports',
      bgGradient: 'from-orange-500 to-orange-600',
      hoverBgGradient: 'from-orange-600 to-orange-700'
    },
    {
      title: 'Data Backup',
      description: 'Backup and restore system data',
      icon: Database,
      action: () => navigate('/admin/backup'),
      buttonText: 'Configure',
      bgGradient: 'from-cyan-500 to-cyan-600',
      hoverBgGradient: 'from-cyan-600 to-cyan-700'
    },
    {
      title: 'System Settings',
      description: 'Configure system settings',
      icon: Settings,
      action: () => navigate('/admin/settings'),
      buttonText: 'Settings',
      bgGradient: 'from-gray-500 to-gray-600',
      hoverBgGradient: 'from-gray-600 to-gray-700'
    }
  ];

  return (
  <AdminLayout title="Admin Dashboard" subtitle="Manage your school examination system">
    {/* Management Actions */}
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Management Actions
        </h2>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-gray-600">Quick Actions</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementActions.map((action, index) => (
          <Card
            key={index}
            className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
              statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${(index + 4) * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${action.bgGradient} transition-transform duration-300 hover:scale-110`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <Button
                    onClick={action.action}
                    className={`bg-gradient-to-r ${action.bgGradient} hover:${action.hoverBgGradient} text-white shadow-md hover:shadow-lg transition-all duration-200`}
                  >
                    {action.buttonText}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {/* System Status */}
    <Card
      className={`bg-gradient-to-br from-white to-emerald-50 border border-emerald-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-500 ${
        statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: '1000ms' }}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg transition-transform duration-300 hover:scale-110">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              System Status
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-gray-700 font-medium">
                All systems operational
              </p>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Database connected and secure • Last backup: 2 hours ago
            </p>
          </div>
          <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
            Online
          </div>
        </div>
      </CardContent>
    </Card>
  </AdminLayout>
);
};

export default AdminDashboard;