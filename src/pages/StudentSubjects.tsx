import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import { DataService } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, FileText, School, ArrowLeft, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { Exam } from '@/data/types';

const StudentSubjects = () => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [stageData, setStageData] = useState<any>(null);
  const [className, setClassName] = useState<string>('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [exams, setExams] = useState<Exam[]>([]);
  const isRtl = language === 'ar';

  useEffect(() => {
    const stageLevel = searchParams.get('stage');
    const classParam = searchParams.get('class');

    if (stageLevel && classParam) {
      const stage = DataService.getStages().find(s => s.level === parseInt(stageLevel));
      if (stage) {
        setStageData(stage);
        setClassName(decodeURIComponent(classParam));

        // Get available subjects for this stage and class
        const subjects = DataService.getAvailableSubjectsForStageClass(
          parseInt(stageLevel),
          decodeURIComponent(classParam)
        );
        setAvailableSubjects(subjects);
      }
    }
  }, [searchParams]);

  const handleSubjectChange = (subjectValue: string) => {
    const stageLevel = searchParams.get('stage');
    setSelectedSubject(subjectValue);

    if (stageLevel) {
      const subjectExams = DataService.getExamsByStageClassSubject(
        parseInt(stageLevel),
        className,
        subjectValue
      );
      setExams(subjectExams);
    }
  };

  const clearSelection = () => {
    setSelectedSubject('');
    setExams([]);
  };

  const goToClasses = () => {
    const stageLevel = searchParams.get('stage');
    window.location.href = `/student/classes?stage=${stageLevel}`;
  };

  const goToStages = () => {
    window.location.href = '/student';
  };

  const openExam = (url: string) => {
    window.open(url, '_blank');
  };

  if (!stageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('Loading...', 'Loading...')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <Header />

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Compact Navigation Bar */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 mb-8">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm">
              <span
                className="text-slate-600 hover:text-slate-900 cursor-pointer transition-colors font-medium"
                onClick={goToStages}
              >
                {language === 'ar' ? stageData.name_ar : stageData.name_en}
              </span>
              <span className="text-slate-400">/</span>
              <span
                className="text-slate-600 hover:text-slate-900 cursor-pointer transition-colors font-medium"
                onClick={goToClasses}
              >
                {className}
              </span>
              {selectedSubject && (
                <>
                  <span className="text-slate-400">/</span>
                  <span className="text-blue-600 font-semibold">{selectedSubject}</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {selectedSubject && (
                <Button
                  onClick={clearSelection}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50/70 h-8 px-3 rounded-lg transition-all duration-200 border border-amber-200/50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">{t('مسح', 'Clear')}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Subject Selection */}
        {!selectedSubject && (
          <div className="max-w-md mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 px-6 py-5 border-b border-slate-200/30">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-slate-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-md">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">
                    {t('اختر المادة', 'Select Subject')}
                  </h2>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                  <SelectTrigger className="w-full h-12 border-slate-300 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-lg text-base">
                    <SelectValue placeholder={t('-- اختر المادة --', '-- Select Subject --')} />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg">
                    {availableSubjects.map((subject) => (
                      <SelectItem
                        key={subject}
                        value={subject}
                        className="py-2.5 hover:bg-slate-50 focus:bg-blue-50 cursor-pointer transition-colors"
                      >
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Exam Cards */}
        {selectedSubject && (
          <div className="animate-fade-in">
            {/* Section Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/20 shadow-md">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <FileText className="w-3 h-3 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  {t('امتحانات', 'Exams')} {selectedSubject}
                </h2>
                <span className="text-slate-500">•</span>
                <span className="text-slate-600 font-medium text-sm">{className}</span>
              </div>
            </div>

            {exams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {exams.map((exam) => (
                  <Card
                    key={exam.id}
                    onClick={() => openExam(exam.url)}
                    className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 overflow-hidden rounded-xl"
                  >
                    {/* Card Top Accent */}
                    <div className="h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:h-1 transition-all duration-300"></div>

                    <CardContent className="p-6 text-center space-y-4">
                      {/* Icon Container */}
                      <div className="w-14 h-14 mx-auto bg-gradient-to-br from-slate-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 group-hover:from-blue-100 group-hover:to-indigo-100">
                        <FileText className="w-7 h-7 text-slate-600 group-hover:text-blue-600 transition-colors" />
                      </div>

                      {/* Exam Title */}
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-slate-900 transition-colors leading-tight">
                        {exam.title}
                      </h3>

                      {/* Metadata */}
                      <div className="flex items-center justify-center gap-4 text-slate-600 text-sm">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{selectedSubject}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5" />
                          <span>{className}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow hover:shadow-md ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <span>{t('فتح', 'Open')}</span>
                          <span className={isRtl ? 'rotate-180' : ''}>→</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-sm mx-auto bg-white/60 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                  <div className="w-14 h-14 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="w-7 h-7 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    {t('لا توجد امتحانات', 'No Exams Available')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('لا توجد امتحانات متاحة حالياً', 'No exams are currently available')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
        `}</style>
      </main>
    </div>
  );
};

export default StudentSubjects;