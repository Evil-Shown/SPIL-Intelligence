import { Link } from 'react-router-dom';
import { DataNeuralGraph } from '../modules/DataNeuralGraph';

const assets = [
  { to: '/projects', label: 'Projects' },
  { to: '/knowledge', label: 'Knowledge' },
  { to: '/algorithms', label: 'Algorithms' },
  { to: '/research', label: 'Research' },
  { to: '/decisions', label: 'Decisions' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/bugs', label: 'Bugs' },
  { to: '/documents', label: 'Documents' },
  { to: '/ideas', label: 'Ideas' },
  { to: '/ai', label: 'AURA' },
  { to: '/settings', label: 'Settings' },
];

const gates = [
  { k: 'Shape organ', v: 'Online', tone: 'text-[var(--machine)]' },
  { k: 'Finalize', v: 'Human gate', tone: 'text-[var(--samaritan)]' },
  { k: 'Nesting', v: 'Not connected', tone: 'text-[var(--asset)]' },
  { k: 'Mode', v: 'Observe · Advise', tone: 'text-[var(--text-primary)]' },
];

export function CommandDeck() {
  return (
    <div className="flex h-full flex-col bg-[#efefef] text-[var(--text-primary)]">
      <header className="shrink-0 px-6 pt-4 text-center">
        <div className="hud-title text-3xl text-[var(--samaritan)] sm:text-4xl">SPIL</div>
        <div className="mx-auto mt-2 h-px max-w-3xl bg-[var(--samaritan)]/70" />
        <div className="mt-2 text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)]">
          Company operating brain
        </div>
      </header>

      <div className="mx-auto mt-4 flex w-full max-w-6xl shrink-0 flex-wrap justify-center gap-2 px-4">
        {assets.map((asset) => (
          <Link
            key={asset.to}
            to={asset.to}
            className="border border-black/15 bg-white px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:border-[var(--samaritan)] hover:text-[var(--samaritan)]"
          >
            {asset.label}
          </Link>
        ))}
      </div>

      <div className="mx-auto mt-4 grid w-full max-w-6xl shrink-0 grid-cols-2 gap-px border border-black/10 bg-black/10 sm:grid-cols-4">
        {gates.map((gate) => (
          <div key={gate.k} className="bg-white px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{gate.k}</div>
            <div className={`mt-1 text-sm uppercase tracking-wide ${gate.tone}`}>{gate.v}</div>
          </div>
        ))}
      </div>

      <div className="relative mt-4 min-h-0 flex-1 border-t border-black/10 bg-white">
        <DataNeuralGraph />
      </div>
    </div>
  );
}
