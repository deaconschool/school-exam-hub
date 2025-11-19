import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Unified language direction hook for consistent RTL/LTR handling across all portals
 * Uses the global LanguageContext as the single source of truth
 */
export const useLanguageDirection = () => {
  const { language, t } = useLanguage();

  return {
    language,
    isRtl: language === 'ar',    // Single source of truth for RTL detection
    isLtr: language === 'en',    // LTR detection
    dir: language === 'ar' ? 'rtl' : 'ltr',  // HTML dir attribute
    textAlignClass: language === 'ar' ? 'text-right' : 'text-left',
    fontClass: language === 'ar' ? 'font-arabic' : 'font-english',
    t  // Translation function from global context
  };
};