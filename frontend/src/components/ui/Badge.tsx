import { cn } from '../../lib/utils';

type BadgeVariant = 'active' | 'warning' | 'risk' | 'draft' | 'neural' | 'hot' | 'violet';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  active:  'bg-status-active/10 text-status-active   border-status-active/25',
  warning: 'bg-status-warning/10 text-status-warning  border-status-warning/25',
  risk:    'bg-status-risk/10  text-status-risk     border-status-risk/25',
  draft:   'bg-status-idle/10  text-status-idle     border-status-idle/20',
  neural:  'bg-neural-glow     text-neural-core      border-active',
  hot:     'bg-hot-glow        text-hot-core         border-[var(--hot-core)]/30',
  violet:  'bg-violet-glow     text-violet-core      border-[var(--violet-core)]/30',
};

export function Badge({ children, variant = 'draft', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
