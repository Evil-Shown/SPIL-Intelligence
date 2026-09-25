import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Register, RegisterRow, Section } from '../components/hud/Section';
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
    <Section
      kicker="Workspace"
      title="KNOWLEDGE"
      action={
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-black/60">
          {documents?.length ?? 0} docs · {algorithms?.length ?? 0} algorithms · {decisions?.length ?? 0} decisions
        </p>
      }
    >
      {docsLoading ? (
        <CardSkeleton />
      ) : !documents?.length ? (
        <EmptyState title="No documents" description="Project documentation will appear here." />
      ) : (
        <Register>
          {documents.map((doc) => (
            <Link key={doc.id} to="/documents" className="block">
              <RegisterRow title={doc.title} meta={formatRelativeTime(doc.updatedAt)} />
            </Link>
          ))}
          {projects?.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="block">
              <RegisterRow title={project.name} meta={`${project.progress}%`} detail="Project" />
            </Link>
          ))}
        </Register>
      )}
    </Section>
  );
}
