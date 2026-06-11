import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import { cardVariants } from '../../lib/constants';

interface CardProps extends HTMLMotionProps<'div'> {
  hover?: boolean;
  active?: boolean;
  glow?: 'neural' | 'hot' | 'violet' | 'none';
}

export function Card({ className, hover = true, active = false, glow = 'none', children, ...props }: CardProps) {
  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        'rounded-xl border border-subtle bg-surface p-5 transition-all duration-300',
        hover && 'hover:border-active hover:shadow-neural hover:bg-elevated',
        active && 'border-l-2 border-l-neural-core bg-overlay',
        glow === 'neural' && 'shadow-neural border-active',
        glow === 'hot'    && 'shadow-hot border-[var(--hot-core)]/30',
        glow === 'violet' && 'shadow-violet border-[var(--violet-core)]/30',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
