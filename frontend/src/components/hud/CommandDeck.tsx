import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataNeuralGraph } from '../modules/DataNeuralGraph';

const shards = [
  { x: '6%', y: '8%', w: 46, h: 18 },
  { x: '8%', y: '22%', w: 28, h: 64 },
  { x: '4%', y: '48%', w: 70, h: 12 },
  { x: '11%', y: '70%', w: 36, h: 40 },
  { x: '18%', y: '14%', w: 18, h: 90 },
  { x: '88%', y: '10%', w: 52, h: 16 },
  { x: '92%', y: '28%', w: 22, h: 70 },
  { x: '80%', y: '62%', w: 64, h: 14 },
  { x: '86%', y: '78%', w: 30, h: 36 },
  { x: '24%', y: '6%', w: 14, h: 22 },
  { x: '70%', y: '18%', w: 40, h: 10 },
  { x: '16%', y: '88%', w: 80, h: 8 },
];

const links = [
  { to: '/projects', label: 'Projects' },
  { to: '/knowledge', label: 'Knowledge' },
  { to: '/algorithms', label: 'Algorithms' },
  { to: '/research', label: 'Research' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/decisions', label: 'Decisions' },
  { to: '/ai', label: 'AURA' },
];

export function CommandDeck() {
  const navigate = useNavigate();
  const [command, setCommand] = useState('');
  const [showMap, setShowMap] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = command.trim();
    if (!text) return;
    navigate('/ai', { state: { initialMessage: text } });
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#f4f4f4]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.72) 42%, rgba(210,210,210,0.55) 100%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-40">
        {shards.map((shard) => (
          <span
            key={`${shard.x}-${shard.y}`}
            className="absolute bg-neutral-400/50"
            style={{ left: shard.x, top: shard.y, width: shard.w, height: shard.h, filter: 'blur(0.4px)' }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <form onSubmit={submit} className="w-full max-w-xl text-center">
          <label className="block text-[15px] uppercase tracking-[0.28em] text-black">
            What are your commands?
          </label>
          <div className="mx-auto mt-2 h-px w-full max-w-md bg-black" />
          <input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Ask the company brain"
            className="mt-4 w-full border-0 bg-transparent text-center text-sm uppercase tracking-[0.18em] text-black outline-none placeholder:text-black/30"
          />
          <div className="mx-auto mt-3 h-0 w-0 border-x-[9px] border-x-transparent border-b-[12px] border-b-[#e10600]" />
        </form>

        <div className="mt-10 w-full max-w-md border border-black/80 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between border-b border-black bg-white px-3 py-1.5 text-[11px] uppercase tracking-[0.22em]">
            <span>Company brain online</span>
            <span className="text-[#e10600]">● ●</span>
          </div>
          <div className="bg-black px-3 py-3 text-[12px] uppercase tracking-[0.16em] text-white">
            <div>Reading workspace_</div>
            <div className="mt-2 h-1.5 w-16 bg-white/80" />
          </div>
        </div>

        <nav className="mt-8 flex max-w-3xl flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-black/55">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-black">
              {link.label}
            </Link>
          ))}
          <button type="button" onClick={() => setShowMap((open) => !open)} className="hover:text-black">
            {showMap ? 'Close map' : 'Map'}
          </button>
        </nav>
      </div>

      {showMap && (
        <div className="relative z-10 h-[46%] border-t border-black/10 bg-white">
          <DataNeuralGraph />
        </div>
      )}
    </div>
  );
}
