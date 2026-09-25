import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Section } from '../components/hud/Section';
import { decisionsApi } from '../services/endpoints';
import { formatDate, cn } from '../lib/utils';
import type { DecisionStatus } from '../types';

const filters: { label: string; value?: DecisionStatus }[] = [
  { label: 'All' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Superseded', value: 'SUPERSEDED' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
];

export function Decisions() {
  const [filter, setFilter] = useState<DecisionStatus | undefined>();

  const { data: decisions, isLoading, error, refetch } = useQuery({
    queryKey: ['decisions', filter],
    queryFn: () => decisionsApi.list(filter),
  });

  const filtered = filter
    ? decisions?.filter((d) => d.status === filter)
    : decisions;

  return (
    <Section
      kicker="Engineering"
      title="DECISIONS"
      action={
        <div className="flex flex-wrap gap-3">
          {filters.map((f) => (
            <button
              key={f.label}
              onClick={() => setFilter(f.value)}
              className={cn(
                'font-mono text-[11px] font-semibold uppercase tracking-[0.14em]',
                filter === f.value ? 'text-[#d10505]' : 'text-black/45 hover:text-black'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      }
    >

      {error ? (
        <EmptyState title="Failed to load decisions" description={error.message} actionLabel="Retry" onAction={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="border-t border-black/15">
          {filtered?.map((decision) => (
            <article key={decision.id} className="border-b border-black/10 py-5">
              <div className="flex items-baseline justify-between gap-6">
                <h2 className="font-display text-lg tracking-wide text-black">{decision.title}</h2>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-black/70">
                  ADR-{String(decision.number).padStart(3, '0')} · {decision.status.replace('_', ' ')}
                </span>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/55">{decision.decision}</p>
              {decision.reason && <p className="mt-1 max-w-xl text-sm text-black/40">{decision.reason}</p>}
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">{formatDate(decision.createdAt)}</p>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}
