import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Phase3Testing, TestResult, ManualTestingChecklist } from '@/utils/testUtils';
import { TestTube, CheckCircle, AlertCircle, FileText, Clipboard } from 'lucide-react';

const TestingPanel = () => {
  const { t, language } = useLanguage();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Simulate test delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      const results = Phase3Testing.runFullTestSuite();
      setTestResults(results);

      // Generate report
      const report = Phase3Testing.generateTestReport(results);

    } catch (error) {
      setTestResults([{
        testName: "Test Suite Error",
        passed: false,
        message: "Failed to run test suite",
        details: error
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const copyReportToClipboard = () => {
    const report = Phase3Testing.generateTestReport(testResults);
    navigator.clipboard.writeText(report).then(() => {
      // Show success message (you could add a toast here)
          });
  };

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  const getStatusColor = (successRate: number) => {
    if (successRate >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (successRate >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = (successRate: number) => {
    if (successRate >= 90) return <CheckCircle className="w-5 h-5" />;
    if (successRate >= 75) return <AlertCircle className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const getStatusText = (successRate: number) => {
    if (successRate >= 90) return t('ممتاز', 'EXCELLENT');
    if (successRate >= 75) return t('جيد', 'GOOD');
    return t('يحتاج انتباه', 'NEEDS ATTENTION');
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <TestTube className="w-5 h-5 text-purple-600" />
          </div>
          {t('لوحة اختبار Phase 3', 'Phase 3 Testing Panel')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Test Status */}
        {testResults.length > 0 && (
          <Alert className={`border ${getStatusColor(successRate)}`}>
            <div className="flex items-center gap-2">
              {getStatusIcon(successRate)}
              <div className="flex-1">
                <AlertDescription className="font-semibold">
                  {t('حالة الاختبارات:', 'Test Status:')} {successRate}% ({passedTests}/{totalTests})
                </AlertDescription>
                <AlertDescription className="text-sm mt-1">
                  {getStatusText(successRate)}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Test Controls */}
        <div className="flex gap-3">
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('جاري التشغيل...', 'Running...')}
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4" />
                {t('تشغيل الاختبارات', 'Run Tests')}
              </>
            )}
          </Button>

          {testResults.length > 0 && (
            <Button
              onClick={copyReportToClipboard}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clipboard className="w-4 h-4" />
              {t('نسخ التقرير', 'Copy Report')}
            </Button>
          )}

          <Button
            onClick={() => setShowChecklist(!showChecklist)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {showChecklist ? t('إخفاء القائمة', 'Hide Checklist') : t('قائمة يدوية', 'Manual Checklist')}
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{t('نتائج الاختبارات:', 'Test Results:')}</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    result.passed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {result.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{result.testName}</div>
                    <div className="text-xs text-gray-600">{result.message}</div>
                  </div>
                  <Badge variant={result.passed ? "default" : "destructive"}>
                    {result.passed ? t('نجح', 'PASS') : t('فشل', 'FAIL')}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Testing Checklist */}
        {showChecklist && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{t('قائمة الاختبار اليدوي:', 'Manual Testing Checklist:')}</h3>

            {Object.entries(ManualTestingChecklist).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium capitalize text-blue-700">{category}</h4>
                <div className="grid gap-2">
                  {items.map((item, index) => (
                    <label key={index} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <Alert>
              <AlertDescription>
                {t(
                  'استخدم هذه القائمة للتأكد من أن جميع وظائف التطبيق تعمل بشكل صحيح.',
                  'Use this checklist to manually verify all application functionality.'
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Instructions */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-sm">
            {t(
              'اختبار تلقائي: يتحقق من الأنظمة الأساسية والمكونات والخدمات. الاختبار اليدوي: تحقق من تجربة المستخدم الكاملة.',
              'Automated: Checks core systems, components, and services. Manual: Verify complete user experience.'
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default TestingPanel;