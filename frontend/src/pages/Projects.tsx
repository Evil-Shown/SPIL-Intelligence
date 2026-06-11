import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, LayoutGrid, List, FolderKanban } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { projectsApi } from '../services/endpoints';
import { containerVariants } from '../lib/constants';
import { formatRelativeTime, cn } from '../lib/utils';
import type { ProjectStatus } from '../types';

const statusVariant: Record<ProjectStatus, 'active' | 'warning' | 'draft'> = {
  ACTIVE: 'active',
  PAUSED: 'warning',
  COMPLETED: 'draft',
  ARCHIVED: 'draft',
};

export function Projects() {
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Projects</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-subtle">
            <button
              onClick={() => setView('grid')}
              className={cn('rounded-l-lg p-2', view === 'grid' ? 'bg-overlay text-neural' : 'text-muted')}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('rounded-r-lg p-2', view === 'list' ? 'bg-overlay text-neural' : 'text-muted')}
            >
              <List size={16} />
            </button>
          </div>
          <Button>
            <Plus size={16} className="mr-1.5" />
            New Project
          </Button>
        </div>
      </div>

      {error ? (
        <EmptyState
          title="Failed to load projects"
          description={error.message}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !projects?.length ? (
        <EmptyState
          icon={<FolderKanban size={24} />}
          title="No projects yet"
          description="Create your first project to start tracking engineering work."
          actionLabel="New Project"
          onAction={() => {}}
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className={cn(
            view === 'grid'
              ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
              : 'flex flex-col gap-3'
          )}
        >
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card hover className={view === 'list' ? '!flex !flex-row !items-center !gap-6' : ''}>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    <h3 className="font-semibold text-primary">{project.name}</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted line-clamp-2">{project.description}</p>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                      <div
                        className="h-full rounded-full bg-neural-core"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-neural">{project.progress}%</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{project.team}</span>
                    <Badge variant={statusVariant[project.status]}>{project.status}</Badge>
                    <span>
                      {project.taskCount ?? 0} tasks · {project.bugCount ?? 0} open bugs
                    </span>
                    <span>Updated {formatRelativeTime(project.updatedAt)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
}
