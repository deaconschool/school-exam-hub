import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import { DataService } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { School, Users, BookOpen, Home } from 'lucide-react';

const StudentStages = () => {
  const { t, language } = useLanguage();
  const stages = DataService.getStages();
  const isRtl = language === 'ar';

  const navigateToClasses = (stageLevel: number) => {
    // Navigate to classes page with stage parameter
    window.location.href = `/student/classes?stage=${stageLevel}`;
  };

  const goToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <Header />

      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Header with Home Button */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={goToHome}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-white/90 hover:bg-white border-gray-300 hover:border-blue-400 transition-all duration-200"
          >
            <Home className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            {t('الرئيسية', 'Home')}
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('اختر المرحلة الدراسية', 'Select Educational Stage')}
          </h1>

          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Stage Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {stages.map((stage, index) => {
            // Dynamic colors for each stage
            const colorGradients = [
              'from-pink-400 to-rose-500',
              'from-blue-400 to-cyan-500',
              'from-green-400 to-emerald-500',
              'from-purple-400 to-indigo-500',
              'from-orange-400 to-amber-500'
            ];

            const gradient = colorGradients[index % colorGradients.length];

            return (
              <Card
                key={stage.level}
                onClick={() => navigateToClasses(stage.level)}
                className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 border-2 border-transparent hover:border-white/50 group overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
                <CardContent className="p-8 text-center space-y-6">
                  {/* Icon */}
                  <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <School className="w-10 h-10 text-white" />
                  </div>

                  {/* Stage Title */}
                  <h2 className="text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                    {language === 'ar' ? stage.name_ar : stage.name_en}
                  </h2>

                  {/* Class Count */}
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">
                      {stage.classes.length} {t('صف', 'class')}{stage.classes.length > 1 ? (language === 'ar' ? 'وف' : 'es') : ''}
                    </span>
                  </div>

                  {/* Classes Preview */}
                  <div className="text-sm text-gray-500">
                    {stage.classes.slice(0, 2).map((className, idx) => (
                      <div key={idx}>• {className}</div>
                    ))}
                    {stage.classes.length > 2 && (
                      <div className="font-medium">• {t('والمزيد...', 'and more...')}</div>
                    )}
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
              'اختر المرحلة الدراسية لعرض الفصول المتاحة',
              'Select the educational stage to view available classes'
            )}
          </p>
        </div>
      </main>
    </div>
  );
};

export default StudentStages;