import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { SidePanel } from '../components/modules/SidePanel';
import { Section } from '../components/hud/Section';
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
    <Section kicker="Work" title="DOCUMENTS">

      {error ? (
        <EmptyState title="Failed to load documents" description={error.message} actionLabel="Retry" onAction={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !documents?.length ? (
        <EmptyState title="No documents" description="Project documentation will be stored here." />
      ) : (
        <div className="border-t border-black/15">
          {documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setSelected(doc)}
              className="block w-full border-b border-black/10 py-5 text-left"
            >
              <div className="flex items-baseline justify-between gap-6">
                <h2 className="font-display text-lg tracking-wide text-black">{doc.title}</h2>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                  {formatRelativeTime(doc.updatedAt)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 max-w-xl text-sm text-black/55">{doc.content}</p>
            </button>
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
    </Section>
  );
}
