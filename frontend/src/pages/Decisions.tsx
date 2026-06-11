import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
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

const statusVariant: Record<DecisionStatus, 'active' | 'risk' | 'warning' | 'draft'> = {
  ACCEPTED: 'active',
  REJECTED: 'risk',
  SUPERSEDED: 'warning',
  UNDER_REVIEW: 'draft',
};

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Decisions (ADR Log)</h1>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.value
                ? 'border-active bg-overlay text-neural'
                : 'border-subtle text-muted hover:text-primary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <EmptyState title="Failed to load decisions" description={error.message} actionLabel="Retry" onAction={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="relative ml-4 border-l border-subtle pl-8">
          {filtered?.map((decision) => (
            <div key={decision.id} className="relative mb-8">
              <div className="absolute -left-[41px] top-2 h-3 w-3 rounded-full border-2 border-neural-core bg-surface" />
              <Card>
                <div className="mb-3 flex items-start justify-between">
                  <span className="font-mono text-sm text-neural">
                    ADR-{String(decision.number).padStart(3, '0')}
                  </span>
                  <span className="text-xs text-muted">{formatDate(decision.createdAt)}</span>
                </div>
                <h3 className="mb-3 text-base font-semibold text-primary">{decision.title}</h3>
                <Badge variant={statusVariant[decision.status]} className="mb-4">
                  {decision.status.replace('_', ' ')}
                </Badge>
                <div className="space-y-3 text-sm text-secondary">
                  <div>
                    <span className="font-medium text-primary">Decision: </span>
                    {decision.decision}
                  </div>
                  {decision.reason && (
                    <div>
                      <span className="font-medium text-primary">Reason: </span>
                      {decision.reason}
                    </div>
                  )}
                  {decision.rejected && (
                    <div>
                      <span className="font-medium text-primary">Rejected alternatives: </span>
                      {decision.rejected}
                    </div>
                  )}
                  {decision.affectedModules.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="font-medium text-primary">Affected modules: </span>
                      {decision.affectedModules.map((m) => (
                        <span key={m} className="font-mono text-xs text-neural">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
