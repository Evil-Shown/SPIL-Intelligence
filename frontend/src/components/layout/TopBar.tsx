import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const routeLabels: Record<string, string> = {
  '/': 'COMMAND DECK',
  '/projects': 'PROJECT DIRECTORY',
  '/knowledge': 'KNOWLEDGE REPOSITORY',
  '/research': 'RESEARCH LAB',
  '/ideas': 'INNOVATION BOARD',
  '/algorithms': 'ALGORITHMS REGISTER',
  '/decisions': 'ARCHITECTURE DECISIONS',
  '/tasks': 'TASKS MATRIX',
  '/bugs': 'DEFECTS REGISTER',
  '/documents': 'DOCUMENTATION',
  '/ai': 'AURA TERMINAL',
  '/settings': 'GOVERNANCE SYSTEM',
};

export function TopBar() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const basePath = '/' + (segments[0] ?? '');
  const label = routeLabels[basePath] ?? routeLabels[location.pathname] ?? 'SPIL OPTI';

  const [timeUtc, setTimeUtc] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      const ms = String(Math.floor(now.getUTCMilliseconds() / 10)).padStart(2, '0');
      setTimeUtc(`${h}:${m}:${s}.${ms} UTC`);
    };
    updateTime();
    const id = setInterval(updateTime, 50);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-black/90 bg-white/95 px-4 font-mono text-xs backdrop-blur-sm lg:px-6">
      {/* ─── Breadcrumb ─── */}
      <div className="flex min-w-0 items-center gap-2 tracking-widest text-[11px]">
        <Link to="/" className="font-bold text-[#e10600] hover:text-black transition-colors">
          SPIL
        </Link>
        <span className="text-black/30 font-bold">//</span>
        <span className="font-bold uppercase tracking-wider text-black">{label}</span>
        {segments.length > 1 && segments[0] === 'projects' && (
          <>
            <span className="text-black/30">//</span>
            <span className="text-black/60 uppercase">DETAIL</span>
          </>
        )}
      </div>

      {/* ─── Center: Live Telemetry Clock ─── */}
      <div className="hidden md:flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase text-black/60 font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-[#e10600] lamp" />
          <span className="font-bold text-black">{timeUtc}</span>
        </span>
        <span className="text-black/20">|</span>
        <span className="border border-black/20 bg-black/[0.03] px-1.5 py-0.5 text-[#1c7a43] font-bold text-[9px]">
          KERNEL: ENFORCED
        </span>
      </div>

      {/* ─── Right: Search & Operator Clearance ─── */}
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block w-48 lg:w-60">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            placeholder="FILTER DIRECTIVE..."
            className="w-full border border-black/80 bg-[#fafafa] py-1 pl-7 pr-2 font-mono text-[10px] uppercase tracking-widest outline-none placeholder:text-black/30 focus:border-black focus:bg-white"
          />
        </div>

        <div className="flex items-center border border-black/80 bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
          <span className="text-[#e10600] mr-1.5">■</span>
          <span>DAMITHA</span>
        </div>
      </div>
    </header>
  );
}
