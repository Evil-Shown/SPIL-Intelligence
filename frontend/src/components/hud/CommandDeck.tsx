import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { DataNeuralGraph } from '../modules/DataNeuralGraph';
import { streamChat } from '../../services/endpoints';

// ── High-Tech Samaritan Telemetry Stream ──────────────────────
const telemetryColumns = [
  { left: '2%', width: '42px', duration: '28s', reverse: false },
  { left: '6%', width: '28px', duration: '34s', reverse: true },
  { left: '10%', width: '36px', duration: '22s', reverse: false },
  { left: '15%', width: '20px', duration: '40s', reverse: true },
  { left: '84%', width: '22px', duration: '36s', reverse: true },
  { left: '88%', width: '38px', duration: '24s', reverse: false },
  { left: '92%', width: '26px', duration: '32s', reverse: true },
  { left: '96%', width: '40px', duration: '26s', reverse: false },
];

const telemetrySnippets = [
  '0x7FA2 // OK',
  'GEO_NET: 8092',
  'SYS_CYCLE: 12ms',
  'LAT 06°55\'N',
  'LON 79°50\'E',
  'KERNEL: ENFORCED',
  'MEM: 4096-BIT',
  'FEED: ACTIVE',
  'PROPOSAL: GATED',
  'AUDIT: WAL_ON',
  'VECTOR: PG_IDLE',
  'TARGET: CORE',
];

