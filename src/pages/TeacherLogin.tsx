import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Lock, LogIn, ArrowLeft, LogOut } from 'lucide-react';

const TeacherLogin = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { login, logout, isAuthenticated, user, isTeacher } = useAuth();
  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isRtl = language === 'ar';

  // Redirect if already authenticated as a teacher
  useEffect(() => {
    if (isAuthenticated && user) {
      if (isTeacher) {
        navigate('/teacher/dashboard');
      } else {
        // Admin is trying to access teacher portal
        setError(t('Please logout from admin account first to access teacher portal', 'الرجاء تسجيل الخروج من حساب المدير أولاً للوصول إلى بوابة المعلم'));
      }
    }
  }, [isAuthenticated, user, isTeacher, navigate, setError]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      const success = await login(teacherId, password);

      if (success) {
        setSuccess(true);
        // Navigate after a short delay to show success message
        setTimeout(() => {
          navigate('/teacher/dashboard');
        }, 1500);
      } else {
        setError(t('معرف المعلم أو كلمة المرور غير صحيحة', 'Invalid teacher ID or password'));
      }
    } catch (err) {
      setError(t('حدث خطأ ما. يرجى المحاولة مرة أخرى', 'An error occurred. Please try again'));
    } finally {
      setIsLoading(false);
    }
  };

  const goToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <Header />

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-md mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              onClick={goToHome}
              variant="ghost"
              className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50/70"
            >
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              {t('العودة للرئيسية', 'Back to Home')}
            </Button>
          </div>

          {/* Login Card */}
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-2">
                {t('تسجيل دخول المعلم', 'Teacher Login')}
              </CardTitle>
              <CardDescription className="text-green-50">
                {t('سجل دخولك للوصول إلى لوحة التحكم', 'Sign in to access your dashboard')}
              </CardDescription>
            </div>

            <CardHeader className="pb-4">
              <div className="text-center text-sm text-muted-foreground bg-green-50 rounded-lg p-3">
                <p className="font-medium text-green-700 mb-1">
                  {t('بيانات الاختبار', 'Test Credentials')}
                </p>
                <div className="space-y-1 text-xs">
                  <p>{t('المعلم: T001 أو T002 أو T003', 'Teacher: T001 or T002 or T003')}</p>
                  <p>{t('كلمة المرور: 123456', 'Password: 123456')}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Success Message */}
              {success && (
                <Alert className="bg-green-50 border-green-200 text-green-700">
                  <AlertDescription>
                    {t('تم تسجيل الدخول بنجاح! جاري التوجيه...', 'Login successful! Redirecting...')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert className="bg-red-50 border-red-200 text-red-700">
                  <AlertDescription className="space-y-3">
                    <div>{error}</div>
                    {isAuthenticated && user && !isTeacher && (
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        size="sm"
                        className="mt-2 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('Logout from Admin', 'تسجيل الخروج من حساب المدير')}
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Teacher ID Field */}
                <div className="space-y-2">
                  <Label htmlFor="teacherId" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-green-600" />
                    {t('معرف المعلم', 'Teacher ID')}
                  </Label>
                  <Input
                    id="teacherId"
                    type="text"
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    placeholder={t('مثال: T001', 'e.g., T001')}
                    className="h-12 text-base border-green-200 focus:border-green-500 focus:ring-green-500/20"
                    required
                    disabled={isLoading || (isAuthenticated && user && !isTeacher)}
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-600" />
                    {t('كلمة المرور', 'Password')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('أدخل كلمة المرور', 'Enter password')}
                    className="h-12 text-base border-green-200 focus:border-green-500 focus:ring-green-500/20"
                    required
                    disabled={isLoading || (isAuthenticated && user && !isTeacher)}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading || !teacherId.trim() || !password.trim() || (isAuthenticated && user && !isTeacher)}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('جاري تسجيل الدخول...', 'Signing in...')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      {t('دخول', 'Sign In')}
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherLogin;
