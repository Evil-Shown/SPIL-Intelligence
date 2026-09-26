import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bug } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { SidePanel } from '../components/modules/SidePanel';
import { Section } from '../components/hud/Section';
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
    <Section
      kicker="Work"
      title="BUGS"
      action={
        <div className="flex flex-wrap gap-3">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={cn(
                'font-mono text-[11px] font-semibold uppercase tracking-[0.14em]',
                severityFilter === s ? 'text-[#d10505]' : 'text-black/45 hover:text-black'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      }
    >

      {error ? (
        <EmptyState title="Failed to load bugs" description={error.message} actionLabel="Retry" onAction={() => refetch()} />
      ) : isLoading ? (
        <CardSkeleton />
      ) : !filtered?.length ? (
        <EmptyState icon={<Bug size={24} />} title="No bugs found" description="No bugs match the current filter." />
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {filtered.map((bug) => (
            <button
              key={bug.id}
              type="button"
              onClick={() => setSelected(bug)}
              className="group relative flex w-full flex-col sm:flex-row sm:items-center justify-between gap-3 border border-black/80 bg-white p-3.5 text-left transition-all hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {/* Crosshairs */}
              <span className="absolute -top-[3px] -left-[3px] font-mono text-[8px] leading-none text-black/40 select-none">
                +
              </span>
              <span className="absolute -top-[3px] -right-[3px] font-mono text-[8px] leading-none text-black/40 select-none">
                +
              </span>

              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] font-bold text-[#e10600]">
                  BUG-{bug.id.slice(0, 5).toUpperCase()}
                </span>
                <span className="font-mono text-sm font-semibold tracking-wide text-black group-hover:text-[#e10600] transition-colors">
                  {bug.title}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                <span
                  className={cn(
                    'border px-2 py-0.5 font-bold',
                    bug.severity === 'CRITICAL'
                      ? 'border-[#e10600] bg-[#e10600]/10 text-[#e10600]'
                      : bug.severity === 'HIGH'
                      ? 'border-[#e10600]/70 text-[#e10600]'
                      : 'border-black/30 text-black/60'
                  )}
                >
                  {bug.severity}
                </span>
                <span className="border border-black/40 bg-black/5 px-2 py-0.5 font-bold text-black/80">
                  {bug.status.replace('_', ' ')}
                </span>
                <span className="text-[#e10600] opacity-0 group-hover:opacity-100 transition-opacity">
                  ➔
                </span>
              </div>
            </button>
          ))}
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
    </Section>
  );
}
