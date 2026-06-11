import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  algorithmsApi,
  bugsApi,
  decisionsApi,
  documentsApi,
  ideasApi,
  projectsApi,
  researchApi,
  tasksApi,
} from '../services/endpoints';

export type GraphKind =
  | 'workspace'
  | 'group'
  | 'project'
  | 'task'
  | 'bug'
  | 'research'
  | 'decision'
  | 'algorithm'
  | 'idea'
  | 'document';

export interface GraphDetail {
  label: string;
  value: string;
}

export interface GraphNode {
  id: string;
  label: string;
  kind: GraphKind;
  x: number;
  y: number;
  radius: number;
  route?: string;
  meta?: string;
  description?: string | null;
  status?: string;
  details?: GraphDetail[];
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  strength: number;
}

export interface Point {
  x: number;
  y: number;
}

export const nodeColors: Record<GraphKind, string> = {
  workspace: 'var(--neural-pulse)',
  group: 'var(--neural-core)',
  project: 'var(--neural-core)',
  task: 'var(--neural-pulse)',
  bug: 'var(--status-risk)',
  research: 'var(--violet-core)',
  decision: 'var(--neural-core)',
  algorithm: 'var(--neural-pulse)',
  idea: 'var(--neural-core)',
  document: 'var(--text-muted)',
};

export const nodeBadgeVariant: Record<
  GraphKind,
  'neural' | 'hot' | 'violet' | 'active' | 'risk' | 'draft'
> = {
  workspace: 'neural',
  group: 'neural',
  project: 'neural',
  task: 'neural',
  bug: 'risk',
  research: 'violet',
  decision: 'neural',
  algorithm: 'neural',
  idea: 'neural',
  document: 'draft',
};

function distributeAround(
  items: { id: string }[],
  center: Point,
  radius: number,
  startAngle = 0
): Point[] {
  return items.map((_, index) => {
    const angle = startAngle + (index / Math.max(items.length, 1)) * Math.PI * 2;
    const jitter = index % 2 === 0 ? 0 : radius * 0.22;
    return {
      x: center.x + Math.cos(angle) * (radius + jitter),
      y: center.y + Math.sin(angle) * (radius + jitter),
    };
  });
}

interface GraphDataInput {
  projects: Awaited<ReturnType<typeof projectsApi.list>> | undefined;
  tasks: Awaited<ReturnType<typeof tasksApi.list>> | undefined;
  bugs: Awaited<ReturnType<typeof bugsApi.list>> | undefined;
  research: Awaited<ReturnType<typeof researchApi.list>> | undefined;
  decisions: Awaited<ReturnType<typeof decisionsApi.list>> | undefined;
  algorithms: Awaited<ReturnType<typeof algorithmsApi.list>> | undefined;
  ideas: Awaited<ReturnType<typeof ideasApi.list>> | undefined;
  documents: Awaited<ReturnType<typeof documentsApi.list>> | undefined;
}

