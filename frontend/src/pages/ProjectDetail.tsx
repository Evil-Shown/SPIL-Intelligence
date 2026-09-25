import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../services/endpoints';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ChatMessage } from '../components/modules/ChatMessage';
import { formatRelativeTime, cn } from '../lib/utils';
import { streamChat } from '../services/endpoints';
import { useUiStore } from '../store/uiStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const tabs = ['Overview', 'Tasks', 'Research', 'Decisions', 'Bugs', 'Documents', 'AI Chat'] as const;

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'USER' | 'ASSISTANT'; content: string }[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const triggerNeuralPulse = useUiStore((s) => s.triggerNeuralPulse);

  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  });

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || streaming) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setMessages((prev) => [...prev, { role: 'USER', content: userMsg }]);
    setStreaming(true);

    let assistantContent = '';
    setMessages((prev) => [...prev, { role: 'ASSISTANT', content: '' }]);

    await streamChat(
      userMsg,
      { conversationId, projectId: id },
      (text) => {
        assistantContent += text;
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

  if (isLoading) return <CardSkeleton />;
  if (error || !project)
    return (
      <EmptyState
        title="Project not found"
        description={error?.message ?? 'This project does not exist.'}
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/40">{project.team}</p>
        <h1 className="font-display mt-2 text-3xl font-medium tracking-[0.12em] text-black">{project.name}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/55">{project.description}</p>
        <p className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-black/70">
          {project.status} · {project.progress}% · {formatRelativeTime(project.updatedAt)}
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto border-b border-black/10">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'whitespace-nowrap pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]',
              activeTab === tab ? 'border-b-2 border-[#d10505] text-black' : 'text-black/40 hover:text-black'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="border-t border-black/10">
          {project.tasks?.slice(0, 4).map((t) => (
            <div key={t.id} className="flex items-baseline justify-between gap-4 border-b border-black/10 py-3">
              <span className="text-sm text-black">{t.title}</span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-black/50">{t.status}</span>
            </div>
          ))}
          {project.bugs?.slice(0, 3).map((b) => (
            <div key={b.id} className="flex items-baseline justify-between gap-4 border-b border-black/10 py-3">
              <span className="text-sm text-black">{b.title}</span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d10505]">{b.status}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Tasks' && (
        <div className="border-t border-black/10">
          {project.tasks?.map((t) => (
            <div key={t.id} className="flex items-baseline justify-between gap-4 border-b border-black/10 py-4">
              <span className="text-sm text-black">{t.title}</span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">{t.status}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Research' && (
        <div className="space-y-2">
          {project.research?.map((r) => (
            <Card key={r.id} className="!py-3">
              <span className="text-sm text-primary">{r.title}</span>
              <Badge className="ml-2" variant="draft">{r.status}</Badge>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'Decisions' && (
        <div className="space-y-2">
          {project.decisions?.map((d) => (
            <Card key={d.id} className="!py-3">
              <span className="font-mono text-xs text-neural">ADR-{String(d.number).padStart(3, '0')}</span>
              <span className="ml-2 text-sm text-primary">{d.title}</span>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'Bugs' && (
        <div className="space-y-2">
          {project.bugs?.map((b) => (
            <Card key={b.id} className="!py-3">
              <span className="text-sm text-primary">{b.title}</span>
              <Badge className="ml-2" variant={b.severity === 'CRITICAL' ? 'risk' : 'warning'}>{b.status}</Badge>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'Documents' && (
        <div className="space-y-2">
          {project.documents?.map((d) => (
            <Card key={d.id} className="!py-3">
              <span className="text-sm text-primary">{d.title}</span>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'AI Chat' && (
        <div className="flex h-[calc(100vh-280px)] flex-col">
          <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-subtle bg-surface px-4 py-2 text-xs text-muted">
            <span>Loaded:</span>
            {['Documentation', 'Research', 'Decisions', 'Tasks', 'Algorithms'].map((ctx) => (
              <span key={ctx} className="text-status-active">✓ {ctx}</span>
            ))}
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-subtle bg-surface p-4">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-muted">Ask about this project's architecture, decisions, or tasks.</p>
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
          </div>
          <form onSubmit={sendMessage} className="mt-4 flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about this project..."
              className="flex-1"
            />
            <Button type="submit" disabled={streaming}>Send</Button>
          </form>
        </div>
      )}
    </div>
  );
}
