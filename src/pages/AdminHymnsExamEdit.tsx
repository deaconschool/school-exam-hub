import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { HymnsExam } from '../types/supabase';

interface HymnsExamFormData {
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  examMonth: number;
  examYear: number;
  // Dynamic grading criteria - matches table columns
  tasleemMax: number;
  tasleemMin: number;
  not2Max: number;
  not2Min: number;
  ada2Max: number;
  ada2Min: number;
  passPercentage: number; // Dynamic pass percentage
  isActive: boolean;
  status: 'draft' | 'published' | 'closed';
}

const AdminHymnsExamEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingExam, setLoadingExam] = useState(true);
  const [loadingOtherExams, setLoadingOtherExams] = useState(false);
  const [otherActiveExams, setOtherActiveExams] = useState<HymnsExam[]>([]);
  const [exam, setExam] = useState<HymnsExam | null>(null);

  const [formData, setFormData] = useState<HymnsExamFormData>({
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    examMonth: new Date().getMonth() + 1,
    examYear: new Date().getFullYear(),
    tasleemMax: 20,
    tasleemMin: 0,
    not2Max: 10,
    not2Min: 0,
    ada2Max: 10,
    ada2Min: 0,
    passPercentage: 60,
    isActive: false,
    status: 'draft'
  });

  // Calculate total marks and pass marks automatically
  const totalMarks = formData.tasleemMax + formData.not2Max + formData.ada2Max;
  const passMarks = Math.round((totalMarks * formData.passPercentage) / 100);

  // Load exam data for editing
  const loadExamData = async () => {
    if (!id) {
      alert('No exam ID provided');
      navigate('/admin/hymns');
      return;
    }

    setLoadingExam(true);
    try {
      const result = await AdminService.getHymnsExamById(id);
      if (result.success && result.data) {
        const examData = result.data;
        setExam(examData);

        // Populate form with existing exam data
        setFormData({
          title: {
            en: examData.title_en || '',
            ar: examData.title_ar || ''
          },
          description: {
            en: examData.description_en || '',
            ar: examData.description_ar || ''
          },
          examMonth: examData.exam_month,
          examYear: examData.exam_year,
          tasleemMax: examData.tasleem_max,
          tasleemMin: examData.tasleem_min,
          not2Max: examData.not2_max,
          not2Min: examData.not2_min,
          ada2Max: examData.ada2_max,
          ada2Min: examData.ada2_min,
          passPercentage: examData.pass_percentage,
          isActive: examData.is_active || false,
          status: examData.status as 'draft' | 'published' | 'closed'
        });

        // If this exam is active, load other active exams for warning
        if (examData.is_active) {
          await checkForOtherActiveExams();
        }
      } else {
        alert(`Failed to load exam: ${result.error}`);
        navigate('/admin/hymns');
      }
    } catch (error) {
      console.error('Error loading exam:', error);
      alert('Error loading exam');
      navigate('/admin/hymns');
    } finally {
      setLoadingExam(false);
    }
  };

  // Load other active Hymns exams when user tries to activate this exam
  const checkForOtherActiveExams = async () => {
    setLoadingOtherExams(true);
    try {
      const result = await AdminService.getHymnsExamsList({ isActive: true });
      if (result.success && result.data) {
        // Filter out the current exam from the list
        const others = result.data.filter(exam => exam.id !== id);
        setOtherActiveExams(others);
      }
    } catch (error) {
      console.error('Error loading active exams:', error);
    } finally {
      setLoadingOtherExams(false);
    }
  };

  // Check for other active exams when isActive changes to true
  useEffect(() => {
    if (formData.isActive && id) {
      checkForOtherActiveExams();
    } else {
      setOtherActiveExams([]);
    }
  }, [formData.isActive, id]);

  // Load exam data on component mount
  useEffect(() => {
    loadExamData();
  }, [id]);

  const handleInputChange = (field: keyof HymnsExamFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTitleChange = (lang: 'ar' | 'en', value: string) => {
    setFormData(prev => ({
      ...prev,
      title: {
        ...prev.title,
        [lang]: value
      }
    }));
  };

  const handleDescriptionChange = (lang: 'ar' | 'en', value: string) => {
    setFormData(prev => ({
      ...prev,
      description: {
        ...prev.description,
        [lang]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.title.ar || !formData.title.en) {
        alert('Please fill in both Arabic and English titles');
        return;
      }

      if (!id) {
        alert('No exam ID provided');
        return;
      }

      // If activating, deactivate all other Hymns exams first
      if (formData.isActive && !exam?.is_active) {
        // Note: This will be handled by the toggle function if needed
        // For now, we'll just continue with the update
      }

      // Update Hymns exam data matching the new table structure
      const examData = {
        title_en: formData.title.en,
        title_ar: formData.title.ar,
        description_en: formData.description.en,
        description_ar: formData.description.ar,
        exam_month: formData.examMonth,
        exam_year: formData.examYear,

        // Grading criteria embedded in exam
        tasleem_max: formData.tasleemMax,
        tasleem_min: formData.tasleemMin,

        not2_max: formData.not2Max,
        not2_min: formData.not2Min,

        ada2_max: formData.ada2Max,
        ada2_min: formData.ada2Min,

        pass_percentage: formData.passPercentage,
        is_active: formData.isActive,
        status: formData.status
      };

      const result = await AdminService.updateHymnsExam(id, examData);

      if (result.success) {
        alert('Hymns exam updated successfully!');
        navigate('/admin/hymns');
      } else {
        alert('Failed to update exam: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating exam:', error);
      alert('Error updating exam: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loadingExam) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam data...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Exam Not Found</h3>
          <p className="text-gray-600 mb-4">The requested exam could not be found.</p>
          <button
            onClick={() => navigate('/admin/hymns')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Hymns Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8" dir="ltr">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/hymns')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Hymns Exam</h1>
              <p className="text-gray-600 text-sm sm:text-base">Modify school-wide exam for all teachers and students</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title.ar || !formData.title.en}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto justify-center"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save Changes</span>
            <span className="sm:hidden">Save</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Exam Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📝 Exam Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Title (English)
                </label>
                <input
                  type="text"
                  value={formData.title.en}
                  onChange={(e) => handleTitleChange('en', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Christmas Hymns 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Title (Arabic)
                </label>
                <input
                  type="text"
                  value={formData.title.ar}
                  onChange={(e) => handleTitleChange('ar', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ألحان الكريسماس 2024"
                  required
                  style={{ direction: 'rtl', textAlign: 'right' }}
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active Exam
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month/Year
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.examMonth}
                    onChange={(e) => handleInputChange('examMonth', parseInt(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {monthNames.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={formData.examYear}
                    onChange={(e) => handleInputChange('examYear', parseInt(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Grading Criteria */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📊 Dynamic Grading Criteria Configuration
            </h2>

            <div className="space-y-6">
              {/* Tasleem Criteria */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  🎭 Delivery (Tasleem)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.tasleemMin}
                      onChange={(e) => handleInputChange('tasleemMin', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Score</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.tasleemMax}
                      onChange={(e) => handleInputChange('tasleemMax', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Not2 Criteria */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  🗣️ Pronunciation (Not2)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.not2Min}
                      onChange={(e) => handleInputChange('not2Min', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Score</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.not2Max}
                      onChange={(e) => handleInputChange('not2Max', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Ada2 Criteria */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  👥 Group Performance (Ada2)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.ada2Min}
                      onChange={(e) => handleInputChange('ada2Min', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Score</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.ada2Max}
                      onChange={(e) => handleInputChange('ada2Max', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Summary and Pass Marks */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium text-blue-900">📊 Total Marks</div>
                      <div className="text-sm text-blue-700">Auto-calculated</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      {totalMarks} pts
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <label className="block text-sm font-medium text-yellow-900 mb-2">
                      🎯 Pass Percentage
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.passPercentage}
                        onChange={(e) => handleInputChange('passPercentage', parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                      <span className="text-yellow-800 font-medium">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium text-green-900">✅ Pass Mark</div>
                      <div className="text-sm text-green-700">{formData.passPercentage}% of total</div>
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      {passMarks} pts
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exam Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              💭 Exam Description (Optional)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (English)
                </label>
                <textarea
                  value={formData.description.en}
                  onChange={(e) => handleDescriptionChange('en', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Instructions for teachers - Christmas Hymns evaluation for 2024..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Arabic)
                </label>
                <textarea
                  value={formData.description.ar}
                  onChange={(e) => handleDescriptionChange('ar', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="تعليمات للمعلمين - تقييم ألحان الكريسماس لعام 2024..."
                  style={{ direction: 'rtl', textAlign: 'right' }}
                />
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Important Notice
            </h3>
            <ul className="space-y-2 text-amber-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>This exam will be available to ALL teachers in the teacher portal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Teachers can grade any students using the existing 3-criteria system</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Uses existing teacher grading workflow (Tasleem, Not2, Ada2)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Only ONE exam can be active at a time to avoid conflicts</span>
              </li>
            </ul>
          </div>

          {/* Active Exam Warning */}
          {otherActiveExams.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Active Exam Conflict Warning
              </h3>
              <p className="text-red-700 mb-3">
                The following active Hymns exam(s) will be deactivated when you activate this exam:
              </p>
              <ul className="space-y-2 text-red-700">
                {otherActiveExams.map(exam => (
                  <li key={exam.id} className="flex items-center justify-between bg-white p-3 rounded border border-red-200">
                    <span>
                      <strong>{exam.title_en || exam.title_ar}</strong>
                      {exam.created_at && (
                        <span className="text-sm text-red-600 ml-2">
                          ({new Date(exam.created_at).toLocaleDateString()})
                        </span>
                      )}
                    </span>
                    <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                      Currently Active
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminHymnsExamEdit;