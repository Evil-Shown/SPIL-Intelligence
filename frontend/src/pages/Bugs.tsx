import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bug } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { SidePanel } from '../components/modules/SidePanel';
import { bugsApi } from '../services/endpoints';
import { formatDate, cn } from '../lib/utils';
import type { Bug as BugType, BugStatus, Severity } from '../types';

const severityVariant: Record<Severity, 'risk' | 'warning' | 'draft'> = {
  CRITICAL: 'risk',
  HIGH: 'risk',
  MEDIUM: 'warning',
  LOW: 'draft',
};

const statusVariant: Record<BugStatus, 'risk' | 'warning' | 'active' | 'draft'> = {
  OPEN: 'risk',
  IN_PROGRESS: 'warning',
  RESOLVED: 'active',
  WONT_FIX: 'draft',
};

export function Bugs() {
  const [selected, setSelected] = useState<BugType | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');

  const { data: bugs, isLoading, error, refetch } = useQuery({
    queryKey: ['bugs'],
    queryFn: () => bugsApi.list(),
  });

  const filtered = bugs?.filter((b) => severityFilter === 'ALL' || b.severity === severityFilter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Bugs</h1>

      <div className="flex flex-wrap gap-2">
        {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs transition-colors',
              severityFilter === s ? 'border-active bg-overlay text-neural' : 'border-subtle text-muted'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {error ? (
        <EmptyState title="Failed to load bugs" description={error.message} actionLabel="Retry" onAction={() => refetch()} />
      ) : isLoading ? (
        <CardSkeleton />
      ) : !filtered?.length ? (
        <EmptyState icon={<Bug size={24} />} title="No bugs found" description="No bugs match the current filter." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle bg-elevated text-left">
                <th className="px-4 py-3 font-mono text-xs uppercase text-muted">ID</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-muted">Title</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-muted">Severity</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-muted">Module</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-muted">Status</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-muted">Assigned</th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-muted">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bug) => (
                <tr
                  key={bug.id}
                  onClick={() => setSelected(bug)}
                  className="cursor-pointer border-b border-subtle transition-colors hover:bg-overlay"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted">{bug.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-primary">{bug.title}</td>
                  <td className="px-4 py-3"><Badge variant={severityVariant[bug.severity]}>{bug.severity}</Badge></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{bug.module}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[bug.status]}>{bug.status.replace('_', ' ')}</Badge></td>
                  <td className="px-4 py-3 text-secondary">{bug.assignee}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(bug.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SidePanel open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? 'Bug Detail'}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex gap-2">
              <Badge variant={severityVariant[selected.severity]}>{selected.severity}</Badge>
              <Badge variant={statusVariant[selected.status]}>{selected.status}</Badge>
            </div>
            <div>
              <h4 className="mb-1 text-xs uppercase text-muted">Description</h4>
              <p className="text-secondary">{selected.description}</p>
            </div>
            {selected.resolution && (
              <div>
                <h4 className="mb-1 text-xs uppercase text-muted">Resolution</h4>
                <p className="text-secondary">{selected.resolution}</p>
              </div>
            )}
            <div className="text-xs text-muted">
              Module: {selected.module} · Assigned: {selected.assignee} · Created: {formatDate(selected.createdAt)}
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
