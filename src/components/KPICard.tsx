import { type LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'gold';
}

export default function KPICard({ title, value, subtitle, icon: Icon, variant = 'default' }: KPICardProps) {
  const variants = {
    default: 'bg-card shadow-card',
    primary: 'gradient-brand text-primary-foreground',
    gold: 'gradient-gold text-secondary-foreground',
  };

  const iconVariants = {
    default: 'bg-accent text-accent-foreground',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    gold: 'bg-secondary-foreground/20 text-secondary-foreground',
  };

  const subtitleVariants = {
    default: 'text-muted-foreground',
    primary: 'text-primary-foreground/70',
    gold: 'text-secondary-foreground/70',
  };

  return (
    <div className={`rounded-xl p-5 ${variants[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={`text-xs font-medium uppercase tracking-wider ${variant === 'default' ? 'text-muted-foreground' : ''}`}>
            {title}
          </p>
          <p className="text-2xl font-display font-bold">{value}</p>
          {subtitle && <p className={`text-xs ${subtitleVariants[variant]}`}>{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${iconVariants[variant]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
