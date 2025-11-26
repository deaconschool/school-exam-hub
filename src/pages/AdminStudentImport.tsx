import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/AdminLayout';
import ExcelImport from '@/components/ExcelImport';
import { ArrowLeft, Upload, Users } from 'lucide-react';

const AdminStudentImport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { adminName } = useAuth();

  // Force LTR direction permanently for admin import - never restore RTL
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

  const handleImportComplete = () => {
    // Refresh data or navigate back to student list
    navigate('/admin/students/list');
  };

  const handleBack = () => {
    navigate('/admin/students');
  };

  return (
    <AdminLayout title="Import Students" subtitle="Bulk import student data from Excel files">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Student Management
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Import Component */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-green-600" />
              </div>
              Import Student Data from Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExcelImport onImportComplete={handleImportComplete} />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-600 font-medium">Welcome</p>
                <p className="text-sm font-bold text-blue-600 truncate">{adminName || 'Admin'}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-white/20 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Upload className="w-4 h-4 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-600 font-medium">Action</p>
                <p className="text-sm font-bold text-green-600">Import Mode</p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-white/20 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-600 font-medium">Format</p>
                <p className="text-sm font-bold text-purple-600">Excel (.xlsx)</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStudentImport;