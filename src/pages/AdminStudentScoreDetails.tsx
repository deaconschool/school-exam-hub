import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Users, Award, TrendingUp, Calendar, Clock, Eye, CheckCircle, XCircle } from 'lucide-react';
import { SupabaseService } from '@/services/supabaseService';
import { toast } from 'sonner';

interface StudentScoreData {
  student: {
    id: string;
    code: string;
    name: string;
    class: string;
    stage: string;
  };
  exam: any;
  grades: {
    id: string;
    teacherId: string;
    teacherName: string;
    tasleemGrade: number;
    not2Grade: number;
    ada2Grade: number;
    totalGrade: number;
    notes: string;
    createdAt: string;
    gradedAt: string;
  }[];
  classRanking: {
    rank: number;
    totalStudents: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  };
  examSummary: {
    averageScore: number;
    passRate: number;
    totalStudents: number;
    gradedStudents: number;
  };
}

const AdminStudentScoreDetails = () => {
  const { id: examId, studentId } = useParams<{ id: string; studentId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  // State management
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentScoreData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load student detailed score data
  useEffect(() => {
    const loadStudentDetails = async () => {
      if (!examId || !studentId) return;

      try {
        setLoading(true);
        const response = await SupabaseService.getStudentScoreDetails(examId, studentId);

        if (response.success && response.data) {
          setStudentData(response.data);
        } else {
          setError(response.error || 'Failed to load student details');
          navigate('/admin/hymns/detail/' + examId);
        }
      } catch (error) {
        console.error('Error loading student details:', error);
        setError('An error occurred while loading student details');
      } finally {
        setLoading(false);
      }
    };

    loadStudentDetails();
  }, [examId, studentId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('Loading student details...', 'Loading student details...')}</p>
        </div>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('Error', 'Error')}</h2>
          <p className="text-gray-600 mb-4">{error || 'Student not found'}</p>
          <Button onClick={() => navigate('/admin/hymns/detail/' + examId)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('Back to Exam', 'Back to Exam')}
          </Button>
        </div>
      </div>
    );
  }

  const { student, exam, grades, classRanking, examSummary } = studentData;
  const totalPossibleMarks = (exam.tasleem_max || 0) + (exam.not2_max || 0) + (exam.ada2_max || 0);

  // Calculate pass/fail status for each grade
  const getPassStatus = (totalGrade: number) => {
    const passMark = (exam.pass_percentage / 100) * totalPossibleMarks;
    return totalGrade >= passMark;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50" dir="ltr">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/hymns/detail/' + examId)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('Back to Exam', 'Back to Exam')}
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('Student Score Details', 'Student Score Details')}
                </h1>
                <p className="text-gray-600">
                  {t('Student:', 'Student:')} {student.name} ({student.code})
                </p>
                <p className="text-sm text-gray-500">
                  {t('Exam:', 'Exam:')} {language === 'ar' ? exam.title_ar : exam.title_en}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Student Overview Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-blue-800 flex items-center gap-2">
              <Users className="w-6 h-6" />
              {t('Student Information', 'Student Information')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{student.name}</div>
                <div className="text-sm text-blue-800">{student.code}</div>
                <div className="text-xs text-blue-600 mt-1">{t('Student Code', 'Student Code')}</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{student.class}</div>
                <div className="text-sm text-purple-800">{student.stage}</div>
                <div className="text-xs text-purple-600 mt-1">{t('Class', 'Class')}/{t('Stage', 'Stage')}</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">#{classRanking.rank}</div>
                <div className="text-sm text-green-800">{t('Class Rank', 'Class Rank')}</div>
                <div className="text-xs text-green-600 mt-1">{t('of', 'of')} {classRanking.totalStudents}</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{grades.length}</div>
                <div className="text-sm text-orange-800">{t('Teacher Evaluations', 'Teacher Evaluations')}</div>
                <div className="text-xs text-orange-600 mt-1">{t('Total', 'Total')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grades Breakdown Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-purple-800 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {t('Detailed Grade Breakdown', 'Detailed Grade Breakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Teacher', 'Teacher')}</TableHead>
                    <TableHead className="text-center">{t('Tasleem', 'Tasleem')} (/{exam.tasleem_max})</TableHead>
                    <TableHead className="text-center">{t('Not2', 'Not2')} (/{exam.not2_max})</TableHead>
                    <TableHead className="text-center">{t('Ada2', 'Ada2')} (/{exam.ada2_max})</TableHead>
                    <TableHead className="text-center">{t('Total', 'Total')} (/{totalPossibleMarks})</TableHead>
                    <TableHead className="text-center">{t('Status', 'Status')}</TableHead>
                    <TableHead>{t('Date', 'Date')}</TableHead>
                    <TableHead>{t('Notes', 'Notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{grade.teacherName}</div>
                          <div className="text-xs text-gray-500">ID: {grade.teacherId}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium px-2 py-1 rounded ${
                          grade.tasleemGrade >= (exam.tasleem_max * 0.8) ? 'bg-green-100 text-green-800' :
                          grade.tasleemGrade >= (exam.tasleem_max * 0.6) ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {grade.tasleemGrade}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium px-2 py-1 rounded ${
                          grade.not2Grade >= (exam.not2_max * 0.8) ? 'bg-green-100 text-green-800' :
                          grade.not2Grade >= (exam.not2_max * 0.6) ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {grade.not2Grade}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium px-2 py-1 rounded ${
                          grade.ada2Grade >= (exam.ada2_max * 0.8) ? 'bg-green-100 text-green-800' :
                          grade.ada2Grade >= (exam.ada2_max * 0.6) ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {grade.ada2Grade}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        <span className={`px-3 py-1 rounded ${
                          getPassStatus(grade.totalGrade) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {grade.totalGrade}/{totalPossibleMarks}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getPassStatus(grade.totalGrade) ? "default" : "destructive"}
                          className={getPassStatus(grade.totalGrade) ? "" : ""}
                        >
                          {getPassStatus(grade.totalGrade) ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {getPassStatus(grade.totalGrade) ? t('Pass', 'Pass') : t('Fail', 'Fail')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          <div>{formatDate(grade.createdAt)}</div>
                          <div className="text-xs text-gray-500">{formatDate(grade.gradedAt)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {grade.notes || t('No notes', 'No notes')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Class Performance */}
          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t('Class Performance', 'Class Performance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('Your Rank:', 'Your Rank:')}</span>
                  <span className="text-lg font-bold text-green-600">#{classRanking.rank}/{classRanking.totalStudents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('Class Average:', 'Class Average:')}</span>
                  <span className="text-lg font-bold text-blue-600">{classRanking.averageScore.toFixed(1)}/{totalPossibleMarks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('Highest Score:', 'Highest Score:')}</span>
                  <span className="text-lg font-bold text-purple-600">{classRanking.highestScore}/{totalPossibleMarks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('Lowest Score:', 'Lowest Score:')}</span>
                  <span className="text-lg font-bold text-orange-600">{classRanking.lowestScore}/{totalPossibleMarks}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exam Summary */}
          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                <Award className="w-5 h-5" />
                {t('Exam Summary', 'Exam Summary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('Exam Average:', 'Exam Average:')}</span>
                  <span className="text-lg font-bold text-purple-600">{examSummary.averageScore.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('Pass Rate:', 'Pass Rate:')}</span>
                  <span className="text-lg font-bold text-green-600">{examSummary.passRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('Total Students:', 'Total Students:')}</span>
                  <span className="text-lg font-bold text-blue-600">{examSummary.totalStudents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('Graded Students:', 'Graded Students:')}</span>
                  <span className="text-lg font-bold text-orange-600">{examSummary.gradedStudents}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            {t('Print Report', 'Print Report')}
          </Button>
          <Button
            onClick={() => navigate('/admin/hymns/detail/' + examId)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('Back to Exam Details', 'Back to Exam Details')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminStudentScoreDetails;