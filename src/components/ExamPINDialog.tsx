import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';

interface ExamPINDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (pin: string) => void;
  examTitle: string;
  pinDescription?: string;
  error?: string;
  isLoading?: boolean;
}

const ExamPINDialog = ({
  isOpen,
  onClose,
  onVerify,
  examTitle,
  pinDescription,
  error,
  isLoading = false
}: ExamPINDialogProps) => {
  const { t, language } = useLanguage();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const isRtl = language === 'ar';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim()) {
      onVerify(pin.trim());
    }
  };

  const handleCancel = () => {
    setPin('');
    setShowPin(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <DialogTitle className="text-xl">
              {t('رمز الامتحان', 'Exam PIN Required')}
            </DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            {examTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN Description */}
          {pinDescription && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                {pinDescription}
              </AlertDescription>
            </Alert>
          )}

          {/* PIN Input */}
          <div className="space-y-2">
            <Label htmlFor="pin-input">
              {t('أدخل رمز الامتحان', 'Enter Exam PIN')}
            </Label>
            <div className="relative">
              <Input
                id="pin-input"
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={t('****', '****')}
                className="text-center text-lg font-mono tracking-widest"
                maxLength={10}
                autoFocus
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowPin(!showPin)}
                disabled={isLoading}
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={!pin.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {t('التحقق من الرمز', 'Verify PIN')}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full"
            >
              {t('إلغاء', 'Cancel')}
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 text-center">
            {t('سيتم توجيهك إلى صفحة الامتحان بعد التحقق من الرمز', 'You will be redirected to the exam page after PIN verification')}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExamPINDialog;