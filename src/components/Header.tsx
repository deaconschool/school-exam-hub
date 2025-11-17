import { useLanguage } from '@/contexts/LanguageContext';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side - Empty Space */}
          <div className="w-9"></div>

          {/* Center - School Name (Language-Aware Alignment + Clickable) */}
          <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <h1
              onClick={() => navigate('/')}
              className="text-2xl md:text-3xl font-serif font-bold bg-gradient-to-r from-slate-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight drop-shadow-sm cursor-pointer hover:opacity-80 transition-opacity duration-200 select-none"
              title={t('العودة إلى الرئيسية', 'Back to Home')}
            >
              {t('مدرسة أم النور للشمامسة', 'Saint Virgin Mary Deacon School')}
            </h1>
          </div>

          {/* Right Side - Language Toggle */}
          <div className="flex items-center">
            <Button
              onClick={toggleLanguage}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 font-medium bg-white/90 hover:bg-white border-slate-300 hover:border-blue-500 transition-all duration-200"
            >
              <Languages className="h-4 w-4" />
              <span>{language === 'ar' ? 'English' : 'عربي'}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
