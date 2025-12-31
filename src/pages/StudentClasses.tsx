import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import { DataService } from '@/services/dataService';
import { SupabaseService } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { School, Home, ArrowLeft, Eye } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const StudentClasses = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stageData, setStageData] = useState<any>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const isRtl = language === 'ar';

  useEffect(() => {
    const stageLevel = searchParams.get('stage');
    if (stageLevel) {
      const stage = DataService.getStages().find(s => s.level === parseInt(stageLevel));
      if (stage) {
        setStageData(stage);

        // Fetch available classes for this stage level from Supabase
        const fetchClasses = async () => {
          try {
            const response = await SupabaseService.getClassesForStage(parseInt(stageLevel));
            if (response.success && response.data) {
              setClasses(response.data.map(cls => cls.name));
            }
          } catch (error) {
            console.error('Error fetching classes:', error);
          }
        };

        fetchClasses();
      }
    }
  }, [searchParams]);

  const navigateToSubjects = (className: string) => {
    const stageLevel = searchParams.get('stage');
    navigate(`/student/subjects?stage=${stageLevel}&class=${encodeURIComponent(className)}`);
  };

  const goToStages = () => {
    navigate('/student');
  };

  const goToHome = () => {
    navigate('/');
  };

  if (!stageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('Loading...', 'Loading...')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <Header />

      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Button
              onClick={goToStages}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-white/90 hover:bg-white border-gray-300 hover:border-blue-400 transition-all duration-200"
            >
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              {t('المراحل', 'Stages')}
            </Button>
            <Button
              onClick={goToHome}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-white/90 hover:bg-white border-gray-300 hover:border-blue-400 transition-all duration-200"
            >
              <Home className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              {t('الرئيسية', 'Home')}
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {t('اختر الفصل', 'Select Class')}
            </h1>
            <p className="text-lg text-gray-600">
              {language === 'ar' ? stageData.name_ar : stageData.name_en}
            </p>
          </div>

          <Button
            onClick={() => navigate('/grades/view')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-gradient-to-r from-[#4B9DA9] to-[#91C6BC] hover:from-[#3A8894] hover:to-[#7FB6AE] text-white border-0 transition-all duration-200"
          >
            <Eye className="w-4 h-4" />
            {t('عرض النتائج', 'View Results')}
          </Button>
        </div>

        {/* Class Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {classes.map((className, index) => {
            // Dynamic colors for each class
            const colorGradients = [
              'from-blue-400 to-cyan-500',
              'from-green-400 to-emerald-500',
              'from-purple-400 to-pink-500',
              'from-orange-400 to-red-500',
              'from-indigo-400 to-purple-500',
              'from-teal-400 to-blue-500'
            ];

            const gradient = colorGradients[index % colorGradients.length];

            return (
              <Card
                key={className}
                onClick={() => navigateToSubjects(className)}
                className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 border-2 border-transparent hover:border-white/50 group overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
                <CardContent className="p-8 text-center space-y-6">
                  {/* Icon */}
                  <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <School className="w-10 h-10 text-white" />
                  </div>

                  {/* Class Name */}
                  <h2 className="text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                    {className}
                  </h2>

                  {/* Stage Info */}
                  <div className="text-gray-600 text-sm">
                    <p>{language === 'ar' ? stageData.name_ar : stageData.name_en}</p>
                  </div>

                  {/* Available Subjects */}
                  <div className="text-sm text-gray-500">
                    <p>{t('المواد المتاحة', 'Available Subjects')}:</p>
                    <p className="font-medium">قبطى • طقس • عقيدة</p>
                  </div>

                  {/* Click Indicator */}
                  <div className={`text-xs text-gray-400 flex items-center justify-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span>{t('اضغط للمتابعة', 'Click to continue')}</span>
                    <span className={isRtl ? 'rotate-180' : ''}>→</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            {t(
              'اختر الفصل لعرض المواد المتاحة',
              'Select the class to view available subjects'
            )}
          </p>
        </div>
      </main>
    </div>
  );
};

export default StudentClasses;