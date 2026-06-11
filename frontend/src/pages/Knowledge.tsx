import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { documentsApi, projectsApi, algorithmsApi, decisionsApi } from '../services/endpoints';
import { formatRelativeTime } from '../lib/utils';

export function Knowledge() {
  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list(),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const { data: algorithms } = useQuery({
    queryKey: ['algorithms'],
    queryFn: algorithmsApi.list,
  });

  const { data: decisions } = useQuery({
    queryKey: ['decisions'],
    queryFn: () => decisionsApi.list(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Knowledge Base</h1>
        <p className="mt-1 text-sm text-muted">
          Central intelligence layer for SPIL Opti — documentation, algorithms, and decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Documents', value: documents?.length ?? 0, icon: '📄' },
          { label: 'Algorithms', value: algorithms?.length ?? 0, icon: '📚' },
          { label: 'ADRs', value: decisions?.length ?? 0, icon: '📝' },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="font-mono text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold text-primary">Documentation</h3>
          {docsLoading ? (
            <CardSkeleton />
          ) : !documents?.length ? (
            <EmptyState icon={<Brain size={20} />} title="No documents" description="Project documentation will appear here." />
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <Link
                  key={doc.id}
                  to="/documents"
                  className="flex items-center justify-between rounded-lg border border-subtle px-3 py-2.5 transition-colors hover:border-active hover:bg-overlay"
                >
                  <span className="text-sm text-primary">{doc.title}</span>
                  <span className="text-xs text-muted">{formatRelativeTime(doc.updatedAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-primary">Projects</h3>
          <div className="space-y-2">
            {projects?.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-lg border border-subtle px-3 py-2.5 transition-colors hover:border-active hover:bg-overlay"
              >
                <span className="text-sm text-primary">{p.name}</span>
                <span className="font-mono text-xs text-neural">{p.progress}%</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
