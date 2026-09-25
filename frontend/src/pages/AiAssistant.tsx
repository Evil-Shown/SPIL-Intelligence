import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DataField } from '../components/hud/CommandDeck';
import { aiApi, projectsApi, streamChat } from '../services/endpoints';
import { useUiStore } from '../store/uiStore';
import { formatRelativeTime } from '../lib/utils';

export function AiAssistant() {
  const location = useLocation();
  const [messages, setMessages] = useState<{ role: 'USER' | 'ASSISTANT'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [projectId, setProjectId] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentFromHome = useRef(false);
  const triggerNeuralPulse = useUiStore((s) => s.triggerNeuralPulse);

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: aiApi.conversations,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  useEffect(() => {
    const state = location.state as { initialMessage?: string } | null;
    if (state?.initialMessage && !sentFromHome.current) {
      sentFromHome.current = true;
      sendMessage(state.initialMessage);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'USER', content: msg }, { role: 'ASSISTANT', content: '' }]);
    setStreaming(true);

    let assistantContent = '';
    await streamChat(
      msg,
      { conversationId, projectId: projectId || undefined },
      (delta) => {
        assistantContent += delta;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'ASSISTANT', content: assistantContent };
          return updated;
        });
      },
      (convId) => {
        setConversationId(convId);
        setStreaming(false);
        triggerNeuralPulse();
      },
      () => setStreaming(false)
    );
  };

  const loadConversation = async (id: string) => {
    const conv = await aiApi.getConversation(id);
    setConversationId(id);
    setMessages(conv.messages?.map((m) => ({ role: m.role as 'USER' | 'ASSISTANT', content: m.content })) ?? []);
    setShowHistory(false);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage();
  };

  const idle = messages.length === 0;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#f7f7f7] text-black">
      <DataField />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.9) 24%, rgba(255,255,255,0.45) 52%, rgba(190,190,190,0.28) 100%)',
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 pt-6 text-[10px] uppercase tracking-[0.28em]">
        <Link to="/" className="font-display tracking-[0.46em] text-black/35 hover:text-black">
          SPIL
        </Link>
        <div className="flex items-center gap-4 font-mono text-black/40">
          <button type="button" onClick={() => setShowHistory((open) => !open)} className="hover:text-black">
            {showHistory ? 'Close' : 'History'}
          </button>
          <button
            type="button"
            onClick={() => {
              setConversationId(undefined);
              setMessages([]);
            }}
            className="hover:text-black"
          >
            New
          </button>
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="bg-transparent uppercase tracking-[0.18em] outline-none"
            aria-label="Project context"
          >
            <option value="">No project</option>
            {projects?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {showHistory && (
        <div className="relative z-10 mx-auto mt-4 w-full max-w-md border border-black/80 bg-white px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em]">
          {conversations?.length ? (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => loadConversation(conv.id)}
                className="flex w-full items-baseline justify-between gap-4 py-1.5 text-left text-black/60 hover:text-black"
              >
                <span className="truncate">{conv.title ?? 'Untitled'}</span>
                <span className="shrink-0 text-black/30">{formatRelativeTime(conv.updatedAt)}</span>
              </button>
            ))
          ) : (
            <p className="text-black/35">No earlier commands</p>
          )}
        </div>
      )}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6">
        {idle ? (
          <div className="rise-in my-auto flex w-full max-w-lg flex-col items-center pb-10 text-center">
            <div className="h-px w-[min(100%,380px)] bg-black" />
            <p className="font-display my-[14px] text-[12px] font-medium lowercase tracking-[0.42em] sm:text-[14px]">
              what are your commands?
            </p>
            <div className="h-px w-[min(100%,380px)] bg-black" />
            <div className="mt-3.5 h-0 w-0 border-x-[6px] border-x-transparent border-b-[9px] border-b-[#d10505]" />
          </div>
        ) : (
          <div className="my-auto w-full max-w-[640px] space-y-6 py-10">
            {messages.map((message, index) =>
              message.role === 'USER' ? (
                <p key={index} className="text-center font-mono text-[12px] lowercase tracking-[0.18em] text-black/80">
                  &gt; {message.content}
                </p>
              ) : (
                <div key={index} className="border border-black/90 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between border-b border-black/90 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.26em]">
                    <span className="lowercase tracking-[0.2em]">aura · herald</span>
                    <span className="flex gap-[5px]">
                      <i className="lamp block h-1.5 w-1.5 bg-[#d10505]" />
                      <i className="lamp block h-1.5 w-1.5 bg-[#d10505]" style={{ animationDelay: '1.1s' }} />
                    </span>
                  </div>
                  <div className="bg-[#0a0a0a] px-4 py-4 font-mono text-[12px] lowercase leading-relaxed tracking-wide text-[#e7e1d6] [&_p]:my-1 [&_strong]:text-white">
                    {message.content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    ) : (
                      <span>
                        reading
                        <span className="caret-blink">_</span>
                      </span>
                    )}
                    {streaming && index === messages.length - 1 && message.content && <span className="caret-blink">_</span>}
                    {!streaming && message.content && <p className="pt-2 text-[#f5c16c]">awaiting.</p>}
                  </div>
                </div>
              )
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="relative z-10 px-6 pb-8">
        <div className="mx-auto flex w-full max-w-[420px] items-end gap-3 border border-black/90 bg-white">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="can you hear me?"
            disabled={streaming}
            className="w-full bg-transparent px-3.5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] outline-none placeholder:text-black/25 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="px-3.5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#d10505] disabled:opacity-30"
          >
            {streaming ? '…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
