import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Files } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { SidePanel } from '../components/modules/SidePanel';
import { documentsApi } from '../services/endpoints';
import { formatRelativeTime } from '../lib/utils';
import type { Document } from '../types';

export function Documents() {
  const [selected, setSelected] = useState<Document | null>(null);

  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Documents</h1>

      {error ? (
        <EmptyState title="Failed to load documents" description={error.message} actionLabel="Retry" onAction={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !documents?.length ? (
        <EmptyState icon={<Files size={24} />} title="No documents" description="Project documentation will be stored here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((doc) => (
            <Card key={doc.id} hover className="cursor-pointer" onClick={() => setSelected(doc)}>
              <h3 className="mb-2 font-medium text-primary">{doc.title}</h3>
              <p className="mb-3 text-sm text-muted line-clamp-2">{doc.content}</p>
              <div className="flex items-center justify-between text-xs text-muted">
                <div className="flex gap-1">
                  {doc.tags.map((tag) => (
                    <span key={tag} className="rounded bg-elevated px-1.5 py-0.5 font-mono">{tag}</span>
                  ))}
                </div>
                <span>{formatRelativeTime(doc.updatedAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SidePanel open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? 'Document'}>
        {selected && (
          <div className="prose prose-sm max-w-none prose-headings:text-primary prose-p:text-secondary">
            <pre className="whitespace-pre-wrap font-sans text-sm text-secondary">{selected.content}</pre>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
