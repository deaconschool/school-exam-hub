import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import {
  Home,
  Users,
  GraduationCap,
  FileText,
  TrendingUp,
  Database,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  BarChart3,
  Shield,
  BookOpen,
  School
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: string;
  children?: NavItem[];
}

interface AdminSidebarProps {
  isMobileSidebarOpen?: boolean;
  onMobileSidebarClose?: () => void;
}

const AdminSidebar = ({ isMobileSidebarOpen = false, onMobileSidebarClose }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, adminName } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['students']);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/admin/dashboard'
    },
    {
      id: 'students',
      label: 'Student Management',
      icon: Users,
      badge: 'Core',
      children: [
        {
          id: 'students-overview',
          label: 'Overview',
          icon: Users,
          path: '/admin/students'
        },
        {
          id: 'students-list',
          label: 'All Students',
          icon: Users,
          path: '/admin/students/list'
        },
        {
          id: 'students-add',
          label: 'Add Student',
          icon: Users,
          path: '/admin/students/add'
        },
        {
          id: 'students-import',
          label: 'Import Excel',
          icon: Database,
          path: '/admin/students/import'
        },
        {
          id: 'students-export',
          label: 'Export Results',
          icon: Database,
          path: '/admin/students/export'
        }
      ]
    },
    {
      id: 'teachers',
      label: 'Teacher Management',
      icon: GraduationCap,
      children: [
        {
          id: 'teachers-overview',
          label: 'Overview',
          icon: GraduationCap,
          path: '/admin/teachers'
        },
        {
          id: 'teachers-list',
          label: 'All Teachers',
          icon: GraduationCap,
          path: '/admin/teachers/list'
        },
        {
          id: 'teachers-add',
          label: 'Add Teacher',
          icon: GraduationCap,
          path: '/admin/teachers/add'
        }
      ]
    },
    {
      id: 'academic',
      label: 'Academic Structure',
      icon: School,
      children: [
        {
          id: 'stages',
          label: 'Stages',
          icon: School,
          path: '/admin/stages'
        },
        {
          id: 'classes',
          label: 'Classes',
          icon: School,
          path: '/admin/classes'
        },
        {
          id: 'subjects',
          label: 'Subjects',
          icon: BookOpen,
          path: '/admin/subjects'
        }
      ]
    },
    {
      id: 'exams',
      label: 'Exam Management',
      icon: FileText,
      children: [
        {
          id: 'exams-overview',
          label: 'Overview',
          icon: FileText,
          path: '/admin/exams'
        },
        {
          id: 'exams-create',
          label: 'Create Exam',
          icon: FileText,
          path: '/admin/exams/create'
        },
        {
          id: 'exams-settings',
          label: 'Exam Settings',
          icon: Settings,
          path: '/admin/exams/settings'
        }
      ]
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: TrendingUp,
      children: [
        {
          id: 'system-reports',
          label: 'System Reports',
          icon: BarChart3,
          path: '/admin/reports'
        },
        {
          id: 'student-reports',
          label: 'Student Performance',
          icon: TrendingUp,
          path: '/admin/reports/students'
        },
        {
          id: 'exam-reports',
          label: 'Exam Analytics',
          icon: FileText,
          path: '/admin/reports/exams'
        }
      ]
    },
    {
      id: 'backup',
      label: 'Data Management',
      icon: Database,
      children: [
        {
          id: 'backup-restore',
          label: 'Backup & Restore',
          icon: Database,
          path: '/admin/backup'
        },
        {
          id: 'data-export',
          label: 'Export Data',
          icon: Database,
          path: '/admin/export'
        }
      ]
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      children: [
        {
          id: 'general-settings',
          label: 'General Settings',
          icon: Settings,
          path: '/admin/settings'
        },
        {
          id: 'security-settings',
          label: 'Security',
          icon: Shield,
          path: '/admin/security'
        }
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSidebarToggle = () => {
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    if (isMobile) {
      // On mobile, close the sidebar completely (always expanded when open)
      onMobileSidebarClose?.();
    } else {
      // On desktop, toggle collapse state
      setIsCollapsed(!isCollapsed);
    }
  };

  const getToggleIcon = () => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      // On mobile, always show X when sidebar is open
      return <X className="w-4 h-4" />;
    } else {
      // On desktop, show Menu when collapsed, X when expanded
      return isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />;
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isParentActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some(child => isActive(child.path));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogoutClick = () => {
    const isDesktop = window.innerWidth >= 1024;
    if (isDesktop && isCollapsed) {
      setIsCollapsed(false);
    }
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    handleLogout();
  };

  const cancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      onMobileSidebarClose?.();
    }
  };

  return (
    <>
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-screen ${
        // Mobile behavior - always expanded when open
        'fixed inset-y-0 left-0 z-50 w-80 -translate-x-full ' +
        (isMobileSidebarOpen ? 'translate-x-0 ' : '') +
        // Desktop behavior
        'lg:relative lg:inset-y-0 lg:inset-x-0 lg:translate-x-0 ' +
        (isCollapsed ? 'lg:w-20' : 'lg:w-80')
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Always show header content on mobile when sidebar is open */}
            {(!isCollapsed || isMobileSidebarOpen) && (
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Portal</h2>
                <p className="text-sm text-gray-500 hidden lg:block">Welcome, {adminName}</p>
                <p className="text-xs text-gray-500 lg:hidden">{adminName?.split(' ')[0]}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSidebarToggle}
              className="p-2 hover:bg-gray-100 flex-shrink-0"
            >
              {getToggleIcon()}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          <div className="space-y-1 px-3">
            {navItems.map((item) => (
              <div key={item.id}>
                {item.children ? (
                  // Parent item with children
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const isDesktop = window.innerWidth >= 1024;
                        if (isDesktop && isCollapsed) {
                          // Auto-expand sidebar on desktop when collapsed
                          setIsCollapsed(false);
                        }
                        toggleSection(item.id);
                      }}
                      className={`w-full justify-between h-auto p-3 rounded-lg transition-all duration-200 ${
                        isParentActive(item.children)
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {/* Always show labels on mobile when sidebar is open */}
                        {(!isCollapsed || isMobileSidebarOpen) && (
                          <>
                            <span className="font-medium">{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs ml-auto">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      {/* Always show chevron on mobile when sidebar is open */}
                      {(!isCollapsed || isMobileSidebarOpen) && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            expandedSections.includes(item.id) ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </Button>

                    {/* Children */}
                    {(!isCollapsed || isMobileSidebarOpen) && expandedSections.includes(item.id) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Button
                            key={child.id}
                            variant="ghost"
                            onClick={() => {
                              const isDesktop = window.innerWidth >= 1024;
                              if (isDesktop && isCollapsed) {
                                // Auto-expand sidebar on desktop when collapsed
                                setIsCollapsed(false);
                              }
                              handleNavigation(child.path);
                            }}
                            className={`w-full justify-start h-9 p-3 rounded-md transition-all duration-200 ${
                              isActive(child.path)
                                ? 'bg-blue-100 text-blue-700 border-l-2 border-blue-500'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <child.icon className="w-4 h-4 mr-3" />
                            {/* Always show labels on mobile when sidebar is open */}
                            {(!isCollapsed || isMobileSidebarOpen) && (
                              <span className="text-sm">{child.label}</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Single level item
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const isDesktop = window.innerWidth >= 1024;
                      if (isDesktop && isCollapsed) {
                        // Auto-expand sidebar on desktop when collapsed
                        setIsCollapsed(false);
                      }
                      handleNavigation(item.path);
                    }}
                    className={`w-full justify-start h-auto p-3 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {/* Always show labels on mobile when sidebar is open */}
                      {(!isCollapsed || isMobileSidebarOpen) && (
                        <>
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="space-y-2">
            {/* Home Button */}
            <Button
              variant="outline"
              onClick={() => {
                const isDesktop = window.innerWidth >= 1024;
                if (isDesktop && isCollapsed) {
                  setIsCollapsed(false);
                }
                navigate('/');
                // Close sidebar on mobile after navigation
                if (!isDesktop) {
                  onMobileSidebarClose?.();
                }
              }}
              className={`w-full justify-start gap-2 ${isCollapsed && !isMobileSidebarOpen ? 'px-2' : ''}`}
            >
              <Home className="w-4 h-4" />
              {/* Always show label on mobile when sidebar is open */}
              {(!isCollapsed || isMobileSidebarOpen) && <span>Main Portal</span>}
            </Button>

            {/* Logout Button */}
            <Button
              variant="outline"
              onClick={handleLogoutClick}
              className={`w-full justify-start gap-2 text-red-600 border-red-300 hover:bg-red-50 ${
                isCollapsed && !isMobileSidebarOpen ? 'px-2' : ''
              }`}
            >
              <LogOut className="w-4 h-4" />
              {/* Always show label on mobile when sidebar is open */}
              {(!isCollapsed || isMobileSidebarOpen) && <span>Logout</span>}
            </Button>
          </div>

          {/* System Status - Show when not collapsed on desktop or always on mobile when open */}
          {(!isCollapsed || isMobileSidebarOpen) && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">System Online</span>
              </div>
              <p className="text-xs text-green-600 mt-1">All services operational</p>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5" />
              </div>
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to logout from the Admin Portal? You will need to login again to access admin features.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800">Before you logout</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Make sure you have saved all your work. Any unsaved changes will be lost.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={cancelLogout}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLogout}
              className="flex-1"
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSidebar;