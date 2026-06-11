export const APP_NAME = 'SPIL Intelligence';
export const WORKSPACE_NAME = 'SPIL Opti';
export const USER_NAME = 'Damitha';
export const USER_ROLE = 'Engineering Lead';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } },
};

export const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const panelVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 200 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
};
