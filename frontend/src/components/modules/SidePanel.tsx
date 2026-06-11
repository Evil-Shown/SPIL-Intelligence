import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { panelVariants } from '../../lib/constants';

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function SidePanel({ open, onClose, title, children, width = '520px' }: SidePanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-backdrop backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ width, maxWidth: '100vw' }}
            className="fixed right-0 top-0 z-50 flex h-full flex-col border-l border-subtle bg-elevated shadow-neural"
          >
            <div className="flex items-center justify-between border-b border-subtle px-6 py-4">
              <h2 className="text-base font-semibold text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-overlay hover:text-primary"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
