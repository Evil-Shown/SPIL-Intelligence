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
import { APP_NAME, USER_NAME, USER_ROLE } from '../../lib/constants';
import { useUiStore } from '../../store/uiStore';

const navSections = [
  {
    label: 'WORKSPACE',
    code: '01',
    items: [
      { to: '/', icon: Home, label: 'COMMAND DECK', tag: 'CORE' },
      { to: '/projects', icon: FolderKanban, label: 'PROJECTS', tag: 'PRJ' },
      { to: '/knowledge', icon: Brain, label: 'KNOWLEDGE', tag: 'KNOW' },
    ],
  },
  {
    label: 'ENGINEERING',
    code: '02',
    items: [
      { to: '/research', icon: FlaskConical, label: 'RESEARCH LAB', tag: 'R&D' },
      { to: '/ideas', icon: Lightbulb, label: 'INNOVATION', tag: 'IDEA' },
      { to: '/algorithms', icon: BookOpen, label: 'ALGORITHMS', tag: 'GEO' },
      { to: '/decisions', icon: FileText, label: 'DECISIONS', tag: 'ADR' },
    ],
  },
  {
    label: 'OPERATIONS',
    code: '03',
    items: [
      { to: '/tasks', icon: CheckSquare, label: 'TASKS MATRIX', tag: 'TSK' },
      { to: '/bugs', icon: Bug, label: 'DEFECTS', tag: 'BUG' },
      { to: '/documents', icon: Files, label: 'DOCUMENTS', tag: 'DOC' },
    ],
  },
  {
    label: 'COGNITIVE',
    code: '04',
    items: [{ to: '/ai', icon: Bot, label: 'AURA TERMINAL', tag: 'AI' }],
  },
  {
    label: 'SYSTEM',
    code: '05',
    items: [{ to: '/settings', icon: Settings, label: 'GOVERNANCE', tag: 'CFG' }],
  },
];

export function Sidebar() {
  const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, setSidebarMobileOpen } =
    useUiStore();

  return (
    <>
      <button
        className="fixed left-3 top-3 z-50 border border-black/80 bg-white p-2 text-black shadow-md lg:hidden"
        onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col border-r border-black/90 bg-[#fafafa] font-mono transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* ─── Header: Samaritan Logo Bar ─── */}
        <div
          className={cn(
            'flex items-center gap-2.5 border-b border-black/90 bg-white px-4 py-3.5',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          <span className="h-2.5 w-2.5 shrink-0 bg-[#e10600] lamp shadow-[0_0_8px_#e10600]" />
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-sm font-bold tracking-[0.22em] text-black">
                {APP_NAME}
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-black/50">
                // SAMARITAN CORE v1.1
              </p>
            </div>
          )}
        </div>

        {/* ─── Navigation Tree ─── */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-4">
              {!sidebarCollapsed ? (
                <div className="mb-1.5 flex items-center justify-between px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-black/40">
                  <span>// {section.code} {section.label}</span>
                  <span className="h-px flex-1 bg-black/10 ml-2" />
                </div>
              ) : (
                <div className="my-2 h-px bg-black/10" />
              )}

              <nav className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-2.5 border border-transparent px-2.5 py-1.5 text-[11px] font-semibold tracking-wider transition-all',
                        sidebarCollapsed && 'justify-center px-2',
                        isActive
                          ? 'border-black bg-black text-white'
                          : 'text-black/75 hover:border-black/30 hover:bg-black/[0.04] hover:text-black'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={14}
                          className={cn(
                            'shrink-0 transition-colors',
                            isActive ? 'text-[#e10600]' : 'text-black/60 group-hover:text-black'
                          )}
                        />
                        {!sidebarCollapsed && (
                          <div className="flex min-w-0 flex-1 items-center justify-between">
                            <span className="truncate">{item.label}</span>
                            <span
                              className={cn(
                                'text-[8px] font-mono tracking-widest uppercase px-1 py-0.2',
                                isActive
                                  ? 'bg-[#e10600] text-white font-bold'
                                  : 'text-black/40 group-hover:text-black'
                              )}
                            >
                              {isActive ? '➔' : item.tag}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* ─── Footer: Tactical Operator Clearance ─── */}
        <div className="border-t border-black/90 bg-white p-3 text-[10px]">
          {!sidebarCollapsed ? (
            <div>
              <div className="flex items-center justify-between border-b border-black/10 pb-1.5 text-[9px] uppercase tracking-widest text-black/50 font-bold">
                <span>OPERATOR CLEARANCE</span>
                <span className="text-[#1c7a43] font-bold">LVL 4</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center border border-black bg-black text-white font-mono text-xs font-bold">
                  D
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-black uppercase tracking-wider">{USER_NAME}</p>
                  <p className="truncate text-[8px] text-black/50 uppercase tracking-widest">{USER_ROLE}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="h-2 w-2 bg-[#1c7a43]" />
            </div>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className="mt-2.5 flex w-full items-center justify-center border border-black/20 bg-[#f4f4f4] py-1 text-[9px] uppercase font-bold tracking-widest text-black/70 hover:bg-black hover:text-white transition-all"
          >
            <ChevronLeft
              size={12}
              className={cn('transition-transform', sidebarCollapsed && 'rotate-180')}
            />
            {!sidebarCollapsed && <span className="ml-1">COLLAPSE HUD</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
