import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Eye, User } from 'lucide-react';
import { SupabaseService } from '@/services/supabaseService';
import { AuthService } from '@/services/authService';
import { toast } from 'sonner';

const GradeViewingEntry = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === 'ar';

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCodeChange = (value: string) => {
    setCode(value);
    setShowPassword(value.toUpperCase().startsWith('T'));
  };

  const handleBack = () => {
    navigate('/student/stages');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error(isRtl ? 'الرجاء إدخال الكود' : 'Please enter your code');
      return;
    }

    const normalizedCode = code.trim().toUpperCase();

    // Store the referrer page before navigating
    sessionStorage.setItem('gradeViewReferrer', window.location.pathname);

    // Teacher mode
    if (normalizedCode.startsWith('T')) {
      if (!password) {
        toast.error(isRtl ? 'الرجاء إدخال كلمة المرور' : 'Please enter your password');
        return;
      }

      setLoading(true);
      try {
        // Use secure validation - only returns necessary fields
        const teacherResponse = await SupabaseService.validateTeacherForGradeView(normalizedCode);

        if (!teacherResponse.success || !teacherResponse.data) {
          toast.error(isRtl ? 'المعلم غير موجود' : 'Teacher not found');
          return;
        }

        const teacher = teacherResponse.data;

        // Verify password
        const isValidPassword = await AuthService.comparePassword(password, teacher.password_hash);

        if (!isValidPassword) {
          toast.error(isRtl ? 'كلمة المرور غير صحيحة' : 'Invalid password');
          return;
        }

        if (!teacher.is_active) {
          toast.error(isRtl ? 'حساب المعلم غير نشط' : 'Teacher account is not active');
          return;
        }

        // Success - store minimal session data and navigate
        sessionStorage.setItem('gradeViewTeacherId', teacher.id);
        sessionStorage.setItem('gradeViewTeacherName', teacher.name);
        sessionStorage.setItem('gradeViewIsTeacher', 'true');

        // Store assigned classes (already validated to be array or null)
        if (teacher.assigned_classes && teacher.assigned_classes.length > 0) {
          sessionStorage.setItem('gradeViewAssignedClasses', JSON.stringify(teacher.assigned_classes));
        }

        toast.success(isRtl ? 'تم تسجيل الدخول بنجاح' : 'Login successful');
        navigate('/grades/exams');

      } catch (error) {
        console.error('Teacher login error:', error);
        toast.error(isRtl ? 'حدث خطأ أثناء تسجيل الدخول' : 'Login failed');
      } finally {
        setLoading(false);
      }

    } else {
      // Student mode - no password required
      setLoading(true);
      try {
        const studentResponse = await SupabaseService.getStudentByCodeWithNotes(normalizedCode);

        if (!studentResponse.success || !studentResponse.data) {
          toast.error(isRtl ? 'الطالب غير موجود' : 'Student not found');
          return;
        }

        const student = studentResponse.data;

        // Note: The query already filters by is_active=true, so if we get data, the student is active
        // Just verify the data exists
        if (!student) {
          toast.error(isRtl ? 'الطالب غير موجود' : 'Student not found');
          return;
        }

        // Success - store student session and navigate
        sessionStorage.setItem('gradeViewStudentId', student.id);
        sessionStorage.setItem('gradeViewStudentCode', student.code);
        sessionStorage.setItem('gradeViewStudentName', student.name);
        sessionStorage.setItem('gradeViewIsTeacher', 'false');

        toast.success(isRtl ? 'تم التحميل بنجاح' : 'Success');
        navigate('/grades/exams');

      } catch (error) {
        console.error('Student lookup error:', error);
        toast.error(isRtl ? 'حدث خطأ أثناء البحث عن الطالب' : 'Failed to lookup student');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F3C2]/30 via-[#91C6BC]/20 to-[#4B9DA9]/30 py-12 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          {t('العودة', 'Back')}
        </button>

        {/* Main Card */}
        <Card className="shadow-xl border-2 border-[#91C6BC]/30">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-[#4B9DA9] to-[#91C6BC] rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {t('عرض النتائج', 'View Results')}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {t('أدخل كود الطالب لعرض النتائج', 'Enter your student code to view results')}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Code Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('الكود', 'Code')}
                </label>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder={showPassword ? 'T0123' : '0000'}
                  className="text-lg text-center"
                  autoFocus
                  required
                />
              </div>

              {/* Password Input (conditional) */}
              {showPassword && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('كلمة المرور', 'Password')}
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="text-center"
                    required
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#4B9DA9] to-[#91C6BC] hover:from-[#3A8894] hover:to-[#7FB6AE] text-white"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('جاري التحميل...', 'Loading...')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Eye className="w-5 h-5" />
                    {t('عرض النتائج', 'View Results')}
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GradeViewingEntry;
