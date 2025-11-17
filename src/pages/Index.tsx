import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import PortalCard from '@/components/PortalCard';
import { GraduationCap, BookOpen, Settings } from 'lucide-react';

const Index = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('بوابة الامتحانات', 'Examination Portal')}
          </h1>
          <p className="text-xl text-muted-foreground">
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
            route="/student"
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
        <div className="text-center mt-16 text-muted-foreground">
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
