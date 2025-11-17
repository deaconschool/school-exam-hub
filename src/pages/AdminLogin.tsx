import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';

const AdminLogin = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            {t('تسجيل دخول المسؤول', 'Admin Login')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('قريباً - المرحلة الخامسة', 'Coming Soon - Phase 5')}
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
