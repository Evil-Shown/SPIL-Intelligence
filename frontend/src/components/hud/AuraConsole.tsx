import { useEffect, useRef, useState, type FormEvent } from 'react';
import { streamChat } from '../../services/endpoints';

type TurnClass = 'read' | 'proposal' | 'door' | 'executed';

interface StatusBody {
  organs: { geometry: 'up' | 'down'; canvas: 'awake' | 'idle'; nesting: 'asleep' };
  proposals: { pending: number };
  doors: { pending: number };
}

interface Turn {
  role: 'user' | 'assistant';
  text: string;
  turnClass?: TurnClass;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

const fallbackStatus: StatusBody = {
  organs: { geometry: 'up', canvas: 'idle', nesting: 'asleep' },
  proposals: { pending: 0 },
  doors: { pending: 0 },
};

function asClass(value?: string): TurnClass {
  if (value === 'proposal' || value === 'door' || value === 'executed' || value === 'read') return value;
  return 'read';
}

export function AuraConsole() {
  const [status, setStatus] = useState<StatusBody>(fallbackStatus);
  const [stale, setStale] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [waiting, setWaiting] = useState(false);
  const liveRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const response = await fetch(`${API_URL}/aura/status`);
        if (!response.ok) throw new Error('status');
        const body = (await response.json()) as StatusBody;
        if (!stop) {
          setStatus(body);
          setStale(false);
        }
      } catch {
        if (!stop) setStale(true);
      }
    };
    load();
    const timer = window.setInterval(load, 10_000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    liveRef.current?.scrollTo({ top: liveRef.current.scrollHeight });
  }, [turns, waiting]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || waiting) return;
    setInput('');
    setTurns((prev) => [...prev, { role: 'user', text: message }, { role: 'assistant', text: '' }]);
    setWaiting(true);
    let body = '';
    await streamChat(
      message,
      {},
      (delta) => {
        body += delta;
        setTurns((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', text: body };
          return next;
        });
      },
      (_id, turnClass) => {
        setTurns((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', text: body, turnClass: asClass(turnClass) };
          return next;
        });
        setWaiting(false);
      },
      () => {
        setTurns((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', text: body, turnClass: 'read' };
          return next;
        });
        setWaiting(false);
      }
    );
  };

  const geometry = status.organs.geometry;
  const canvas = status.organs.canvas;
  const proposals = status.proposals.pending;
  const doors = status.doors.pending;

  return (
    <section
      className="aura-console relative z-10 mx-auto flex w-full max-w-[760px] min-h-[60vh] flex-col rounded-[10px] border px-7 py-6"
      style={{
        background: 'rgba(10, 15, 20, 0.92)',
        borderColor: 'rgba(255,255,255,0.08)',
        color: '#e8e6e1',
        fontFamily: '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace',
        fontSize: 14,
        lineHeight: 1.6,
      }}
    >
      <div className="lowercase">
        <p>decima is not here. this is spil.</p>
        <p className="mt-4">
          geometry is{' '}
          <span style={{ color: geometry === 'up' ? '#22d3ee' : '#ef4444' }}>{geometry}</span>
        </p>
        <p>
          the canvas is <span style={{ color: '#22d3ee' }}>{canvas}</span>
          {canvas === 'idle' && <span style={{ color: '#6b7280' }}> · no heartbeat</span>}
        </p>
        <p>
          nesting is <span style={{ color: '#6b7280' }}>asleep</span>
        </p>
        <p>
          <span style={{ color: proposals === 0 ? '#6b7280' : '#f5a623' }}>{proposals} amber proposals.</span>{' '}
          <span style={{ color: doors === 0 ? '#6b7280' : '#ef4444' }}>{doors} red doors.</span>
        </p>
        <p className="mt-4" style={{ color: '#6b7280' }}>
          awaiting.
        </p>
        {stale && (
          <p style={{ color: '#6b7280' }}>status stale</p>
        )}
      </div>

      <div ref={liveRef} className="mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto lowercase" aria-live="polite">
        {turns.map((turn, index) =>
          turn.role === 'user' ? (
            <p key={index} style={{ color: '#e8e6e1' }}>
              &gt; {turn.text}
            </p>
          ) : (
            <Reply key={index} text={turn.text} turnClass={turn.turnClass} pending={waiting && index === turns.length - 1} />
          )
        )}
      </div>

      <form onSubmit={submit} className="mt-4 flex items-center gap-2 lowercase">
        <span style={{ color: '#6b7280' }}>&gt;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={waiting}
          aria-label="command"
          className="w-full border-0 bg-transparent lowercase outline-none"
          style={{ color: '#e8e6e1', caretColor: '#22d3ee' }}
        />
        <span className="caret-blink inline-block h-4 w-2" style={{ background: '#22d3ee' }} />
      </form>
    </section>
  );
}

function Reply({ text, turnClass = 'read', pending }: { text: string; turnClass?: TurnClass; pending: boolean }) {
  const color = turnClass === 'proposal' ? '#f5a623' : turnClass === 'door' ? '#ef4444' : '#22d3ee';
  return (
    <div style={{ color }}>
      {turnClass === 'door' && <p>one-way door. this does not reverse.</p>}
      {turnClass === 'proposal' && <p>prepare done. nothing saved.</p>}
      {text && <p className="whitespace-pre-wrap">{text}</p>}
      {!pending && turnClass === 'executed' && <p>executed. logged.</p>}
      {!pending && (turnClass === 'proposal' || turnClass === 'door') && (
        <>
          <p>requires human.</p>
          <p style={{ color: '#6b7280' }}>awaiting.</p>
        </>
      )}
      {!pending && turnClass === 'read' && <p style={{ color: '#6b7280' }}>awaiting.</p>}
    </div>
  );
}
