import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Student = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to stages page immediately
    navigate('/student/stages');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {t('جاري التحميل...', 'Loading...')}
        </h1>
        <p className="text-gray-600">
          {t('يتم توجيهك إلى بوابة الطالب...', 'Redirecting to Student Portal...')}
        </p>
      </div>
    </div>
  );
};

export default Student;
