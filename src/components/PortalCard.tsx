import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface PortalCardProps {
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  icon: LucideIcon;
  color: 'student' | 'teacher' | 'admin';
  route: string;
}

const PortalCard = ({ title, description, icon: Icon, color, route }: PortalCardProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const colorClasses = {
    student: 'border-student hover:shadow-[0_20px_25px_-5px_hsl(var(--student-primary)/0.2)]',
    teacher: 'border-teacher hover:shadow-[0_20px_25px_-5px_hsl(var(--teacher-primary)/0.2)]',
    admin: 'border-admin hover:shadow-[0_20px_25px_-5px_hsl(var(--admin-primary)/0.2)]',
  };

  const iconColorClasses = {
    student: 'text-student bg-student/10',
    teacher: 'text-teacher bg-teacher/10',
    admin: 'text-admin bg-admin/10',
  };

  return (
    <Card
      onClick={() => navigate(route)}
      className={`
        cursor-pointer p-8 
        transition-all duration-300 
        hover:-translate-y-3
        border-2 ${colorClasses[color]}
        bg-card hover:bg-card/80
        group
      `}
    >
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Icon */}
        <div className={`
          w-20 h-20 rounded-full 
          flex items-center justify-center
          ${iconColorClasses[color]}
          transition-transform duration-300
          group-hover:scale-110
        `}>
          <Icon className="w-10 h-10" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground">
          {t(title.ar, title.en)}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground text-lg leading-relaxed">
          {t(description.ar, description.en)}
        </p>
      </div>
    </Card>
  );
};

export default PortalCard;