export function buildNeuralGraph(width: number, height: number, data: GraphDataInput) {
  const cx = width * 0.5;
  const cy = height * 0.5;
  const spread = Math.min(width, height) * 0.28;

  const groups = [
    { id: 'group-projects', label: 'Projects', kind: 'group' as const, x: cx - spread * 0.95, y: cy - spread * 0.6 },
    { id: 'group-work', label: 'Work', kind: 'group' as const, x: cx + spread * 0.95, y: cy - spread * 0.6 },
    { id: 'group-knowledge', label: 'Knowledge', kind: 'group' as const, x: cx - spread * 0.95, y: cy + spread * 0.65 },
    { id: 'group-intel', label: 'R&D + Ideas', kind: 'group' as const, x: cx + spread * 0.95, y: cy + spread * 0.65 },
  ];

  const graphNodes: GraphNode[] = [
    {
      id: 'workspace',
      label: 'SPIL Opti',
      kind: 'workspace',
      x: cx,
      y: cy,
      radius: Math.min(width, height) * 0.028,
      meta: 'SPIL Intelligence · Phase 1',
      description: 'Central neural layer for all SPIL Opti engineering knowledge and work.',
      details: [
        { label: 'Layer', value: 'SPIL Opti' },
        { label: 'Modules', value: 'Projects, Work, Knowledge, R&D' },
      ],
    },
    ...groups.map((group) => ({ ...group, radius: Math.min(width, height) * 0.018, meta: 'Cluster' })),
  ];

  const graphLinks: GraphLink[] = groups.map((group) => ({
    id: `workspace-${group.id}`,
    source: 'workspace',
    target: group.id,
    strength: 0.75,
  }));

  const orbit = spread * 0.72;

  const projectItems = data.projects ?? [];
  const projectPos = distributeAround(projectItems, groups[0], orbit, -0.7);
  projectItems.forEach((project, index) => {
    graphNodes.push({
      id: `project-${project.id}`,
      label: project.name,
      kind: 'project',
      x: projectPos[index].x,
      y: projectPos[index].y,
      radius: Math.min(width, height) * 0.012 + project.progress / 120,
      route: `/projects/${project.id}`,
      meta: `${project.progress}% · ${project.status}`,
      description: project.description,
      status: project.status,
      details: [
        { label: 'Team', value: project.team },
        { label: 'Progress', value: `${project.progress}%` },
        { label: 'Tasks', value: String(project.taskCount ?? project._count?.tasks ?? 0) },
        { label: 'Bugs', value: String(project.bugCount ?? project._count?.bugs ?? 0) },
      ],
    });
    graphLinks.push({
      id: `gp-${project.id}`,
      source: 'group-projects',
      target: `project-${project.id}`,
      strength: 0.55,
    });
  });

  const workItems = [...(data.tasks ?? []), ...(data.bugs ?? [])];
  const workPos = distributeAround(workItems, groups[1], orbit * 1.05, 0.2);
  workItems.forEach((item, index) => {
    const isBug = 'severity' in item;
    const id = `${isBug ? 'bug' : 'task'}-${item.id}`;
    graphNodes.push({
      id,
      label: item.title,
      kind: isBug ? 'bug' : 'task',
      x: workPos[index].x,
      y: workPos[index].y,
      radius: Math.min(width, height) * (isBug ? 0.011 : 0.01),
      route: isBug ? '/bugs' : '/tasks',
      meta: `${isBug ? item.severity : item.priority} · ${item.status}`,
      description: item.description,
      status: item.status,
      details: [
        { label: 'Module', value: item.module ?? item.project?.name ?? '—' },
        { label: 'Assignee', value: item.assignee ?? '—' },
        ...(isBug
          ? [{ label: 'Severity', value: item.severity }]
          : [
              { label: 'Priority', value: item.priority },
              {
                label: 'Due',
                value: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—',
              },
            ]),
      ],
    });
    graphLinks.push({ id: `gw-${id}`, source: 'group-work', target: id, strength: 0.36 });
    if (item.projectId) {
      graphLinks.push({
        id: `pw-${id}`,
        source: `project-${item.projectId}`,
        target: id,
        strength: 0.28,
      });
    }
  });

  const knowledgeItems = [
    ...(data.algorithms ?? []),
    ...(data.decisions ?? []),
    ...(data.documents ?? []),
  ];
  const knowledgePos = distributeAround(knowledgeItems, groups[2], orbit * 1.08, 1.1);
  knowledgeItems.forEach((item, index) => {
    const isAlgorithm = 'name' in item;
    const isDecision = 'number' in item;
    const kind: GraphKind = isAlgorithm ? 'algorithm' : isDecision ? 'decision' : 'document';
    const id = `${kind}-${item.id}`;
    const label = isAlgorithm
      ? item.name
      : isDecision
        ? `ADR-${String(item.number).padStart(3, '0')}`
        : item.title;
    const meta = isAlgorithm ? item.category : isDecision ? item.status : 'Document';
    const description = isAlgorithm ? item.description : isDecision ? item.reason : item.content;
    graphNodes.push({
      id,
      label,
      kind,
      x: knowledgePos[index].x,
      y: knowledgePos[index].y,
      radius: Math.min(width, height) * (kind === 'algorithm' ? 0.011 : 0.01),
      route: kind === 'algorithm' ? '/algorithms' : kind === 'decision' ? '/decisions' : '/documents',
      meta,
      description,
      status: isDecision ? item.status : undefined,
      details: isAlgorithm
        ? [
            { label: 'Category', value: item.category },
            { label: 'Complexity', value: item.complexity ?? '—' },
            { label: 'Used in', value: item.usedIn.join(', ') || '—' },
          ]
        : isDecision
          ? [
              { label: 'Decision', value: item.decision },
              { label: 'Modules', value: item.affectedModules.join(', ') || '—' },
            ]
          : [{ label: 'Tags', value: item.tags.join(', ') || '—' }],
    });
    graphLinks.push({ id: `gk-${id}`, source: 'group-knowledge', target: id, strength: 0.34 });
    if ('projectId' in item && item.projectId) {
      graphLinks.push({
        id: `pk-${id}`,
        source: `project-${item.projectId}`,
        target: id,
        strength: 0.24,
      });
    }
  });

  const intelItems = [...(data.research ?? []), ...(data.ideas ?? [])];
  const intelPos = distributeAround(intelItems, groups[3], orbit * 1.02, 2.2);
  intelItems.forEach((item, index) => {
    const isIdea = 'rating' in item;
    const id = `${isIdea ? 'idea' : 'research'}-${item.id}`;
    graphNodes.push({
      id,
      label: item.title,
      kind: isIdea ? 'idea' : 'research',
      x: intelPos[index].x,
      y: intelPos[index].y,
      radius: Math.min(width, height) * (isIdea ? 0.01 + item.rating / 400 : 0.011),
      route: isIdea ? '/ideas' : '/research',
      meta: isIdea ? `${item.rating}/5 · ${item.priority}` : item.status,
      description: isIdea ? item.description : item.problem,
      status: item.status,
      details: isIdea
        ? [
            { label: 'Rating', value: `${item.rating}/5` },
            { label: 'Priority', value: item.priority },
            { label: 'Tags', value: item.tags.join(', ') || '—' },
          ]
        : [
            { label: 'Tags', value: item.tags.join(', ') || '—' },
            { label: 'Project', value: item.project?.name ?? '—' },
          ],
    });
    graphLinks.push({ id: `gi-${id}`, source: 'group-intel', target: id, strength: 0.36 });
    if ('projectId' in item && item.projectId) {
      graphLinks.push({
        id: `pi-${id}`,
        source: `project-${item.projectId}`,
        target: id,
        strength: 0.26,
      });
    }
  });

  return { nodes: graphNodes, links: graphLinks };
}

