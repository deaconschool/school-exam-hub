import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminService } from '@/services/adminService';
import { SupabaseService } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  X,
  User,
  School,
  Hash,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface StudentFormData {
  code: string;
  name: string;
  class: string;
  level: number;
  notes: string;
}

interface FormErrors {
  code?: string;
  name?: string;
  class?: string;
  level?: string;
  general?: string;
}

const AdminStudentForm = () => {
  const navigate = useNavigate();
  const { action, studentId } = useParams();
  const { adminName } = useAuth();

  const [formData, setFormData] = useState<StudentFormData>({
    code: '',
    name: '',
    class: '',
    level: 0,
    notes: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stages, setStages] = useState<Array<{ name: string; level: number }>>([]);
  const [stageClassesMap, setStageClassesMap] = useState<Record<string, string[]>>({});
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const isEdit = action === 'edit' && studentId;
  const isView = action === 'view' && studentId;
  const title = isEdit ? 'Edit Student' : isView ? 'View Student Details' : 'Add New Student';
  const isReadOnly = isView;

  // Load stages and classes on component mount
  useEffect(() => {
    loadStagesAndClasses();
  }, []);

  // Load student data when editing/viewing
  useEffect(() => {
    if ((isEdit || isView) && studentId && stages.length > 0) {
      loadStudentData();
    }
  }, [studentId, isEdit, isView, stages.length]);

  const loadStagesAndClasses = async () => {
    setIsLoadingOptions(true);
    try {
      const response = await SupabaseService.getStagesAndClasses();
      if (response.success && response.data) {
        setStages(response.data.stages);
        setStageClassesMap(response.data.stageClasses);
      }
    } catch (error) {
      // Error loading stages and classes
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const loadStudentData = async () => {
    if (!studentId) return;

    setIsLoading(true);
    try {
      const response = await AdminService.getStudentById(studentId);
      if (response.success && response.data) {
        const student = response.data;

        // Find stage name based on student level
        const stage = stages.find(s => s.level === student.level);
        const stageName = stage?.name || '';

        setFormData({
          code: student.code || '',
          name: student.name || '',
          class: student.class || '',
          level: student.level || 0,
          notes: ''
        });
      } else {
        setErrors({ general: 'Failed to load student data' });
      }
    } catch (error) {
      setErrors({ general: 'Error loading student data' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Student code is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Student name is required';
    }

    if (!formData.class.trim()) {
      newErrors.class = 'Class is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadOnly) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Find the stage name based on level
      const stage = stages.find(s => s.level === formData.level);

      const submitData = {
        ...formData,
        stage: stage?.name || '',
        is_active: true
      };

      let response;
      if (isEdit && studentId) {
        response = await AdminService.updateStudent(studentId, submitData);
      } else {
        response = await AdminService.createStudent(submitData);
      }

      if (response.success) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/admin/students/list');
        }, 1500);
      } else {
        setErrors({ general: response.error || 'Failed to save student' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof StudentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCancel = () => {
    navigate('/admin/students/list');
  };

  // Get classes for the selected level
  const getClassesForLevel = (level: number): string[] => {
    const stage = stages.find(s => s.level === level);
    if (!stage) return [];
    return stageClassesMap[stage.name] || [];
  };

  const availableClasses = getClassesForLevel(formData.level);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600 mb-4">
              {isEdit ? 'Student updated successfully' : 'Student created successfully'}
            </p>
            <p className="text-sm text-gray-500">Redirecting to student list...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Students
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">
                {isView ? 'View student information' : 'Fill in the student details below'}
              </p>
            </div>
          </div>
          {!isReadOnly && (
            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
              {isEdit ? 'Edit Mode' : 'Create Mode'}
            </Badge>
          )}
        </div>

        {/* General Error */}
        {errors.general && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {errors.general}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Code */}
                <div>
                  <Label htmlFor="code" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Student Code *
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="Enter student code (e.g., STU001)"
                    className={`mt-1 ${errors.code ? 'border-red-300 focus:border-red-500' : ''}`}
                    disabled={isReadOnly || isSubmitting}
                    maxLength={50}
                  />
                  {errors.code && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.code}
                    </p>
                  )}
                </div>

                {/* Student Name */}
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Student Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full student name"
                    className={`mt-1 ${errors.name ? 'border-red-300 focus:border-red-500' : ''}`}
                    disabled={isReadOnly || isSubmitting}
                    maxLength={100}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Stage/Level */}
                <div>
                  <Label htmlFor="level" className="flex items-center gap-2">
                    <School className="w-4 h-4" />
                    Stage *
                  </Label>
                  <Select
                    value={formData.level.toString()}
                    onValueChange={(value) => {
                      const newLevel = parseInt(value);
                      handleInputChange('level', newLevel);
                      // Clear class when level changes
                      handleInputChange('class', '');
                    }}
                    disabled={isReadOnly || isSubmitting || isLoadingOptions}
                  >
                    <SelectTrigger className={`mt-1 ${errors.level ? 'border-red-300 focus:border-red-500' : ''}`}>
                      <SelectValue placeholder={isLoadingOptions ? "Loading stages..." : "Select stage"} />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.level} value={stage.level.toString()}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.level && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.level}
                    </p>
                  )}
                </div>

                {/* Class */}
                <div>
                  <Label htmlFor="class" className="flex items-center gap-2">
                    <School className="w-4 h-4" />
                    Class *
                  </Label>
                  <Select
                    value={formData.class}
                    onValueChange={(value) => handleInputChange('class', value)}
                    disabled={isReadOnly || isSubmitting || availableClasses.length === 0}
                  >
                    <SelectTrigger className={`mt-1 ${errors.class ? 'border-red-300 focus:border-red-500' : ''}`}>
                      <SelectValue placeholder={availableClasses.length === 0 ? "Select stage first" : "Select class"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClasses.map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.class && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.class}
                    </p>
                  )}
                  {formData.level > 0 && availableClasses.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {availableClasses.length} classes available for selected stage
                    </p>
                  )}
                </div>

                {/* Notes - spans full width */}
                <div className="md:col-span-2">
                  <Label htmlFor="notes" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes about the student (optional)"
                    className="mt-1 resize-none"
                    rows={3}
                    disabled={isReadOnly || isSubmitting}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.notes.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {isEdit ? 'Modify the student information above' : 'All fields marked with * are required'}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  {!isReadOnly && (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {isEdit ? 'Update Student' : 'Create Student'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStudentForm;