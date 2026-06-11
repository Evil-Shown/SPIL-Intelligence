import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ChatMessage } from '../components/modules/ChatMessage';
import { aiApi, projectsApi, streamChat } from '../services/endpoints';
import { useUiStore } from '../store/uiStore';
import { formatRelativeTime, cn } from '../lib/utils';

export function AiAssistant() {
  const location = useLocation();
  const [messages, setMessages] = useState<{ role: 'USER' | 'ASSISTANT'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [projectId, setProjectId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const triggerNeuralPulse = useUiStore((s) => s.triggerNeuralPulse);

  const { data: conversations, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: aiApi.conversations,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  useEffect(() => {
    const state = location.state as { initialMessage?: string } | null;
    if (state?.initialMessage) {
      sendMessage(state.initialMessage);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'USER', content: msg }]);
    setStreaming(true);

    let assistantContent = '';
    setMessages((prev) => [...prev, { role: 'ASSISTANT', content: '' }]);

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
    setMessages(
      conv.messages?.map((m) => ({ role: m.role as 'USER' | 'ASSISTANT', content: m.content })) ?? []
    );
  };

  const newChat = () => {
    setConversationId(undefined);
    setMessages([]);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      <aside className="hidden w-[280px] shrink-0 flex-col rounded-xl border border-subtle bg-surface lg:flex">
        <div className="flex items-center justify-between border-b border-subtle p-4">
          <h2 className="text-sm font-semibold text-primary">History</h2>
          <Button variant="ghost" size="sm" onClick={newChat}>New</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {convsLoading ? (
            <CardSkeleton />
          ) : (
            conversations?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={cn(
                  'mb-1 w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-overlay',
                  conversationId === conv.id && 'bg-overlay border-l-2 border-neural-core'
                )}
              >
                <p className="truncate text-xs text-primary">{conv.title ?? 'Untitled'}</p>
                <p className="text-[10px] text-muted">{formatRelativeTime(conv.updatedAt)}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col rounded-xl border border-subtle bg-surface">
        <div className="border-b border-subtle p-4">
          <h1 className="text-lg font-bold text-primary">AI Assistant</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted">Project context:</span>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="rounded-lg border border-default bg-elevated px-2 py-1 text-primary"
              >
                <option value="">None</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 text-status-active">
              {['Docs', 'Research', 'Decisions', 'Algorithms', 'Tasks'].map((ctx) => (
                <span key={ctx}>✓ {ctx}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neural-glow">
                <div className="h-6 w-6 rounded-full bg-neural-core shadow-[0_0_12px_var(--neural-core)]" />
              </div>
              <h2 className="text-lg font-semibold text-primary">SPIL Intelligence</h2>
              <p className="mt-2 max-w-md text-sm text-muted">
                Ask about geometry algorithms, project decisions, shapes-core, or glass manufacturing workflows.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                streaming={streaming && i === messages.length - 1 && msg.role === 'ASSISTANT'}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="border-t border-subtle p-4"
        >
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask SPIL Intelligence..."
              className="flex-1"
              disabled={streaming}
            />
            <Button type="submit" disabled={streaming || !input.trim()}>
              {streaming ? '...' : 'Send'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
