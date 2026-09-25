import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataNeuralGraph } from '../modules/DataNeuralGraph';

const columns = [
  { left: '2%', width: 92, duration: '46s', reverse: false, blur: 1.6 },
  { left: '7%', width: 48, duration: '62s', reverse: true, blur: 0.6 },
  { left: '12%', width: 28, duration: '38s', reverse: false, blur: 1.1 },
  { left: '17%', width: 16, duration: '54s', reverse: true, blur: 0.4 },
  { left: '22%', width: 10, duration: '70s', reverse: false, blur: 0.2 },
  { left: '74%', width: 12, duration: '58s', reverse: true, blur: 0.3 },
  { left: '79%', width: 34, duration: '42s', reverse: false, blur: 0.8 },
  { left: '85%', width: 56, duration: '66s', reverse: true, blur: 1.4 },
  { left: '91%', width: 24, duration: '34s', reverse: false, blur: 0.5 },
  { left: '96%', width: 18, duration: '50s', reverse: true, blur: 1.2 },
];

const barPattern = [6, 28, 4, 52, 11, 8, 36, 5, 18, 7, 44, 3, 22, 9, 14, 40];

export function DataField() {
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
            filter: `blur(${column.blur}px)`,
            opacity: 0.55,
          }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex h-1/2 flex-col justify-around">
              {barPattern.map((height, index) => (
                <span
                  key={`${copy}-${index}`}
                  className="block bg-[#b9b9b9]"
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
    <div className="relative flex h-full flex-col overflow-hidden bg-[#f7f7f7]">
      <DataField />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.88) 22%, rgba(255,255,255,0.35) 48%, rgba(190,190,190,0.28) 100%)',
        }}
      />

      <div className="pointer-events-none absolute left-0 right-0 top-7 z-10 text-center font-display text-[11px] uppercase tracking-[0.62em] text-black/25">
        SPIL
      </div>

      <div className="rise-in relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-6">
        <form onSubmit={submit} className="flex w-full max-w-lg flex-col items-center text-center">
          <div className="h-px w-[min(100%,380px)] bg-black" />
          <label className="font-display my-[14px] block text-[12px] font-medium uppercase tracking-[0.5em] text-black sm:text-[14px]">
            What are your commands?
          </label>
          <div className="h-px w-[min(100%,380px)] bg-black" />
          <div className="mt-3.5 h-0 w-0 border-x-[6px] border-x-transparent border-b-[9px] border-b-[#d10505] drop-shadow-[0_1px_0_rgba(209,5,5,0.25)]" />
          <input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Ask the company brain"
            aria-label="Command"
            className="mt-6 w-full border-0 border-b border-transparent bg-transparent pb-1 text-center font-mono text-[11px] uppercase tracking-[0.32em] text-black/75 outline-none transition-colors placeholder:text-black/20 focus:border-black/25"
          />
        </form>

        <div className="mt-10 w-full max-w-[420px] border border-black/90 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.07)]">
          <div className="flex items-center justify-between border-b border-black/90 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.26em] text-black">
            <span>Company brain online</span>
            <span className="flex gap-[5px]">
              <i className="lamp block h-1.5 w-1.5 bg-[#d10505]" />
              <i className="lamp block h-1.5 w-1.5 bg-[#d10505]" style={{ animationDelay: '1.1s' }} />
            </span>
          </div>
          <div className="bg-[#0a0a0a] px-3.5 py-3.5 font-mono text-[11px] uppercase tracking-[0.22em] text-white/95">
            <div>
              Reading workspace
              <span className="caret-blink text-white">_</span>
            </div>
            <div className="mt-3 h-px w-full bg-white/15">
              <div className="signal-load h-px bg-white" />
            </div>
          </div>
        </div>

        <nav className="mt-9 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-[0.24em] text-black/35">
          {links.map((link, index) => (
            <span key={link.to} className="flex items-center gap-3">
              {index > 0 && <span className="text-black/15">/</span>}
              <Link to={link.to} className="transition-colors hover:text-black">
                {link.label}
              </Link>
            </span>
          ))}
          <span className="text-black/15">/</span>
          <button type="button" onClick={() => setShowMap((open) => !open)} className="transition-colors hover:text-black">
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
