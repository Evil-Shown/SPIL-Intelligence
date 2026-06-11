import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { StarRating } from '../components/modules/StarRating';
import { ideasApi } from '../services/endpoints';
import { containerVariants } from '../lib/constants';
import type { Priority } from '../types';

const priorityVariant: Record<Priority, 'risk' | 'warning' | 'draft'> = {
  CRITICAL: 'risk',
  HIGH: 'risk',
  MEDIUM: 'warning',
  LOW: 'draft',
};

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Ideas Board</h1>

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
          icon={<Lightbulb size={24} />}
          title="No ideas yet"
          description="Capture innovative ideas for the SPIL Opti workspace."
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="columns-1 gap-4 md:columns-2 xl:columns-3"
        >
          {ideas.map((idea) => (
            <div key={idea.id} className="mb-4 break-inside-avoid">
              <Card>
                <div className="mb-2 flex items-center gap-2">
                  <span>💡</span>
                  <h3 className="font-semibold text-primary">{idea.title}</h3>
                </div>
                <div className="mb-3 flex items-center gap-3">
                  <StarRating
                    rating={idea.rating}
                    onChange={(rating) => ratingMutation.mutate({ id: idea.id, rating })}
                  />
                  <Badge variant={priorityVariant[idea.priority]}>
                    Priority: {idea.priority}
                  </Badge>
                </div>
                <p className="mb-4 text-sm text-secondary">{idea.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="draft">{idea.status}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => promoteMutation.mutate(idea.id)}
                    disabled={promoteMutation.isPending}
                  >
                    Promote to Project →
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
