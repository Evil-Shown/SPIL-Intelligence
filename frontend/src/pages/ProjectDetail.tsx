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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{project.name}</h1>
        <p className="mt-1 text-sm text-muted">{project.description}</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'whitespace-nowrap px-4 py-2.5 text-sm transition-colors',
              activeTab === tab
                ? 'border-b-2 border-neural-core text-neural'
                : 'text-muted hover:text-primary'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <h3 className="mb-3 font-semibold text-primary">Description</h3>
              <p className="text-sm leading-relaxed text-secondary">{project.description}</p>
            </Card>
            <Card>
              <h3 className="mb-3 font-semibold text-primary">Recent Activity</h3>
              <div className="space-y-2 text-sm text-secondary">
                {project.tasks?.slice(0, 3).map((t) => (
                  <p key={t.id}>Task: {t.title} — {t.status}</p>
                ))}
                {project.bugs?.slice(0, 2).map((b) => (
                  <p key={b.id}>Bug: {b.title} — {b.status}</p>
                ))}
              </div>
            </Card>
          </div>
          <Card>
            <h3 className="mb-4 font-semibold text-primary">Meta</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted">Status</dt>
                <dd><Badge variant="active">{project.status}</Badge></dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted">Team</dt>
                <dd className="text-secondary">{project.team}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted">Progress</dt>
                <dd className="font-mono text-neural">{project.progress}%</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted">Updated</dt>
                <dd className="text-secondary">{formatRelativeTime(project.updatedAt)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      )}

      {activeTab === 'Tasks' && (
        <div className="space-y-2">
          {project.tasks?.map((t) => (
            <Card key={t.id} className="!py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary">{t.title}</span>
                <Badge variant={t.priority === 'HIGH' ? 'risk' : 'draft'}>{t.status}</Badge>
              </div>
            </Card>
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
