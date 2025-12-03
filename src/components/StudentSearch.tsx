import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SupabaseService } from '@/services/supabaseService';
import { useStudentSearchCache } from '@/hooks/useStudentCache';
import { Student } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Search, User, Plus, AlertCircle, CheckCircle } from 'lucide-react';

interface StudentSearchProps {
  onStudentAdd: (student: Student) => void;
  batchedStudents: string[]; // Array of student codes already in batch
}

const StudentSearch = ({ onStudentAdd, batchedStudents }: StudentSearchProps) => {
  const { t, language } = useLanguage();
  const [searchCode, setSearchCode] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isRtl = language === 'ar';

  // Use enhanced search cache hook
  const { getSearchResults, setSearchResults: cacheSearchResults } = useStudentSearchCache();

  // No debouncing needed - search only on button click or Enter key

  // Batched students set for quick lookup
  const batchedStudentsSet = useMemo(() => new Set(batchedStudents), [batchedStudents]);

  // Convert Supabase student to local Student format (cached function)
  const convertSupabaseStudent = useCallback((supabaseStudent: any): Student => ({
    code: supabaseStudent.code,
    name: supabaseStudent.name,
    class: supabaseStudent.class,
    level: supabaseStudent.level,
    stage: supabaseStudent.stage || ''
  }), []);

  // Optimized search function with enhanced caching and debouncing
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setError('');
      return;
    }

    // Check enhanced cache first
    const cachedResults = getSearchResults(searchTerm.trim());
    if (cachedResults) {
      setSearchResults(cachedResults);
      setError(cachedResults.length === 0 ? t('لم يتم العثور على طالب بهذا الكود', 'No student found with this code') : '');
      return;
    }

    setIsSearching(true);
    setError('');
    setSelectedStudent(null);

    try {
      let foundStudents: Student[] = [];

      // Try exact match first using Supabase
      const exactMatchResponse = await SupabaseService.getStudentByCode(searchTerm.trim());

      if (exactMatchResponse.success && exactMatchResponse.data) {
        const localStudent = convertSupabaseStudent(exactMatchResponse.data);
        foundStudents = [localStudent];
      } else {
        // Try partial search using Supabase search functionality
        const searchResponse = await SupabaseService.searchStudents(searchTerm.trim());

        if (searchResponse.success && searchResponse.data) {
          foundStudents = searchResponse.data.map(convertSupabaseStudent);
        }
      }

      // Cache the results using enhanced cache
      cacheSearchResults(searchTerm.trim(), foundStudents);

      setSearchResults(foundStudents);

      // Show error if no students found
      if (foundStudents.length === 0) {
        setError(t('لم يتم العثور على طالب بهذا الكود', 'No student found with this code'));
      }
    } catch (err) {
      setError(t('حدث خطأ في البحث', 'Search error occurred'));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [t, convertSupabaseStudent, getSearchResults, cacheSearchResults]);

  // Manual search function (for button click or Enter key)
  const handleSearch = useCallback(() => {
    performSearch(searchCode);
  }, [performSearch, searchCode]);

  // Handle input change without automatic search
  const handleInputChange = (value: string) => {
    setSearchCode(value);
    // Clear previous search results when input changes
    setSearchResults([]);
    setError('');
    setSelectedStudent(null);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Select a student from search results
  const handleStudentSelect = useCallback((student: Student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    // Don't set search code - keep it empty for faster next search
    setSearchCode('');
    setSuccess('');
  }, []);

  // Add student to batch
  const handleAddStudent = useCallback(() => {
    if (!selectedStudent) {
      setError(t('الرجاء اختيار طالب أولاً', 'Please select a student first'));
      return;
    }

    if (batchedStudentsSet.has(selectedStudent.code)) {
      setError(t('هذا الطالب موجود بالفعل في الدفعة', 'This student is already in the batch'));
      return;
    }

    onStudentAdd(selectedStudent);

    // Show brief success message and immediately clear the form
    setSuccess(t(`تمت إضافة الطالب ${selectedStudent.name} إلى الدفعة بنجاح`, `Student ${selectedStudent.name} added to batch successfully`));
    setError('');

    // Clear form immediately for next search
    setSelectedStudent(null);
    setSearchCode('');
    setSearchResults([]);

    // Clear success message after 1 second (shorter than before)
    setTimeout(() => {
      setSuccess('');
    }, 1000);
  }, [selectedStudent, batchedStudentsSet, onStudentAdd, t]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchCode('');
    setSearchResults([]);
    setSelectedStudent(null);
    setError('');
    setSuccess('');
  }, []);

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          {t('البحث عن الطلاب', 'Search Students')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="space-y-3">
          <Label htmlFor="student-code" className="text-sm font-medium">
            {t('كود الطالب', 'Student Code')}
          </Label>
          <div className="flex gap-3">
            <Input
              id="student-code"
              type="text"
              value={searchCode}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('أدخل كود الطالب للبحث', 'Enter student code to search')}
              className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchCode.trim()}
              className="flex items-center gap-2"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
              {t('بحث', 'Search')}
            </Button>
            <Button
              onClick={handleClearSearch}
              variant="outline"
              disabled={!searchCode && searchResults.length === 0}
            >
              {t('مسح', 'Clear')}
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t('نتائج البحث', 'Search Results')} ({searchResults.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((student) => {
                const isAlreadyAdded = batchedStudentsSet.has(student.code);
                return (
                  <div
                    key={student.code}
                    onClick={() => handleStudentSelect(student)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{student.name}</p>
                          <p className="text-sm text-slate-600">
                            {t('كود', 'Code')}: {student.code} | {t('فصل', 'Class')}: {student.class}
                          </p>
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        isAlreadyAdded
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {isAlreadyAdded
                          ? t('مضاف بالفعل', 'Already Added')
                          : t('متاح', 'Available')
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Student */}
        {selectedStudent && (
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-blue-900">
                  {t('الطالب المحدد', 'Selected Student')}
                </h4>
                <Button
                  onClick={() => {
                    setSelectedStudent(null);
                    setSearchCode('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  {t('إلغاء الاختيار', 'Cancel Selection')}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-blue-900">{selectedStudent.name}</p>
                  <p className="text-sm text-blue-700">
                    {t('كود', 'Code')}: {selectedStudent.code} | {t('فصل', 'Class')}: {selectedStudent.class} | {t('مرحلة', 'Stage')}: {selectedStudent.stage}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <Button
                  onClick={handleAddStudent}
                  disabled={batchedStudentsSet.has(selectedStudent.code)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('إضافة إلى الدفعة', 'Add to Batch')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-sm text-slate-600 space-y-1">
          <p>• {t('أدخل كود الطالب ثم اضغط على زر البحث', 'Enter student code then click search button')}</p>
          <p>• {t('يمكنك البحث بكود كامل أو جزء منه', 'You can search with full or partial code')}</p>
          <p>• {t('اختر الطالب من النتائج لإضافته إلى الدفعة', 'Select student from results to add to batch')}</p>
          <p>• {t('يمكن إضافة عدة طلاب إلى الدفعة', 'You can add multiple students to the batch')}</p>
          <p>• {t('استخدم مفتاح Enter للبحث السريع', 'Use Enter key for quick search')}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
const MemoizedStudentSearch = React.memo(StudentSearch);

export default MemoizedStudentSearch;