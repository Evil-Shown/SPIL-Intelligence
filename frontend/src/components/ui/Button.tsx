import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'hot';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-neural-core text-white font-bold hover:brightness-110 hover:shadow-neural-sm tracking-wide',
      ghost:
        'bg-transparent border border-default text-secondary hover:border-active hover:text-primary hover:bg-elevated',
      danger:
        'bg-transparent border border-status-risk/30 text-status-risk hover:bg-status-risk/10',
      hot:
        'bg-hot-core text-white font-bold hover:brightness-110 hover:shadow-hot tracking-wide',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
