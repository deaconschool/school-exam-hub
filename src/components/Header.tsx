import { useLanguage } from '@/contexts/LanguageContext';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Logo */}
          <div className="flex items-center justify-start">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-student via-teacher to-admin flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">م</span>
            </div>
          </div>

          {/* School Name */}
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              {t('مدرسة أم النور للشمامسة', 'Saint Virgin Mary Deacon School')}
            </h1>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center justify-end">
            <Button
              onClick={toggleLanguage}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 font-medium"
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
