import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataNeuralGraph } from '../modules/DataNeuralGraph';

const columns = [
  { left: '3%', width: 78, duration: '32s', reverse: false },
  { left: '8%', width: 54, duration: '44s', reverse: true },
  { left: '14%', width: 36, duration: '26s', reverse: false },
  { left: '19%', width: 22, duration: '38s', reverse: true },
  { left: '78%', width: 28, duration: '30s', reverse: true },
  { left: '84%', width: 62, duration: '41s', reverse: false },
  { left: '90%', width: 40, duration: '24s', reverse: true },
  { left: '95%', width: 24, duration: '36s', reverse: false },
];

const barPattern = [14, 46, 8, 72, 22, 10, 54, 18, 6, 36, 12, 64, 20, 9, 48];

function DataField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {columns.map((column) => (
        <div
          key={column.left}
          className="data-drift absolute top-0 flex flex-col gap-3"
          style={{
            left: column.left,
            width: column.width,
            height: '200%',
            animationDuration: column.duration,
            animationDirection: column.reverse ? 'reverse' : 'normal',
          }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex h-1/2 flex-col justify-around">
              {barPattern.map((height, index) => (
                <span
                  key={`${copy}-${index}`}
                  className="block bg-neutral-400/70"
                  style={{
                    height,
                    width: index % 3 === 0 ? '100%' : index % 3 === 1 ? '62%' : '38%',
                    marginLeft: index % 2 === 0 ? 0 : '18%',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

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
      <DataField />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.72) 28%, rgba(255,255,255,0.15) 58%, rgba(255,255,255,0) 100%)',
        }}
      />

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
            <div>
              Reading workspace
              <span className="caret-blink">_</span>
            </div>
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
