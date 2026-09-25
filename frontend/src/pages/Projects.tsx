import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { projectsApi } from '../services/endpoints';
import { formatRelativeTime } from '../lib/utils';

export function Projects() {
  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/40">Workspace</p>
          <h1 className="font-display mt-2 text-3xl font-medium tracking-[0.18em] text-black">PROJECTS</h1>
        </div>
        <button type="button" className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d10505]">
          + New
        </button>
      </div>

      {error ? (
        <EmptyState title="Failed to load projects" description={error.message} actionLabel="Retry" onAction={() => refetch()} />
      ) : isLoading ? (
        <CardSkeleton />
      ) : !projects?.length ? (
        <EmptyState title="No projects yet" description="Create your first project to start tracking engineering work." />
      ) : (
        <div className="border-t border-black/15">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group block border-b border-black/10 py-5"
            >
              <div className="flex items-baseline justify-between gap-6">
                <h2 className="font-display text-lg tracking-wide text-black group-hover:text-[#d10505]">
                  {project.name}
                </h2>
                <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-black/70">
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-black/55">{project.description}</p>
              )}
              <div className="mt-3 flex items-center gap-4">
                <div className="h-px max-w-[180px] flex-1 bg-black/10">
                  <div className="h-px bg-black" style={{ width: `${project.progress}%` }} />
                </div>
                <span className="font-mono text-[11px] font-semibold text-black/70">{project.progress}%</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
                  {project.taskCount ?? 0} tasks · {project.bugCount ?? 0} bugs · {formatRelativeTime(project.updatedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
