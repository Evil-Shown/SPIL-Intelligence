import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { SidePanel } from '../components/modules/SidePanel';
import { Section } from '../components/hud/Section';
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
    <Section kicker="Engineering" title="RESEARCH">

      {isLoading ? (
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="border-t border-black/15">
          {columns.map((col) => {
            const group = items?.filter((item) => item.status === col.status) ?? [];
            if (!group.length) return null;
            return (
              <div key={col.status}>
                <p className="pt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                  {col.label}
                </p>
                {group.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openPanel(item)}
                    className="block w-full border-b border-black/10 py-5 text-left"
                  >
                    <div className="flex items-baseline justify-between gap-6">
                      <h2 className="font-display text-lg tracking-wide text-black">{item.title}</h2>
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                        {formatDate(item.updatedAt)}
                      </span>
                    </div>
                    {item.problem && <p className="mt-1 line-clamp-2 max-w-xl text-sm text-black/55">{item.problem}</p>}
                  </button>
                ))}
              </div>
            );
          })}
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
    </Section>
  );
}
