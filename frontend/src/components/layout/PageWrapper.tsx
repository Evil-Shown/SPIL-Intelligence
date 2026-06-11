import { motion } from 'framer-motion';
import { pageVariants } from '../../lib/constants';
import { useUiStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);

  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'relative z-10 min-h-screen transition-all duration-300',
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60',
        className
      )}
    >
      {children}
    </motion.main>
  );
}
