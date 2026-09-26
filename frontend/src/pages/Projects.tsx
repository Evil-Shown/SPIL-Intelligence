import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Section } from '../components/hud/Section';
import { projectsApi } from '../services/endpoints';
import { formatRelativeTime } from '../lib/utils';

export function Projects() {
  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  return (
    <Section
      kicker="Directive Core"
      title="PROJECTS REGISTRY"
      action={
        <button
          type="button"
          className="border border-black bg-black px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#e10600] hover:border-[#e10600] transition-colors"
        >
          + NEW DIRECTIVE
        </button>
      }
    >
      {error ? (
        <EmptyState title="Failed to load projects" description={error.message} actionLabel="Retry" onAction={() => refetch()} />
      ) : isLoading ? (
        <CardSkeleton />
      ) : !projects?.length ? (
        <EmptyState title="No projects yet" description="Create your first project to start tracking engineering work." />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {projects.map((project, idx) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group relative block border border-black/80 bg-white p-4 shadow-none transition-all hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {/* Corner crosshair ticks */}
              <span className="absolute -top-[3px] -left-[3px] font-mono text-[8px] leading-none text-black/40 select-none">
                +
              </span>
              <span className="absolute -top-[3px] -right-[3px] font-mono text-[8px] leading-none text-black/40 select-none">
                +
              </span>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-bold text-[#e10600]">
                    [ 0{idx + 1} ]
                  </span>
                  <h2 className="font-mono text-base font-bold uppercase tracking-wide text-black group-hover:text-[#e10600] transition-colors">
                    {project.name}
                  </h2>
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] border border-black/40 px-2 py-0.5 text-black">
                  {project.status}
                </span>
              </div>

              {project.description && (
                <p className="mt-2 text-xs leading-relaxed text-black/70 font-sans">
                  {project.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-black/10 pt-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-black/40">COMPLETION:</span>
                  <div className="h-2 w-32 border border-black/30 bg-black/5">
                    <div className="h-full bg-black transition-all" style={{ width: `${project.progress}%` }} />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-black">{project.progress}%</span>
                </div>
                <div className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-black/50">
                  {project.taskCount ?? 0} TASKS · {project.bugCount ?? 0} BUGS · {formatRelativeTime(project.updatedAt)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
}
