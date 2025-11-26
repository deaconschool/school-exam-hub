import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminService } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  BookOpen,
  Music,
  Users,
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Search,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Settings,
  Plus,
  ExternalLink
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface ExamStats {
  totalExams: number;
  academicExams: number;
  hymnsExams: number;
  activeExams: number;
  totalStudents: number;
  totalGrades: number;
}

const AdminExamManagement = () => {
  const navigate = useNavigate();
  const { adminName } = useAuth();
  const [examStats, setExamStats] = useState<ExamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load exam stats on component mount
  useEffect(() => {
    loadExamStats();
  }, []);

  const loadExamStats = async () => {
    try {
      const response = await AdminService.getExamStats();
      if (response.success && response.data) {
        // Parse the data to separate academic and Hymns exams
        const allExams = response.data.exams || [];
        const academicExams = allExams.filter((exam: any) => exam.subject !== 'Hymns' && exam.subject !== 'ألحان');
        const hymnsExams = allExams.filter((exam: any) => exam.subject === 'Hymns' || exam.subject === 'ألحان');

        setExamStats({
          totalExams: allExams.length,
          academicExams: academicExams.length,
          hymnsExams: hymnsExams.length,
          activeExams: response.data.activeExams || 0,
          totalStudents: response.data.totalStudents || 0,
          totalGrades: response.data.totalGrades || 0
        });
      }
    } catch (err) {
      console.error('Error loading exam stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="ltr">
      <AdminLayout title="Exam Management" subtitle="Create, edit, and manage examinations">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-700 font-medium mb-1">
                Total Exams
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {examStats?.totalExams || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-green-700 font-medium mb-1">
                Academic Exams
              </p>
              <p className="text-2xl font-bold text-green-900">
                {examStats?.academicExams || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-purple-700 font-medium mb-1">
                Hymns Exams
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {examStats?.hymnsExams || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-orange-700 font-medium mb-1">
                Active Exams
              </p>
              <p className="text-2xl font-bold text-orange-900">
                {examStats?.activeExams || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Academic Exams Card */}
        <Card
          className="group bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          onClick={() => navigate('/admin/exam-management/academic')}
        >
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <ArrowRight className="w-6 h-6 text-blue-600 group-hover:translate-x-2 transition-transform" />
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                Manage Academic Exams
              </h3>

              <p className="text-slate-600 leading-relaxed">
                Manage academic exams for subjects like Rituals, Doctrine, Theology, and other theoretical subjects with exam URLs.
              </p>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <FileText className="w-4 h-4" />
                  <span>{examStats?.academicExams || 0} exams</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="w-4 h-4" />
                  <span>{examStats?.totalStudents || 0} students</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
                Go to Academic Exams
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hymns Exams Card */}
        <Card
          className="group bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          onClick={() => navigate('/admin/exam-management/hymns')}
        >
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                <Music className="w-8 h-8 text-white" />
              </div>
              <ArrowRight className="w-6 h-6 text-purple-600 group-hover:translate-x-2 transition-transform" />
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                Manage Hymns Exams
              </h3>

              <p className="text-slate-600 leading-relaxed">
                Manage oral Hymns exams for teacher portal grading. Track grades, monitor progress, and set up monthly exams.
              </p>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Music className="w-4 h-4" />
                  <span>{examStats?.hymnsExams || 0} exams</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <BarChart3 className="w-4 h-4" />
                  <span>{examStats?.totalGrades || 0} grades</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
                Go to Hymns Exams
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Settings className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/admin/exam-management/academic')}
              variant="outline"
              className="flex items-center gap-3 p-4 h-auto bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              <Plus className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-blue-900">
                  Create Academic Exam
                </p>
                <p className="text-sm text-blue-700">
                  Add new academic exam with URL
                </p>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/admin/exam-management/hymns')}
              variant="outline"
              className="flex items-center gap-3 p-4 h-auto bg-purple-50 border-purple-200 hover:bg-purple-100"
            >
              <Plus className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-purple-900">
                  Create Hymns Exam
                </p>
                <p className="text-sm text-purple-700">
                  Add new oral Hymns exam
                </p>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/admin/dashboard')}
              variant="outline"
              className="flex items-center gap-3 p-4 h-auto bg-slate-50 border-slate-200 hover:bg-slate-100"
            >
              <TrendingUp className="w-5 h-5 text-slate-600" />
              <div className="text-left">
                <p className="font-medium text-slate-900">
                  View Analytics
                </p>
                <p className="text-sm text-slate-700">
                  Exam statistics and reports
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
      </AdminLayout>
    </div>
  );
};

export default AdminExamManagement;