export function DataField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden>
      {/* Subtle fine coordinate grid dots */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Vertical Telemetry Streams */}
      {telemetryColumns.map((col) => (
        <div
          key={col.left}
          className="data-drift absolute top-0 flex flex-col font-mono text-[8px] leading-tight text-black/25 uppercase tracking-widest"
          style={{
            left: col.left,
            width: col.width,
            height: '200%',
            animationDuration: col.duration,
            animationDirection: col.reverse ? 'reverse' : 'normal',
          }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex h-1/2 flex-col justify-between py-6">
              {telemetrySnippets.map((text, i) => (
                <div key={`${copy}-${i}`} className="my-1.5 flex flex-col gap-0.5">
                  <span className="truncate opacity-75">{text}</span>
                  <span
                    className="block bg-black/15"
                    style={{
                      height: i % 3 === 0 ? '18px' : i % 2 === 0 ? '8px' : '4px',
                      width: i % 2 === 0 ? '100%' : '55%',
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const navLinks = [
  { to: '/projects', label: 'Projects' },
  { to: '/knowledge', label: 'Knowledge' },
  { to: '/algorithms', label: 'Algorithms' },
  { to: '/research', label: 'Research' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/decisions', label: 'Decisions' },
  { to: '/ai', label: 'AURA' },
];

const directiveChips = [
  { label: 'create task: fix arc fitting', text: 'create a task to fix the arc fitting bug, assign to Damitha, priority high' },
  { label: 'publish decision ADR-004', text: 'publish decision ADR-004' },
  { label: 'scan open bugs', text: 'search open bugs in geometry module' },
  { label: 'system audit status', text: 'what is the system and kernel audit status?' },
];

export function CommandDeck() {
  const [command, setCommand] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [reply, setReply] = useState('');
  const [asked, setAsked] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [turnClass, setTurnClass] = useState<'read' | 'executed' | 'door'>('read');
  const [timeUtc, setTimeUtc] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Live UTC high-precision clock
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape key closes full-screen map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMap) {
        setShowMap(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMap]);

  const submitCommand = async (textToSubmit?: string) => {
    const text = (textToSubmit ?? command).trim();
    if (!text || waiting) return;

    setCommand('');
    setAsked(text);
    setReply('');
    setTurnClass('read');
    setWaiting(true);

    let body = '';
    await streamChat(
      text,
      {},
      (delta) => {
        body += delta;
        setReply(body);
      },
      (_convId, executedClass) => {
        if (executedClass === 'door') setTurnClass('door');
        else if (executedClass === 'executed') setTurnClass('executed');
        else setTurnClass('read');
        setWaiting(false);
      },
      (err) => {
        setReply(`[SYSTEM FAILURE] ${err}`);
        setTurnClass('door');
        setWaiting(false);
      }
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    submitCommand();
  };

  return (
    <div className="samaritan-scanline relative flex h-full flex-col overflow-hidden bg-[#f4f4f4] text-black">
      <DataField />

      {/* Surveillance HUD Overlay Lines */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Subtle horizontal grid lines */}
        <div className="absolute top-[8%] left-0 right-0 h-px bg-black/[0.06]" />
        <div className="absolute bottom-[10%] left-0 right-0 h-px bg-black/[0.06]" />
        {/* Subtle vertical alignment lines */}
        <div className="absolute top-0 bottom-0 left-[20%] w-px bg-black/[0.04]" />
        <div className="absolute top-0 bottom-0 right-[20%] w-px bg-black/[0.04]" />
      </div>

      {/* ─── Top Telemetry Surveillance Bar ─── */}
      <header className="relative z-10 flex items-center justify-between border-b border-black/[0.12] bg-white/70 px-6 py-2.5 backdrop-blur-sm font-mono text-[10px] tracking-[0.24em] uppercase text-black/60">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-none bg-[#e10600] lamp" />
          </span>
          <span className="font-semibold text-black/90">SYS.ID: SAMARITAN // SPIL-AURA-CORE</span>
          <span className="hidden sm:inline text-black/30">|</span>
          <span className="hidden sm:inline text-black/50">NODE: SPIL-OPTI // PRIME</span>
        </div>

        <div className="font-display tracking-[0.45em] text-[12px] font-semibold text-black/75">
          SPIL INTELLIGENCE
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-black/80 font-bold">{timeUtc}</span>
          <span className="hidden md:inline-block border border-black/20 bg-black/[0.04] px-1.5 py-0.5 text-[9px] text-[#1c7a43] font-bold">
            SURVEILLANCE: ACTIVE
          </span>
        </div>
      </header>

      {/* ─── Center Command Console ─── */}
      <div className="rise-in relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6">
        {/* Corner HUD Ticks */}
        <div className="pointer-events-none relative flex w-full max-w-[620px] flex-col items-center">
          <div className="absolute -top-6 -left-6 font-mono text-[9px] text-black/30 tracking-widest">
            ┌ TARGET: CORE
          </div>
          <div className="absolute -top-6 -right-6 font-mono text-[9px] text-black/30 tracking-widest">
            LAT: 06°55'N ┐
          </div>
        </div>

        {/* ─── The Iconic Samaritan Prompt ─── */}
        <form onSubmit={submit} className="flex w-full max-w-[560px] flex-col items-center text-center">
          {/* Top Surgical Bounding Rule with End Crosshairs */}
          <div className="relative flex w-full items-center justify-between">
            <span className="font-mono text-[11px] leading-none text-black/40">+</span>
            <div className="h-px flex-1 bg-black/85 mx-1" />
            <span className="font-mono text-[11px] leading-none text-black/40">+</span>
          </div>

          {/* The Big Samaritan Headline */}
          <h1 className="font-display my-3 text-[16px] font-bold uppercase tracking-[0.48em] text-black sm:text-[20px] selection:bg-[#e10600] selection:text-white">
            WHAT ARE YOUR COMMANDS?
          </h1>

          {/* Bottom Surgical Bounding Rule */}
          <div className="relative flex w-full items-center justify-between">
            <span className="font-mono text-[11px] leading-none text-black/40">+</span>
            <div className="h-px flex-1 bg-black/85 mx-1" />
            <span className="font-mono text-[11px] leading-none text-black/40">+</span>
          </div>

          {/* Authentic Samaritan Red Triangle Cursor */}
          <div className="mt-4 flex items-center justify-center">
            <svg
              className="samaritan-pulse-red h-4 w-4 drop-shadow-[0_0_8px_rgba(225,6,0,0.65)]"
              viewBox="0 0 100 86"
              fill="#e10600"
            >
              <polygon points="50,0 100,86 0,86" />
            </svg>
          </div>

          {/* Precision Input Field with Framing Brackets */}
          <div className="relative mt-4 w-full">
            <div className="flex items-center border border-black/80 bg-white/95 px-3.5 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all focus-within:border-black focus-within:shadow-[0_6px_24px_rgba(0,0,0,0.12)]">
              <span className="mr-2.5 font-mono text-[11px] font-bold text-[#e10600]">&gt;</span>
              <input
                ref={inputRef}
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="INPUT DIRECTIVE OR QUERY COMPANY BRAIN..."
                aria-label="Directive Input"
                disabled={waiting}
                className="w-full border-0 bg-transparent font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-black outline-none placeholder:text-black/35 disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={waiting || !command.trim()}
                className="ml-2 border border-black/30 bg-black px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-[#e10600] hover:border-[#e10600] disabled:opacity-20"
              >
                {waiting ? '...' : 'EXEC'}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5 max-w-lg">
          {directiveChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setCommand(chip.text);
                submitCommand(chip.text);
              }}
              disabled={waiting}
              className="border border-black/20 bg-white/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-black/70 hover:border-black hover:bg-black hover:text-white transition-all disabled:opacity-40"
            >
              [ {chip.label} ]
            </button>
          ))}
        </div>

        {/* ─── Samaritan Execution Terminal Deck (PITCH BLACK) ─── */}
        <div className="mt-6 w-full max-w-[620px] border-2 border-black bg-black shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          {/* Pitch Black Header Bar */}
          <div className="flex items-center justify-between border-b border-white/20 bg-black px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white font-bold">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 bg-[#e10600] lamp" />
              <span className="text-white">TERMINAL // AURA KERNEL STREAM</span>
            </div>
            <div className="flex items-center gap-3 text-[9px] text-white/70">
              <span>STATUS: {waiting ? 'PROCESSING' : 'LISTENING'}</span>
              <span className="flex gap-1">
                <i className="lamp block h-1.5 w-1.5 bg-[#e10600]" />
                <i className="lamp block h-1.5 w-1.5 bg-[#e10600]" style={{ animationDelay: '1s' }} />
              </span>
            </div>
          </div>

          {/* Solid Pitch Black Terminal Screen */}
          <div
            className="max-h-56 min-h-[130px] overflow-y-auto bg-black p-4 font-mono text-[12px] font-bold leading-relaxed text-white selection:bg-[#e10600] selection:text-white"
            aria-live="polite"
          >
            {asked && (
              <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white/80 border-b border-white/20 pb-1.5">
                &gt; {asked}
              </p>
            )}

            <div className="whitespace-pre-wrap font-mono text-[12px] font-bold tracking-wide text-white">
              {waiting && !reply ? (
                <span className="font-bold text-white">
                  INTERCEPTING DIRECTIVE · QUERYING KERNEL
                  <span className="caret-blink text-[#e10600]"> █</span>
                </span>
              ) : (
                reply || (
                  <span className="font-bold text-white">
                    AURA KERNEL INITIALIZED. STANDBY FOR DIRECTIVES.
                    <span className="caret-blink text-[#e10600]"> █</span>
                  </span>
                )
              )}
              {waiting && reply && <span className="caret-blink text-[#e10600]"> █</span>}
            </div>

            {/* Dynamic Status Badges on Result */}
            {!waiting && reply && (
              <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-[10px] tracking-widest font-mono">
                {turnClass === 'door' ? (
                  <span className="text-[#e10600] font-bold">
                    [!] CRITICAL REFUSAL · REQUIRES HUMAN CONFIRMATION
                  </span>
                ) : turnClass === 'executed' ? (
                  <span className="text-[#22c55e] font-bold">
                    [✓] EXECUTED · LOGGED IN EVENT STORE
                  </span>
                ) : (
                  <span className="text-white/70 font-bold">
                    [i] TELEMETRY STREAM COMPLETED
                  </span>
                )}
                <span className="text-white/50 uppercase font-bold">AWAITING.</span>
              </div>
            )}

            {/* Signal loading line */}
            {waiting && (
              <div className="mt-3 h-0.5 w-full bg-white/20">
                <div className="signal-load h-0.5 bg-[#e10600]" />
              </div>
            )}
          </div>
        </div>

        {/* ─── Bottom Navigation Deck ─── */}
        <nav className="mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-black/85">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="border border-black/20 bg-white/70 px-2.5 py-1 transition-all hover:bg-black hover:text-white hover:border-black"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setShowMap((open) => !open)}
            className="border border-black/90 bg-black text-white px-3 py-1 transition-all hover:bg-[#e10600] hover:border-[#e10600]"
          >
            {showMap ? '[ CLOSE MAP ]' : '[ NEURAL MAP ]'}
          </button>
        </nav>
      </div>

      {/* ─── Full-Screen Samaritan Neural Knowledge Topology ─── */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#f4f4f4] text-black">
          {/* Tactical Top Bar */}
          <div className="flex h-10 items-center justify-between border-b border-black bg-black px-4 font-mono text-[10px] uppercase tracking-widest text-white shadow-md">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 bg-[#e10600] lamp" />
              <span className="font-bold tracking-[0.24em]">
                SPIL NEURAL KNOWLEDGE TOPOLOGY // 11 DEPARTMENTS // SYSTEM: ENFORCED
              </span>
              <span className="hidden md:inline border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] text-[#22c55e]">
                FULL-FIELD SURVEILLANCE
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline font-mono text-[9px] text-white/50">
                [ESC OR CLICK TO EXIT]
              </span>
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="border border-[#e10600] bg-[#e10600] px-3 py-1 font-mono text-[10px] font-bold text-white hover:bg-white hover:text-black hover:border-white transition-colors"
              >
                ✕ CLOSE MAP [ESC]
              </button>
            </div>
          </div>
          <div className="relative flex-1 w-full h-[calc(100vh-40px)] overflow-hidden">
            <DataNeuralGraph />
          </div>
        </div>
      )}
    </div>
  );
}
