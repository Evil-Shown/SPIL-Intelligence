import { useLocation, Link } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { Input } from '../ui/Input';

const routeLabels: Record<string, string> = {
  '/': 'Home',
  '/projects': 'Projects',
  '/knowledge': 'Knowledge Base',
  '/research': 'Research',
  '/ideas': 'Ideas Board',
  '/algorithms': 'Algorithms Library',
  '/decisions': 'Decisions',
  '/tasks': 'Tasks',
  '/bugs': 'Bugs',
  '/documents': 'Documents',
  '/ai': 'AI Assistant',
  '/settings': 'Settings',
};

export function TopBar() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const basePath = '/' + (segments[0] ?? '');
  const label = routeLabels[basePath] ?? routeLabels[location.pathname] ?? 'SPIL Opti';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-subtle bg-surface/60 px-4 backdrop-blur-xl lg:px-6">
      {/* Thin scan line accent */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neural-core/40 to-transparent" />

      {/* Breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-neural">
          SPIL Opti
        </Link>
        <span className="text-muted/40">/</span>
        <span className="truncate font-semibold tracking-wide text-primary">{label}</span>
        {segments.length > 1 && segments[0] === 'projects' && (
          <>
            <span className="text-muted/40">/</span>
            <span className="truncate text-secondary">Detail</span>
          </>
        )}
      </div>

      {/* Search */}
      <div className="hidden max-w-xs flex-1 md:block">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search…"
            className="!py-1.5 pl-8 text-xs !bg-elevated/50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="relative rounded-lg p-2 text-muted transition-colors hover:bg-elevated hover:text-primary">
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-neural-core shadow-[0_0_6px_var(--neural-core)]" />
        </button>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full border border-active/40 font-mono text-xs font-bold text-neural"
          style={{ background: 'radial-gradient(circle, var(--neural-trace), var(--bg-elevated))' }}
        >
          D
        </div>
      </div>
    </header>
  );
}
