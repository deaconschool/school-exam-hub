import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StudentNotes } from '@/types/notes';
import { AlertTriangle, FileText, AlertOctagon, MessageSquare, Edit } from 'lucide-react';

interface StudentNotesCellProps {
  notes: StudentNotes | null;
  onEdit: () => void;
}

const StudentNotesCell = ({ notes, onEdit }: StudentNotesCellProps) => {
  if (!notes) {
    return (
      <div className="min-w-[100px]">
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="text-gray-400 hover:text-gray-600 h-7 px-2 text-xs"
        >
          <Edit className="w-3 h-3 mr-1" />
          Add Note
        </Button>
      </div>
    );
  }

  const getActionConfig = (actionType: StudentNotes['action_type']) => {
    switch (actionType) {
      case 'hint':
        return {
          icon: MessageSquare,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          label: 'Hint'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          label: 'Warning'
        };
      case 'danger':
        return {
          icon: AlertOctagon,
          color: 'bg-red-100 text-red-800 border-red-300',
          label: 'Danger'
        };
      default:
        return {
          icon: FileText,
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          label: 'Note'
        };
    }
  };

  const config = getActionConfig(notes.action_type);
  const Icon = config.icon;

  return (
    <div className="min-w-[100px]">
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={`border ${config.color} text-xs max-w-[150px] truncate cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={onEdit}
          title={`${notes.message_en || notes.message_ar}`}
        >
          <Icon className="w-3 h-3 mr-1" />
          <span className="truncate">{config.label}</span>
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="text-gray-400 hover:text-gray-600 h-7 w-7 p-0"
        >
          <Edit className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default StudentNotesCell;
