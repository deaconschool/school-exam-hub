import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { ExamNotes } from '@/types/notes';
import { Loader2, Save, Eye, EyeOff, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ExamNotesEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: ExamNotes) => Promise<boolean>;
  initialNotes?: ExamNotes | null;
  studentName?: string;
}

const displayModes = [
  {
    value: 'show',
    label: 'Show Grade',
    icon: Eye,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Display the grade normally (green if passing, orange if failing)'
  },
  {
    value: 'warning',
    label: 'Show with Warning',
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'Show grade but with orange warning theme'
  },
  {
    value: 'danger',
    label: 'Show with Danger',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-300',
    description: 'Show grade with red danger theme'
  },
  {
    value: 'hint',
    label: 'Hide - Show Hint',
    icon: EyeOff,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    description: 'Hide grade and show a hint message instead'
  },
  {
    value: 'hide',
    label: 'Hide Grade',
    icon: EyeOff,
    color: 'bg-slate-100 text-slate-800 border-slate-400',
    description: 'Completely hide the grade with lock icon'
  },
];

const ExamNotesEditor = ({ isOpen, onClose, onSave, initialNotes, studentName }: ExamNotesEditorProps) => {
  const [displayMode, setDisplayMode] = useState<ExamNotes['display_mode']>('show');
  const [hintMessageAr, setHintMessageAr] = useState('');
  const [hintMessageEn, setHintMessageEn] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens or initialNotes changes
  useEffect(() => {
    if (initialNotes) {
      setDisplayMode(initialNotes.display_mode || 'show');
      setHintMessageAr(initialNotes.hint_message_ar || '');
      setHintMessageEn(initialNotes.hint_message_en || '');
    } else {
      setDisplayMode('show');
      setHintMessageAr('');
      setHintMessageEn('');
    }
  }, [initialNotes, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const notes: ExamNotes = {
        display_mode: displayMode,
        hint_message_ar: displayMode === 'hint' ? hintMessageAr.trim() : undefined,
        hint_message_en: displayMode === 'hint' ? hintMessageEn.trim() : undefined,
      };

      const success = await onSave(notes);
      if (success) {
        toast.success('Grade display settings saved');
        // Reset form after successful save
        setDisplayMode('show');
        setHintMessageAr('');
        setHintMessageEn('');
        onClose();
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setDisplayMode('show');
    setHintMessageAr('');
    setHintMessageEn('');
  };

  const selectedMode = displayModes.find(m => m.value === displayMode);
  const Icon = selectedMode?.icon || Eye;
  const showHintFields = displayMode === 'hint';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {studentName && <span>Grade Display: {studentName}</span>}
            {!studentName && <span>Grade Display Settings</span>}
          </DialogTitle>
          <DialogDescription>
            Configure how this grade should be displayed to the student.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Display Mode Selection */}
          <div className="space-y-2">
            <Label htmlFor="display-mode">Display Mode</Label>
            <Select value={displayMode} onValueChange={(value: any) => setDisplayMode(value)}>
              <SelectTrigger id="display-mode">
                <SelectValue placeholder="Select display mode" />
              </SelectTrigger>
              <SelectContent>
                {displayModes.map((mode) => {
                  const ModeIcon = mode.icon;
                  return (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div className="flex items-center gap-2">
                        <ModeIcon className="w-4 h-4" />
                        <span>{mode.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedMode && (
              <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                <Icon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{selectedMode.description}</span>
              </p>
            )}
          </div>

          {/* Hint Message Fields (only shown when mode is 'hint') */}
          {showHintFields && (
            <>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Hint Mode:</strong> The grade will be hidden and only the hint message will be shown to the student.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hint-ar">Arabic Hint (العربية)</Label>
                <Textarea
                  id="hint-ar"
                  value={hintMessageAr}
                  onChange={(e) => setHintMessageAr(e.target.value)}
                  placeholder="أدخل التلميح باللغة العربية..."
                  dir="rtl"
                  className="min-h-[60px] resize-none"
                  lang="ar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hint-en">English Hint</Label>
                <Textarea
                  id="hint-en"
                  value={hintMessageEn}
                  onChange={(e) => setHintMessageEn(e.target.value)}
                  placeholder="Enter hint in English..."
                  className="min-h-[60px] resize-none"
                />
              </div>

              {/* Hint Preview */}
              {(hintMessageAr || hintMessageEn) && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Label className="text-xs text-gray-500 mb-1 block">Hint Preview:</Label>
                  <div className="px-3 py-2 rounded bg-yellow-100 border border-yellow-300 text-yellow-900">
                    <p className="text-sm" dir="auto">
                      {hintMessageAr || hintMessageEn}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Display mode preview */}
          {!showHintFields && selectedMode && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Label className="text-xs text-gray-500 mb-2 block">Preview:</Label>
              <div className={`px-3 py-2 rounded border ${selectedMode.color} flex items-center gap-2`}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{selectedMode.label}</span>
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
            Reset to Default
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
              disabled={isSaving}
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
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExamNotesEditor;
