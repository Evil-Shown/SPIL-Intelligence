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
        <div className="grid grid-cols-1 gap-3">
          {filtered?.map((decision) => (
            <article
              key={decision.id}
              className="group relative border border-black/80 bg-white p-4 shadow-none transition-all hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {/* Corner crosshairs */}
              <span className="absolute -top-[3px] -left-[3px] font-mono text-[8px] leading-none text-black/40 select-none">
                +
              </span>
              <span className="absolute -top-[3px] -right-[3px] font-mono text-[8px] leading-none text-black/40 select-none">
                +
              </span>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-bold text-[#e10600]">
                    ADR-{String(decision.number).padStart(3, '0')}
                  </span>
                  <h2 className="font-mono text-base font-bold uppercase tracking-wide text-black group-hover:text-[#e10600] transition-colors">
                    {decision.title}
                  </h2>
                </div>
                <span className="border border-black/40 bg-black/5 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black/80">
                  {decision.status.replace('_', ' ')}
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-black/75 font-sans">
                {decision.decision}
              </p>
              {decision.reason && (
                <p className="mt-1 text-xs text-black/50 font-sans italic">
                  Rationale: {decision.reason}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-black/40">
                <span>RATIFIED: {formatDate(decision.createdAt)}</span>
                <span className="text-[#e10600] opacity-0 group-hover:opacity-100 transition-opacity">
                  RECORD VERIFIED ➔
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}
