import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { SidePanel } from '../components/modules/SidePanel';
import { researchApi } from '../services/endpoints';
import { formatDate } from '../lib/utils';
import type { Research, ResearchStatus } from '../types';

const columns: { status: ResearchStatus; label: string; icon: string }[] = [
  { status: 'IDEA', label: 'Idea', icon: '💡' },
  { status: 'EXPERIMENTING', label: 'Experimenting', icon: '🔬' },
  { status: 'ANALYZING', label: 'Analyzing', icon: '📊' },
  { status: 'CONCLUDED', label: 'Concluded', icon: '✅' },
  { status: 'ARCHIVED', label: 'Archived', icon: '📦' },
];

const sections = ['problem', 'hypothesis', 'experiment', 'results', 'conclusion', 'nextSteps'] as const;

export function ResearchPage() {
  const [selected, setSelected] = useState<Research | null>(null);
  const [editData, setEditData] = useState<Partial<Research>>({});
  const queryClient = useQueryClient();

  const { data: items, isLoading, error, refetch } = useQuery({
    queryKey: ['research'],
    queryFn: researchApi.list,
  });

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Research> }) =>
      researchApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research'] });
    },
  });

  const openPanel = (item: Research) => {
    setSelected(item);
    setEditData({
      problem: item.problem ?? '',
      hypothesis: item.hypothesis ?? '',
      experiment: item.experiment ?? '',
      results: item.results ?? '',
      conclusion: item.conclusion ?? '',
      nextSteps: item.nextSteps ?? '',
    });
  };

  const saveField = (field: (typeof sections)[number], value: string) => {
    if (!selected) return;
    mutation.mutate({ id: selected.id, data: { [field]: value } });
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  if (error) {
    return (
      <EmptyState
        title="Failed to load research"
        description={error.message}
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Research</h1>

      {isLoading ? (
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div key={col.status} className="min-w-[260px] flex-1">
              <div className="mb-3 flex items-center gap-2">
                <span>{col.icon}</span>
                <span className="text-sm font-medium text-primary">{col.label}</span>
                <span className="font-mono text-xs text-muted">
                  {items?.filter((i) => i.status === col.status).length ?? 0}
                </span>
              </div>
              <div className="space-y-3">
                {items
                  ?.filter((i) => i.status === col.status)
                  .map((item) => (
                    <motion.div key={item.id} whileHover={{ scale: 1.01 }}>
                      <Card
                        hover
                        className="cursor-pointer !p-4"
                        onClick={() => openPanel(item)}
                      >
                        <h3 className="mb-2 text-sm font-semibold text-primary">{item.title}</h3>
                        <div className="mb-2 flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <span key={tag} className="font-mono text-[10px] uppercase text-muted">
                              {tag}
                            </span>
                          ))}
                        </div>
                        {item.problem && (
                          <p className="mb-3 text-xs text-muted line-clamp-3">{item.problem}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted">
                          <Badge variant="draft">{item.status}</Badge>
                          <span>{formatDate(item.updatedAt)}</span>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <SidePanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? 'Research Detail'}
      >
        {selected && (
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section}>
                <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted">
                  {section.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <textarea
                  value={(editData[section] as string) ?? ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, [section]: e.target.value }))}
                  onBlur={(e) => saveField(section, e.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-default bg-surface px-3 py-2 text-sm text-primary focus:border-neural-core focus:outline-none focus:shadow-[0_0_0_3px_var(--neural-glow)]"
                />
              </div>
            ))}
          </div>
        )}
      </SidePanel>
    </div>
  );
}
