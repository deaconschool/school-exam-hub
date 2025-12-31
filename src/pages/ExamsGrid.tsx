import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { SupabaseService } from '@/services/supabaseService';
import { toast } from 'sonner';

interface Exam {
  id: string;
  title_en: string;
  title_ar: string;
  exam_month: number;
  exam_year: number;
  tasleem_max: number;
  not2_max: number;
  ada2_max: number;
  pass_percentage: number;
}

const ExamsGrid = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === 'ar';
  const isTeacher = sessionStorage.getItem('gradeViewIsTeacher') === 'true';

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Get user name from session
    if (isTeacher) {
      setUserName(sessionStorage.getItem('gradeViewTeacherName') || '');
    } else {
      setUserName(sessionStorage.getItem('gradeViewStudentName') || '');
    }

    // Load published exams
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      // Check cache first using sessionStorage (different cache for teacher vs student)
      const cacheKey = isTeacher ? 'cachedTeacherExamsList' : 'cachedStudentExamsList';
      const cachedExams = sessionStorage.getItem(cacheKey);
      const cacheTimestamp = sessionStorage.getItem(cacheKey + 'Timestamp');
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

      // Use cached data if available and fresh
      if (cachedExams && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        if (cacheAge < CACHE_DURATION) {
          setExams(JSON.parse(cachedExams));
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data from server - pass teacher flag to filter teacher-only exams
      const response = await SupabaseService.getPublishedHymnsExams(isTeacher);

      if (response.success && response.data) {
        setExams(response.data);
        // Cache the results
        sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
        sessionStorage.setItem(cacheKey + 'Timestamp', Date.now().toString());
      } else {
        toast.error(response.error || 'Failed to load exams');
      }
    } catch (error) {
      console.error('Error loading exams:', error);
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleExamClick = (examId: string) => {
    navigate(`/grades/exams/${examId}`);
  };

  const handleBack = () => {
    // Get the referrer page
    const referrer = sessionStorage.getItem('gradeViewReferrer');
    // Clear session
    sessionStorage.clear();
    // Navigate back to referrer or default to entry
    navigate(referrer || '/grades/view');
  };

  const getExamTitle = (exam: Exam) => {
    return isRtl ? exam.title_ar || exam.title_en : exam.title_en || exam.title_ar;
  };

  const monthNames = {
    1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل',
    5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس',
    9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
            {t('العودة', 'Back')}
          </button>

          <h1 className="text-3xl font-bold text-gray-800 text-center ">
            {t('النتائج المتاحة', 'Published Results')}
          </h1>
          {userName && (
            <p className="text-center text-gray-600 mt-8">
              {isRtl ? `أهلاً،    ${userName}` : `Welcome,     ${userName}`}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : exams.length === 0 ? (
          /* Empty State */
          <Card className="text-center py-16">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {t('لا توجد نتائج متاحة بعد', 'No published exams yet')}
              </h3>
              <p className="text-gray-500">
                {t('الرجاء التحقق لاحقاً', 'Please check back later')}
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Exams Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <Card
                key={exam.id}
                onClick={() => handleExamClick(exam.id)}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-purple-100 hover:border-purple-300 bg-white"
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  {/* Exam Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                    {getExamTitle(exam)}
                  </h3>

                  {/* Exam Date */}
                  <div className="flex items-center gap-2 text-gray-500 mb-4">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {isRtl
                        ? `${monthNames[exam.exam_month as keyof typeof monthNames]} ${exam.exam_year}`
                        : `${monthNames[exam.exam_month as keyof typeof monthNames] || exam.exam_month} ${exam.exam_year}`
                      }
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="w-full border-t border-gray-200 my-4" />

                  {/* View Button */}
                  <Button className="w-full bg-[#4B9DA9] hover:bg-[#3A8894] text-white font-medium">
                    {isTeacher
                      ? t('عرض درجات الصف', 'View Class Grades')
                      : t('عرض درجاتي', 'View My Grades')
                    }
                  </Button>
                </CardContent>

              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamsGrid;
