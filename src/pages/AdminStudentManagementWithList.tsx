import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AdminStudentList from '@/components/AdminStudentList';
import {
  ArrowLeft
} from 'lucide-react';

const AdminStudentManagementWithList = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
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
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <AdminStudentList />
      </main>
    </div>
  );
};

export default AdminStudentManagementWithList;