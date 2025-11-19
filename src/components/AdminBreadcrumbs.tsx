import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
  isCurrent?: boolean;
}

const AdminBreadcrumbs = () => {
  const location = useLocation();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        path: '/admin/dashboard'
      }
    ];

    // Map paths to breadcrumb labels
    const pathLabels: Record<string, string> = {
      'admin': 'Admin Portal',
      'dashboard': 'Dashboard',
      'students': 'Student Management',
      'teachers': 'Teacher Management',
      'stages': 'Stages',
      'classes': 'Classes',
      'subjects': 'Subjects',
      'exams': 'Exam Management',
      'reports': 'Reports & Analytics',
      'backup': 'Data Management',
      'settings': 'System Settings',
      'security': 'Security',
      'list': 'List',
      'add': 'Add New',
      'edit': 'Edit',
      'view': 'View Details',
      'import': 'Import Excel',
      'export': 'Export Data',
      'create': 'Create',
      'overview': 'Overview'
    };

    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip 'admin' as it's implied
      if (segment === 'admin') return;

      const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      // Determine if this is the current page
      const isCurrent = index === pathSegments.length - 1;

      breadcrumbs.push({
        label,
        path: isCurrent ? undefined : currentPath,
        isCurrent
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600" aria-label="Breadcrumb">
      <Link
        to="/"
        className="flex items-center hover:text-gray-900 transition-colors duration-150"
      >
        <Home className="w-4 h-4" />
      </Link>

      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.path || index}>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {item.isCurrent || !item.path ? (
            <span className="font-medium text-gray-900">{item.label}</span>
          ) : (
            <Link
              to={item.path}
              className="hover:text-gray-900 transition-colors duration-150 truncate max-w-xs"
              title={item.label}
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default AdminBreadcrumbs;