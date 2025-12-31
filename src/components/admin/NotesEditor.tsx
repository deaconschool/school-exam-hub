import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StudentNotes } from '@/types/notes';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface NotesEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: StudentNotes) => Promise<boolean>;
  initialNotes?: StudentNotes | null;
  studentName?: string;
}

const actionTypes = [
  { value: 'note', label: 'Note', labelAr: 'ملاحظة', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'hint', label: 'Hint', labelAr: 'تلميح', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'warning', label: 'Warning', labelAr: 'تحذير', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'danger', label: 'Danger', labelAr: 'خطر', color: 'bg-red-100 text-red-800 border-red-300' },
];

const NotesEditor = ({ isOpen, onClose, onSave, initialNotes, studentName }: NotesEditorProps) => {
  const [actionType, setActionType] = useState<'hint' | 'warning' | 'danger' | 'note'>('note');
  const [messageAr, setMessageAr] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens or initialNotes changes
  useEffect(() => {
    if (initialNotes) {
      setActionType(initialNotes.action_type);
      setMessageAr(initialNotes.message_ar || '');
      setMessageEn(initialNotes.message_en || '');
    } else {
      setActionType('note');
      setMessageAr('');
      setMessageEn('');
    }
  }, [initialNotes, isOpen]);

  const handleSave = async () => {
    if (!messageAr.trim() && !messageEn.trim()) {
      toast.error('Please enter a message in at least one language');
      return;
    }

    setIsSaving(true);
    try {
      const notes: StudentNotes = {
        action_type: actionType,
        message_ar: messageAr.trim(),
        message_en: messageEn.trim(),
      };

      const success = await onSave(notes);
      if (success) {
        toast.success('Notes saved successfully');
        // Reset form after successful save
        setActionType('note');
        setMessageAr('');
        setMessageEn('');
        onClose();
      }
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setActionType('note');
    setMessageAr('');
    setMessageEn('');
  };

  const selectedAction = actionTypes.find(a => a.value === actionType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {studentName && <span>Notes for: {studentName}</span>}
            {!studentName && <span>Edit Student Notes</span>}
          </DialogTitle>
          <DialogDescription>
            Add notes about this student that will be displayed when viewing grades.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Action Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="action-type">Note Type</Label>
            <Select value={actionType} onValueChange={(value: any) => setActionType(value)}>
              <SelectTrigger id="action-type">
                <SelectValue placeholder="Select note type" />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs border ${action.color}`}>
                        {action.label}
                      </span>
                      <span className="text-gray-500">- {action.labelAr}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAction && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: <span className={`px-2 py-0.5 rounded text-xs border ${selectedAction.color}`}>
                  {selectedAction.label} / {selectedAction.labelAr}
                </span>
              </p>
            )}
          </div>

          {/* Arabic Message */}
          <div className="space-y-2">
            <Label htmlFor="message-ar">Arabic Message (العربية)</Label>
            <Textarea
              id="message-ar"
              value={messageAr}
              onChange={(e) => setMessageAr(e.target.value)}
              placeholder="أدخل الرسالة باللغة العربية..."
              dir="rtl"
              className="min-h-[80px] resize-none"
              lang="ar"
            />
          </div>

          {/* English Message */}
          <div className="space-y-2">
            <Label htmlFor="message-en">English Message</Label>
            <Textarea
              id="message-en"
              value={messageEn}
              onChange={(e) => setMessageEn(e.target.value)}
              placeholder="Enter message in English..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Preview */}
          {(messageAr || messageEn) && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Label className="text-xs text-gray-500 mb-1 block">Preview:</Label>
              <div className={`px-3 py-2 rounded border ${selectedAction?.color || 'bg-gray-100'}`}>
                <p className="text-sm font-medium" dir="auto">
                  {messageAr || messageEn}
                </p>
                {!messageAr && messageEn && (
                  <p className="text-xs mt-1 opacity-75">{messageEn}</p>
                )}
                {messageAr && !messageEn && (
                  <p className="text-xs mt-1 opacity-75">{messageAr}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || (!messageAr.trim() && !messageEn.trim())}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Notes
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotesEditor;