export function useNeuralGraphData(width: number, height: number) {
  const projects = useQuery({ queryKey: ['graph', 'projects'], queryFn: projectsApi.list });
  const tasks = useQuery({ queryKey: ['graph', 'tasks'], queryFn: () => tasksApi.list() });
  const bugs = useQuery({ queryKey: ['graph', 'bugs'], queryFn: () => bugsApi.list() });
  const research = useQuery({ queryKey: ['graph', 'research'], queryFn: researchApi.list });
  const decisions = useQuery({ queryKey: ['graph', 'decisions'], queryFn: () => decisionsApi.list() });
  const algorithms = useQuery({ queryKey: ['graph', 'algorithms'], queryFn: algorithmsApi.list });
  const ideas = useQuery({ queryKey: ['graph', 'ideas'], queryFn: ideasApi.list });
  const documents = useQuery({ queryKey: ['graph', 'documents'], queryFn: () => documentsApi.list() });

  const isLoading =
    projects.isLoading ||
    tasks.isLoading ||
    bugs.isLoading ||
    research.isLoading ||
    decisions.isLoading ||
    algorithms.isLoading ||
    ideas.isLoading ||
    documents.isLoading;

  const graph = useMemo(
    () =>
      buildNeuralGraph(width, height, {
        projects: projects.data,
        tasks: tasks.data,
        bugs: bugs.data,
        research: research.data,
        decisions: decisions.data,
        algorithms: algorithms.data,
        ideas: ideas.data,
        documents: documents.data,
      }),
    [
      width,
      height,
      projects.data,
      tasks.data,
      bugs.data,
      research.data,
      decisions.data,
      algorithms.data,
      ideas.data,
      documents.data,
    ]
  );

  return {
    graph,
    isLoading,
    counts: {
      projects: projects.data?.length ?? 0,
      tasks: tasks.data?.length ?? 0,
      bugs: bugs.data?.length ?? 0,
      ideas: ideas.data?.length ?? 0,
    },
  };
}
