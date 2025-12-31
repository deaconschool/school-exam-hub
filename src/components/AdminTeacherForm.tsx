import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminService } from '@/services/adminService';
import { SupabaseService } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Key,
  Shield,
  Loader2,
  Users,
  GraduationCap
} from 'lucide-react';

interface TeacherFormData {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  is_active: boolean;
}

interface ClassInfo {
  id: string;
  name: string;
  stage_level: number;
}

const AdminTeacherForm: React.FC = () => {
  const [formData, setFormData] = useState<TeacherFormData>({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    is_active: true
  });
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Partial<Omit<TeacherFormData, 'is_active'>>>({});
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();

  // Set LTR direction when component mounts
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    return () => {
      // Restore original direction when unmounting
      const storedLanguage = localStorage.getItem('language') || 'ar';
      document.documentElement.setAttribute('dir', storedLanguage === 'ar' ? 'rtl' : 'ltr');
    };
  }, []);

  // Load all available classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      const response = await SupabaseService.getAllClassesWithIds();
      if (response.success && response.data) {
        setAllClasses(response.data);
      }
    };
    loadClasses();
  }, []);

  // Check if we're editing an existing teacher
  useEffect(() => {
    if (id) {
      setIsEditing(true);
      setTeacherId(id);
      loadTeacherData(id);
    }
  }, [id]);

  const loadTeacherData = async (teacherId: string) => {
    try {
      setIsLoading(true);
      const response = await AdminService.getTeacherById(teacherId);

      if (response.success && response.data) {
        setFormData({
          name: response.data.name || '',
          phone: response.data.phone || '',
          password: '', // Don't populate password for security
          confirmPassword: '',
          is_active: response.data.is_active !== false // Default to true
        });
        // Load assigned classes if any
        if (response.data.assigned_classes && Array.isArray(response.data.assigned_classes)) {
          setSelectedClassIds(response.data.assigned_classes);
        }
      } else {
        alert('Failed to load teacher data. The teacher may not exist.');
        navigate('/admin/teachers/list');
      }
    } catch (error) {
      alert('Error loading teacher data. Please try again.');
      navigate('/admin/teachers/list');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TeacherFormData> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Teacher name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Teacher name must be at least 2 characters';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

  
    // Password validation (required for new teachers)
    if (!isEditing && !formData.password.trim()) {
      newErrors.password = 'Password is required for new teachers';
    } else if (formData.password && formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    // Confirm password validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof TeacherFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Prepare data for API
      const teacherData: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        is_active: formData.is_active
      };

      // Only include password if it's provided
      if (formData.password.trim()) {
        teacherData.password = formData.password.trim();
      }

      let response;
      let currentTeacherId = teacherId;

      if (isEditing && teacherId) {
        response = await AdminService.updateTeacher(teacherId, teacherData);
      } else {
        response = await AdminService.createTeacher(teacherData);
        if (response.success && response.data?.id) {
          currentTeacherId = response.data.id;
        }
      }

      if (response.success) {
        // Save assigned classes
        if (currentTeacherId) {
          await SupabaseService.updateTeacherAssignedClasses(currentTeacherId, selectedClassIds);
        }

        const successMessage = isEditing
          ? 'Teacher updated successfully!'
          : 'Teacher created successfully!';

        alert(successMessage);
        navigate('/admin/teachers/list');
      } else {
        alert(`Failed to ${isEditing ? 'update' : 'create'} teacher: ${response.error}`);
      }
    } catch (error) {
      alert(`Failed to ${isEditing ? 'update' : 'create'} teacher. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      navigate('/admin/teachers/list');
    } else {
      navigate('/admin/teachers');
    }
  };

  if (isLoading && isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading teacher data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleCancel}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditing ? 'Edit Teacher' : 'Add New Teacher'}
            </h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {isEditing ? 'Teacher Information' : 'New Teacher Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Teacher Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter teacher's full name"
                  className={errors.name ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number (optional)"
                  className={errors.phone ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

  
              {/* Password */}
              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password (min 4 characters)"
                    className={errors.password ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              )}

              {/* Confirm Password */}
              {(formData.password || !isEditing) && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Confirm Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm password"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Assigned Classes */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Assigned Classes
                  <span className="text-xs text-gray-500 font-normal">
                    (Classes this teacher can view grades for)
                  </span>
                </Label>

                {allClasses.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No classes available</p>
                ) : (
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                    {allClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="flex items-center space-x-3 py-2 hover:bg-gray-100 rounded px-2 transition-colors"
                      >
                        <Checkbox
                          id={`class-${cls.id}`}
                          checked={selectedClassIds.includes(cls.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedClassIds([...selectedClassIds, cls.id]);
                            } else {
                              setSelectedClassIds(selectedClassIds.filter(id => id !== cls.id));
                            }
                          }}
                          disabled={isLoading}
                        />
                        <Label
                          htmlFor={`class-${cls.id}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <span className="font-medium text-gray-900">Stage {cls.stage_level}</span>
                          <span className="text-gray-600 ml-2"> - {cls.name}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {selectedClassIds.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
                    <Users className="w-4 h-4" />
                    <span>{selectedClassIds.length} class{selectedClassIds.length !== 1 ? 'es' : ''} selected</span>
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Active teacher account
                </Label>
              </div>
              <p className="text-xs text-gray-500">
                Inactive teachers cannot log in to the system
              </p>

              {/* Form Actions */}
              <div className="flex items-center gap-4 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isEditing ? 'Update Teacher' : 'Create Teacher'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Information */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Information</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Teacher name is required and must be at least 2 characters</li>
              <li>• Phone number is optional</li>
              {!isEditing && <li>• Password is required for new teachers (min 4 characters)</li>}
              <li>• Teacher ID will be automatically generated (e.g., T001, T002)</li>
              <li>• <strong>Assigned Classes</strong>: Select which classes this teacher can view grades for</li>
              <li>• Teachers can only view grades for their assigned classes in the grade viewing portal</li>
              <li>• Active teachers can log in and grade students</li>
              <li>• Inactive teachers cannot access the system</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminTeacherForm;