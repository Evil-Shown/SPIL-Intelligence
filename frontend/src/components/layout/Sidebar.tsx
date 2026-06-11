import { NavLink } from 'react-router-dom';
import {
  Home,
  FolderKanban,
  Brain,
  FlaskConical,
  Lightbulb,
  BookOpen,
  FileText,
  CheckSquare,
  Bug,
  Files,
  Bot,
  Settings,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { APP_NAME, USER_NAME, USER_ROLE, WORKSPACE_NAME } from '../../lib/constants';
import { useUiStore } from '../../store/uiStore';

const navSections = [
  {
    label: 'Workspace',
    items: [
      { to: '/', icon: Home, label: 'Home' },
      { to: '/projects', icon: FolderKanban, label: 'Projects' },
      { to: '/knowledge', icon: Brain, label: 'Knowledge' },
    ],
  },
  {
    label: 'Engineering',
    items: [
      { to: '/research', icon: FlaskConical, label: 'Research' },
      { to: '/ideas', icon: Lightbulb, label: 'Ideas' },
      { to: '/algorithms', icon: BookOpen, label: 'Algorithms' },
      { to: '/decisions', icon: FileText, label: 'Decisions' },
    ],
  },
  {
    label: 'Work',
    items: [
      { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
      { to: '/bugs', icon: Bug, label: 'Bugs' },
      { to: '/documents', icon: Files, label: 'Documents' },
    ],
  },
  {
    label: 'AI',
    items: [{ to: '/ai', icon: Bot, label: 'AI Assistant' }],
  },
  {
    label: 'System',
    items: [{ to: '/settings', icon: Settings, label: 'Settings' }],
  },
];

export function Sidebar() {
  const { sidebarCollapsed, sidebarMobileOpen, neuralPulse, toggleSidebar, setSidebarMobileOpen } =
    useUiStore();

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-lg border border-subtle bg-surface/80 p-2 text-secondary backdrop-blur-md lg:hidden"
        onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-backdrop backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col border-r border-subtle transition-all duration-300',
          'bg-surface/80 backdrop-blur-xl',
          sidebarCollapsed ? 'w-16' : 'w-60',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex items-center gap-3 border-b border-subtle px-4 py-5',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          <div
            className={cn(
              'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              'bg-neural-trace border border-active/40',
              neuralPulse && 'neural-logo-pulse'
            )}
          >
            <div className="h-3 w-3 rounded-full bg-neural-core shadow-[0_0_10px_var(--neural-core)]" />
            <div className="absolute -inset-px rounded-lg opacity-30 bg-gradient-to-br from-neural-core/30 to-transparent" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-primary">{APP_NAME}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-neural">
                {WORKSPACE_NAME}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-1">
              {!sidebarCollapsed && (
                <div className="mb-1 mt-5 px-3 font-mono text-[9px] uppercase tracking-[0.2em] text-muted first:mt-1">
                  {section.label}
                </div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setSidebarMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                      'text-muted hover:bg-elevated hover:text-primary',
                      isActive && 'bg-neural-trace text-neural border-l-2 border-neural-core shadow-[inset_0_0_12px_var(--neural-trace)]',
                      sidebarCollapsed && 'justify-center px-2'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={18}
                        className={cn(
                          'shrink-0 transition-all duration-200',
                          isActive
                            ? 'text-neural drop-shadow-[0_0_6px_var(--neural-core)]'
                            : 'group-hover:text-primary'
                        )}
                      />
                      {!sidebarCollapsed && (
                        <span className="font-medium tracking-wide">{item.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-subtle p-3">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 rounded-lg border border-subtle bg-elevated/60 p-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-active/40 font-mono text-xs font-bold text-neural"
                style={{ background: 'radial-gradient(circle, var(--neural-trace), var(--bg-elevated))' }}
              >
                D
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-primary">{USER_NAME}</div>
                <div className="truncate font-mono text-[9px] uppercase tracking-widest text-muted">
                  {USER_ROLE}
                </div>
              </div>
              <div className="h-2 w-2 rounded-full bg-status-active shadow-[0_0_6px_var(--status-active)]" />
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full border border-active/40 font-mono text-xs font-bold text-neural"
                style={{ background: 'radial-gradient(circle, var(--neural-trace), var(--bg-elevated))' }}
              >
                D
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden border-t border-subtle p-3 text-muted transition-colors hover:text-neural lg:block"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft
            size={16}
            className={cn('mx-auto transition-transform duration-300', sidebarCollapsed && 'rotate-180')}
          />
        </button>
      </aside>
    </>
  );
}
