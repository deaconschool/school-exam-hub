import { useState, useEffect } from 'react';
import { supabase, SupabaseService } from '@/services/supabaseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const DatabaseTest = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResults({});

    try {
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('teachers')
        .select('count')
        .limit(1);

      // Test teachers data
      const teachersResponse = await SupabaseService.getTeachers();

      // Test students data
      const studentsResponse = await SupabaseService.getStudents();

      // Test grade criteria
      const gradeCriteriaResponse = await SupabaseService.getGradeCriteria();

      setResults({
        connection: !connectionError,
        teachers: {
          success: teachersResponse.success,
          count: teachersResponse.data?.length || 0,
          error: teachersResponse.error
        },
        students: {
          success: studentsResponse.success,
          count: studentsResponse.data?.length || 0,
          error: studentsResponse.error
        },
        gradeCriteria: {
          success: gradeCriteriaResponse.success,
          count: gradeCriteriaResponse.data?.length || 0,
          error: gradeCriteriaResponse.error
        }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testGradeSubmission = async () => {
    try {
      const result = await SupabaseService.saveGrades(
        '11111', // student code
        'T001',  // teacher ID
        '00000000-0000-0000-0000-000000000000', // exam ID (use actual ID)
        15,      // tasleem grade
        17,      // not2 grade
        18,      // ada2_gama3y grade
        'Test grade submission'
      );

      alert(`Grade submission ${result.success ? 'successful' : 'failed'}: ${result.error}`);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Supabase Database Connection Test
            <Button onClick={testConnection} disabled={loading} size="sm">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Database Connection</span>
              {results.connection ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>Failed</span>
                </div>
              )}
            </div>

            {/* Teachers Test */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Teachers Table</span>
                {results.teachers?.success ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span>{results.teachers.count} records</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>Error</span>
                  </div>
                )}
              </div>
              {results.teachers?.error && (
                <p className="text-sm text-red-600">{results.teachers.error}</p>
              )}
            </div>

            {/* Students Test */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Students Table</span>
                {results.students?.success ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span>{results.students.count} records</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>Error</span>
                  </div>
                )}
              </div>
              {results.students?.error && (
                <p className="text-sm text-red-600">{results.students.error}</p>
              )}
            </div>

            {/* Grade Criteria Test */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Grade Criteria Table</span>
                {results.gradeCriteria?.success ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span>{results.gradeCriteria.count} records</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>Error</span>
                  </div>
                )}
              </div>
              {results.gradeCriteria?.error && (
                <p className="text-sm text-red-600">{results.gradeCriteria.error}</p>
              )}
            </div>

            {/* Test Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={testGradeSubmission} variant="outline">
                Test Grade Submission
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Data Display */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Test Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Teacher Accounts:</h4>
              <ul className="space-y-1">
                <li><code>T001</code> / password123</li>
                <li><code>T002</code> / password123</li>
                <li><code>T003</code> / password123</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Student Codes:</h4>
              <ul className="space-y-1">
                <li><code>11111</code> - أحمد محمد علي</li>
                <li><code>22222</code> - فاطمة حسن إبراهيم</li>
                <li><code>33333</code> - محمد عبدالله خالد</li>
                <li><code>44444</code> - نورة سالم أحمد</li>
                <li><code>55555</code> - عمر علي حسن</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTest;