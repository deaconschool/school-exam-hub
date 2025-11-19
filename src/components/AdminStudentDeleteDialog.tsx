import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Trash2,
  User,
  Hash,
  School,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';
import { AdminService } from '@/services/adminService';

interface AdminStudent {
  id: string;
  code: string;
  name: string;
  class_name?: string;
  stage_name?: string;
  level?: string;
}

interface AdminStudentDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  student: AdminStudent;
}

const AdminStudentDeleteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  student
}: AdminStudentDeleteDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleDelete = async () => {
    // Prevent accidental deletion
    if (confirmationText !== student.code) {
      setDeleteError('Please type the student code exactly as shown to confirm deletion');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await AdminService.deleteStudent(student.id);

      if (response.success) {
        setIsConfirmed(true);
        setTimeout(() => {
          onConfirm();
          onClose();
          // Reset state after successful deletion
          setIsConfirmed(false);
          setConfirmationText('');
        }, 1500);
      } else {
        setDeleteError(response.error || 'Failed to delete student');
      }
    } catch (error) {
      setDeleteError('An unexpected error occurred while deleting the student');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setDeleteError(null);
      setConfirmationText('');
      setIsConfirmed(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-red-600">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5" />
            </div>
            Delete Student
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please verify the student information before proceeding.
          </DialogDescription>
        </DialogHeader>

        {isConfirmed ? (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Student Deleted Successfully
            </h3>
            <p className="text-gray-600 text-sm">
              {student.name} has been removed from the system.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Student Information */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Student to Delete
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Code:</span>
                  <Badge variant="outline" className="font-mono">
                    {student?.code || 'N/A'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{student?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Class/Stage:</span>
                  <span className="font-medium">
                    {student?.class_name || student?.class || 'N/A'} / {student?.stage_name || student?.stage || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Level:</span>
                  <Badge variant="secondary">
                    Level {student?.level || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Warning Alert */}
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Warning:</strong> Deleting this student will permanently remove all their data from the system.
              </AlertDescription>
            </Alert>

            {/* Delete Error */}
            {deleteError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {deleteError}
                </AlertDescription>
              </Alert>
            )}

            {/* Confirmation Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Type <code className="bg-gray-100 px-2 py-1 rounded font-mono text-red-600">{student.code}</code> to confirm deletion:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={`Enter "${student.code}"`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isDeleting}
              />
            </div>

            {/* Action Buttons */}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || confirmationText !== student.code}
                className="flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Student
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminStudentDeleteDialog;