import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import PortalCard from '@/components/PortalCard';
import { GraduationCap, BookOpen, Settings } from 'lucide-react';

const Index = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <Header />

      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Page Title */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            {t('بوابة الامتحانات', 'Examination Portal')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t('اختر البوابة المناسبة للمتابعة', 'Select your portal to continue')}
          </p>
        </div>

        {/* Portal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PortalCard
            title={{ ar: 'بوابة الطالب', en: 'Student Portal' }}
            description={{
              ar: 'ادخل إلى الامتحانات المخصصة لك',
              en: 'Access your assigned examinations'
            }}
            icon={GraduationCap}
            color="student"
            route="/student/stages"
          />

          <PortalCard
            title={{ ar: 'بوابة المعلم', en: 'Teacher Portal' }}
            description={{
              ar: 'تصحيح وتقييم درجات الطلاب',
              en: 'Grade and evaluate students'
            }}
            icon={BookOpen}
            color="teacher"
            route="/teacher/login"
          />

          <PortalCard
            title={{ ar: 'بوابة الإدارة', en: 'Admin Portal' }}
            description={{
              ar: 'إدارة النظام والبيانات',
              en: 'Manage system and data'
            }}
            icon={Settings}
            color="admin"
            route="/admin/login"
          />
        </div>

        {/* Footer Note */}
        <div className="text-center mt-20 text-gray-500">
          <p className="text-sm">
            {t(
              'للحصول على الدعم الفني، يرجى الاتصال بمسؤول النظام',
              'For technical support, please contact the system administrator'
            )}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
