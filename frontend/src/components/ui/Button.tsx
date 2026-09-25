import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'hot';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium uppercase tracking-[0.14em] rounded-none transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'border border-[var(--samaritan)] bg-white text-[var(--samaritan)] hover:bg-[var(--samaritan)] hover:text-white',
      ghost:
        'bg-white border border-black/15 text-secondary hover:border-black/40 hover:text-primary',
      danger:
        'bg-white border border-[var(--samaritan)] text-[var(--samaritan)] hover:bg-[var(--samaritan)] hover:text-white',
      hot:
        'bg-white border border-[var(--asset)] text-[var(--asset)] hover:bg-[var(--asset)] hover:text-white',
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
