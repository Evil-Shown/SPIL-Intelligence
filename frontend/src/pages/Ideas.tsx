import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Section, Register } from '../components/hud/Section';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { StarRating } from '../components/modules/StarRating';
import { ideasApi } from '../services/endpoints';

export function Ideas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: ideas, isLoading, error, refetch } = useQuery({
    queryKey: ['ideas'],
    queryFn: ideasApi.list,
  });

  const ratingMutation = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) =>
      ideasApi.update(id, { rating }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideas'] }),
  });

  const promoteMutation = useMutation({
    mutationFn: ideasApi.promote,
    onSuccess: (project) => navigate(`/projects/${project.id}`),
  });

  if (error) {
    return (
      <EmptyState
        title="Failed to load ideas"
        description={error.message}
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <Section kicker="Engineering" title="IDEAS">

      {isLoading ? (
        <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : !ideas?.length ? (
        <EmptyState
          title="No ideas yet"
          description="Capture innovative ideas for the SPIL Opti workspace."
        />
      ) : (
        <Register>
          {ideas.map((idea) => (
            <div key={idea.id} className="border-b border-black/10 py-5">
              <div className="flex items-baseline justify-between gap-6">
                <h2 className="font-display text-lg tracking-wide text-black">{idea.title}</h2>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-black/70">
                  {idea.priority}
                </span>
              </div>
              {idea.description && <p className="mt-1 max-w-xl text-sm text-black/55">{idea.description}</p>}
              <div className="mt-3 flex items-center justify-between gap-4">
                <StarRating rating={idea.rating} onChange={(rating) => ratingMutation.mutate({ id: idea.id, rating })} />
                <button
                  type="button"
                  onClick={() => promoteMutation.mutate(idea.id)}
                  disabled={promoteMutation.isPending}
                  className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d10505] disabled:opacity-40"
                >
                  Promote
                </button>
              </div>
            </div>
          ))}
        </Register>
      )}
    </Section>
  );
}
