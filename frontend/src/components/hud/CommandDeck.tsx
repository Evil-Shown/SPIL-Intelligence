import { Link } from 'react-router-dom';
import { DataNeuralGraph } from '../modules/DataNeuralGraph';

const assets = [
  { to: '/projects', label: 'Projects', tone: 'white' },
  { to: '/knowledge', label: 'Knowledge', tone: 'green' },
  { to: '/algorithms', label: 'Algorithms', tone: 'yellow' },
  { to: '/research', label: 'Research', tone: 'blue' },
  { to: '/decisions', label: 'Decisions', tone: 'white' },
  { to: '/bugs', label: 'Bugs', tone: 'red' },
  { to: '/tasks', label: 'Tasks', tone: 'green' },
  { to: '/ai', label: 'AURA', tone: 'yellow' },
  { to: '/documents', label: 'Documents', tone: 'blue' },
  { to: '/ideas', label: 'Ideas', tone: 'white' },
  { to: '/settings', label: 'Kernel', tone: 'red' },
] as const;

const toneClass: Record<(typeof assets)[number]['tone'], string> = {
  white: 'border-white/70 text-white hover:bg-white hover:text-black',
  green: 'border-[var(--machine)] text-[var(--machine)] hover:bg-[var(--machine)] hover:text-black',
  yellow: 'border-[var(--asset)] text-[var(--asset)] hover:bg-[var(--asset)] hover:text-black',
  blue: 'border-[#4da3ff] text-[#4da3ff] hover:bg-[#4da3ff] hover:text-black',
  red: 'border-[var(--samaritan)] text-[var(--samaritan)] hover:bg-[var(--samaritan)] hover:text-black',
};

function MetaRow({ k, v, danger = false }: { k: string; v: string; danger?: boolean }) {
  return (
    <div className="grid grid-cols-[88px_1fr] border-b border-white/10 text-[11px] uppercase tracking-wider">
      <div className="bg-white px-2 py-1 text-black">{k}</div>
      <div className={`px-2 py-1 ${danger ? 'text-[var(--samaritan)]' : 'text-white/80'}`}>{v}</div>
    </div>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/70">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="hud-meter">
        <span style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export function CommandDeck() {
  return (
    <div className="flex h-full flex-col overflow-hidden px-3 py-2 text-white">
      <header className="mb-2 text-center">
        <div className="hud-title text-2xl text-[var(--machine)] sm:text-4xl">SPIL</div>
        <div className="mx-auto mt-1 h-px w-2/3 bg-[var(--machine)]/70" />
        <div className="mt-1 text-[10px] uppercase tracking-[0.35em] text-white/50">Company operating brain</div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="flex min-h-[280px] flex-col">
          <div className="hud-viewport relative min-h-0 flex-1 overflow-hidden">
            <DataNeuralGraph />
            <div className="pointer-events-none absolute left-3 top-3 z-20 text-[10px] tracking-[0.35em] text-white/80">
              COMPANY
            </div>
          </div>
          <div className="mt-2 border-2 border-white/30 bg-[#1a1a1a]">
            <div className="hud-title border-b border-[var(--machine)]/40 py-1 text-center text-sm text-[var(--machine)]">
              Machine block
            </div>
            <MetaRow k="Type" v="Live" />
            <MetaRow k="Label" v="Company brain" />
            <MetaRow k="Footer" v="Organs linked" />
          </div>
        </section>

        <section className="flex min-h-[280px] flex-col">
          <div className="hud-viewport relative flex min-h-0 flex-1 flex-col justify-end bg-black p-4">
            <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 text-[var(--samaritan)]">-</div>
            <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[var(--samaritan)]">▲</div>
            <div className="relative z-10 max-w-md">
              <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[var(--samaritan)]">Kernel status</div>
              <Meter label="Shape organ online" value={86} color="var(--machine)" />
              <Meter label="Unattended finalize locked" value={100} color="var(--samaritan)" />
              <Meter label="Nesting organ" value={12} color="var(--asset)" />
              <p className="text-[11px] uppercase leading-relaxed tracking-wide text-white/70">
                Geometry tools answer through the kernel. One-way doors stay with a person.
              </p>
            </div>
          </div>
          <div className="mt-2 border-2 border-white/30 bg-[#1a1a1a]">
            <div className="hud-title border-b border-[var(--samaritan)]/50 py-1 text-center text-sm text-[var(--samaritan)]">
              Gate block
            </div>
            <MetaRow k="Location" v="SPIL Intelligence" />
            <MetaRow k="Mode" v="Observe · Advise" danger />
            <MetaRow k="Switch" v="Kill switch armed" danger />
          </div>
        </section>
      </div>

      <section className="mt-3 shrink-0">
        <div className="hud-title mb-2 text-center text-sm text-[var(--asset)]">Assets</div>
        <div className="flex flex-wrap justify-center gap-2">
          {assets.map((asset) => (
            <Link
              key={asset.to}
              to={asset.to}
              className={`border-2 border-dashed px-3 py-2 text-[10px] uppercase tracking-[0.16em] ${toneClass[asset.tone]}`}
            >
              {asset.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
