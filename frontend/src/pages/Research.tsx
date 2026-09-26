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
        <div className="space-y-6">
          {columns.map((col) => {
            const group = items?.filter((item) => item.status === col.status) ?? [];
            if (!group.length) return null;
            return (
              <div key={col.status} className="border border-black/80 bg-white">
                <div className="flex items-center justify-between border-b border-black/80 bg-[#f4f4f4] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{col.icon}</span>
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-black">
                      {col.label}
                    </span>
                  </div>
                  <span className="border border-black/40 bg-white px-2 py-0.5 font-mono text-[9px] font-bold text-black">
                    {group.length}
                  </span>
                </div>
                <div className="p-3 grid grid-cols-1 gap-2.5 bg-[#fafafa]/50">
                  {group.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openPanel(item)}
                      className="group relative block w-full border border-black/80 bg-white p-3 text-left transition-all hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <span className="absolute -top-[3px] -left-[3px] font-mono text-[8px] leading-none text-black/40 select-none">
                        +
                      </span>
                      <span className="absolute -top-[3px] -right-[3px] font-mono text-[8px] leading-none text-black/40 select-none">
                        +
                      </span>
                      <div className="flex items-baseline justify-between gap-4">
                        <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-black group-hover:text-[#e10600] transition-colors">
                          {item.title}
                        </h2>
                        <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-black/50">
                          {formatDate(item.updatedAt)}
                        </span>
                      </div>
                      {item.problem && (
                        <p className="mt-1 line-clamp-2 text-xs text-black/70 font-sans">
                          {item.problem}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-1.5 font-mono text-[8px] uppercase tracking-wider text-black/40">
                        <span>DOSSIER #{item.id.slice(0, 6)}</span>
                        <span className="text-[#e10600] opacity-0 group-hover:opacity-100 transition-opacity">
                          INSPECT ➔
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
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
