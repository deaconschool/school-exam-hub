import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from './AdminSidebar';
import AdminBreadcrumbs from './AdminBreadcrumbs';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface AdminLayoutProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const { adminName } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 lg:flex lg:h-screen lg:overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar - Hidden by default on mobile, visible on desktop */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none`}>
        <AdminSidebar isMobileSidebarOpen={isMobileSidebarOpen} onMobileSidebarClose={closeMobileSidebar} />
      </div>

      {/* Main Content Area - Full width on mobile, with sidebar margin on desktop */}
      <div className="flex-1 flex flex-col w-full lg:w-0 lg:h-full lg:overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side - Mobile menu toggle and breadcrumbs */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMobileSidebar}
                  className="lg:hidden p-2 hover:bg-gray-100 flex-shrink-0"
                >
                  {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>

                {/* Breadcrumbs - Responsive */}
                <div className="hidden sm:block lg:hidden flex-1 min-w-0">
                  <AdminBreadcrumbs />
                </div>
                <div className="hidden lg:block">
                  <AdminBreadcrumbs />
                </div>
              </div>

              {/* Right side - Header content */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* User info */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{adminName}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {adminName?.charAt(0).toUpperCase()}
                  </div>
                </div>
                {/* Mobile user avatar */}
                <div className="sm:hidden w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {adminName?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Header - Optional */}
        {(title || subtitle) && (
          <div className="bg-white border-b border-gray-100 flex-shrink-0">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  {title && <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>}
                  {subtitle && <p className="text-gray-600 mt-1 text-sm sm:text-base">{subtitle}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-y-auto overflow-x-hidden">
          <div className="max-w-full">
            {children || <Outlet />}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-sm text-gray-500 text-center sm:text-left">
                © 2024 School Examination Hub. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium hidden sm:inline">System Online</span>
                <span className="text-sm text-green-600 font-medium sm:hidden">Online</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile-only close backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}
    </div>
  );
};

export default AdminLayout;