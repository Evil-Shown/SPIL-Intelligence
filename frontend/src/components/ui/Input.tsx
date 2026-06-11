import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-mono font-medium uppercase tracking-widest text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-lg border border-default bg-elevated px-3 py-2 text-sm text-primary',
            'placeholder:text-muted focus:border-neural-core focus:outline-none',
            'focus:shadow-[0_0_0_3px_var(--neural-trace)] transition-all duration-200',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
