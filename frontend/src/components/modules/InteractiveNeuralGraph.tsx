import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut, Activity } from 'lucide-react';
import {
  algorithmsApi,
  bugsApi,
  decisionsApi,
  documentsApi,
  ideasApi,
  projectsApi,
  researchApi,
  tasksApi,
} from '../../services/endpoints';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type GraphKind =
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

interface GraphDetail {
  label: string;
  value: string;
}

interface GraphNode {
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

interface GraphLink {
  id: string;
  source: string;
  target: string;
  strength: number;
}

interface Point {
  x: number;
  y: number;
}

const WIDTH = 1200;
const HEIGHT = 640;

const groups = [
  { id: 'group-projects', label: 'Projects', kind: 'group' as const, x: 360, y: 165 },
  { id: 'group-work',     label: 'Work',     kind: 'group' as const, x: 840, y: 165 },
  { id: 'group-knowledge',label: 'Knowledge',kind: 'group' as const, x: 355, y: 468 },
  { id: 'group-intel',    label: 'R&D + Ideas',kind:'group' as const,x: 840, y: 468 },
];

/* colour tokens keyed to CSS vars so they auto-adapt to theming */
const nodeColors: Record<GraphKind, string> = {
  workspace: 'var(--hot-core)',
  group:     'var(--neural-core)',
  project:   'var(--neural-core)',
  task:      'var(--hot-core)',
  bug:       'var(--status-risk)',
  research:  'var(--violet-core)',
  decision:  'var(--status-active)',
  algorithm: 'var(--neural-pulse)',
  idea:      'var(--hot-core)',
  document:  'var(--text-muted)',
};

const nodeBadgeVariant: Record<GraphKind, 'neural' | 'hot' | 'violet' | 'active' | 'risk' | 'draft'> = {
  workspace: 'hot',
  group:     'neural',
  project:   'neural',
  task:      'hot',
  bug:       'risk',
  research:  'violet',
  decision:  'active',
  algorithm: 'neural',
  idea:      'hot',
  document:  'draft',
};

function distributeAround(
  items: { id: string }[],
  center: Point,
  radius: number,
  startAngle = 0
): Point[] {
  return items.map((_, index) => {
    const angle    = startAngle + (index / Math.max(items.length, 1)) * Math.PI * 2;
    const jitter   = index % 2 === 0 ? 0 : 32;
    return {
      x: center.x + Math.cos(angle) * (radius + jitter),
      y: center.y + Math.sin(angle) * (radius + jitter),
    };
  });
}

function getEventPoint(event: React.PointerEvent<SVGSVGElement | SVGCircleElement>): Point {
  return { x: event.clientX, y: event.clientY };
}

function getCssVar(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

interface InteractiveNeuralGraphProps {
  fullscreen?: boolean;
}

export function InteractiveNeuralGraph({ fullscreen = false }: InteractiveNeuralGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions]   = useState<Record<string, Point>>({});
  const [selectedId, setSelectedId] = useState<string>('workspace');
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [dragging, setDragging]     = useState<{ id: string; offset: Point } | null>(null);
  const [panning, setPanning]       = useState<{ start: Point; origin: Point } | null>(null);
  const [pan, setPan]               = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom]             = useState(1);
  const [tick, setTick]             = useState(0);

  /* pulse animation tick */
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1400);
    return () => clearInterval(id);
  }, []);

  const projects  = useQuery({ queryKey: ['graph', 'projects'],  queryFn: projectsApi.list });
  const tasks     = useQuery({ queryKey: ['graph', 'tasks'],     queryFn: () => tasksApi.list() });
  const bugs      = useQuery({ queryKey: ['graph', 'bugs'],      queryFn: () => bugsApi.list() });
  const research  = useQuery({ queryKey: ['graph', 'research'],  queryFn: researchApi.list });
  const decisions = useQuery({ queryKey: ['graph', 'decisions'], queryFn: () => decisionsApi.list() });
  const algorithms= useQuery({ queryKey: ['graph', 'algorithms'],queryFn: algorithmsApi.list });
  const ideas     = useQuery({ queryKey: ['graph', 'ideas'],     queryFn: ideasApi.list });
  const documents = useQuery({ queryKey: ['graph', 'documents'], queryFn: () => documentsApi.list() });

  const isLoading =
    projects.isLoading  || tasks.isLoading  || bugs.isLoading ||
    research.isLoading  || decisions.isLoading || algorithms.isLoading ||
    ideas.isLoading     || documents.isLoading;

  const { nodes, links } = useMemo(() => {
    const graphNodes: GraphNode[] = [
      {
        id: 'workspace', label: 'SPIL Opti', kind: 'workspace',
        x: WIDTH / 2, y: HEIGHT / 2, radius: 19,
        meta: 'SPIL Intelligence · Phase 1',
        description: 'Central neural layer for all SPIL Opti engineering knowledge and work.',
        details: [
          { label: 'Layer',   value: 'SPIL Opti' },
          { label: 'Modules', value: 'Projects, Work, Knowledge, R&D' },
        ],
      },
      ...groups.map((group) => ({ ...group, radius: 13, meta: 'Cluster' })),
    ];

    const graphLinks: GraphLink[] = groups.map((group) => ({
      id: `workspace-${group.id}`, source: 'workspace', target: group.id, strength: 0.75,
    }));

    /* Projects */
    const projectItems = projects.data ?? [];
    const projectPos   = distributeAround(projectItems, groups[0], 108, -0.7);
    projectItems.forEach((project, index) => {
      graphNodes.push({
        id: `project-${project.id}`, label: project.name, kind: 'project',
        x: projectPos[index].x, y: projectPos[index].y,
        radius: 9 + project.progress / 28, route: `/projects/${project.id}`,
        meta: `${project.progress}% · ${project.status}`,
        description: project.description, status: project.status,
        details: [
          { label: 'Team',     value: project.team },
          { label: 'Progress', value: `${project.progress}%` },
          { label: 'Tasks',    value: String(project.taskCount ?? project._count?.tasks ?? 0) },
          { label: 'Bugs',     value: String(project.bugCount  ?? project._count?.bugs  ?? 0) },
        ],
      });
      graphLinks.push({ id: `gp-${project.id}`, source: 'group-projects', target: `project-${project.id}`, strength: 0.55 });
    });

    /* Tasks + bugs */
    const workItems = [...(tasks.data ?? []), ...(bugs.data ?? [])];
    const workPos   = distributeAround(workItems, groups[1], 128, 0.2);
    workItems.forEach((item, index) => {
      const isBug = 'severity' in item;
      const id    = `${isBug ? 'bug' : 'task'}-${item.id}`;
      graphNodes.push({
        id, label: item.title, kind: isBug ? 'bug' : 'task',
        x: workPos[index].x, y: workPos[index].y,
        radius: isBug ? 7.6 : 6.8, route: isBug ? '/bugs' : '/tasks',
        meta: `${isBug ? item.severity : item.priority} · ${item.status}`,
        description: item.description, status: item.status,
        details: [
          { label: 'Module',   value: item.module ?? item.project?.name ?? '—' },
          { label: 'Assignee', value: item.assignee ?? '—' },
          ...(isBug
            ? [{ label: 'Severity', value: item.severity }]
            : [
                { label: 'Priority', value: item.priority },
                { label: 'Due',      value: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—' },
              ]),
        ],
      });
      graphLinks.push({ id: `gw-${id}`, source: 'group-work', target: id, strength: 0.36 });
      if (item.projectId) {
        graphLinks.push({ id: `pw-${id}`, source: `project-${item.projectId}`, target: id, strength: 0.28 });
      }
    });

    /* Knowledge */
    const knowledgeItems = [...(algorithms.data ?? []), ...(decisions.data ?? []), ...(documents.data ?? [])];
    const knowledgePos   = distributeAround(knowledgeItems, groups[2], 132, 1.1);
    knowledgeItems.forEach((item, index) => {
      const isAlgorithm = 'name'   in item;
      const isDecision  = 'number' in item;
      const kind: GraphKind = isAlgorithm ? 'algorithm' : isDecision ? 'decision' : 'document';
      const id    = `${kind}-${item.id}`;
      const label = isAlgorithm ? item.name : isDecision ? `ADR-${String(item.number).padStart(3,'0')}` : item.title;
      const meta  = isAlgorithm ? item.category : isDecision ? item.status : 'Document';
      const description = isAlgorithm ? item.description : isDecision ? item.reason : item.content;
      graphNodes.push({
        id, label, kind, x: knowledgePos[index].x, y: knowledgePos[index].y,
        radius: kind === 'algorithm' ? 7.8 : 6.8,
        route: kind === 'algorithm' ? '/algorithms' : kind === 'decision' ? '/decisions' : '/documents',
        meta, description, status: isDecision ? item.status : undefined,
        details: isAlgorithm
          ? [{ label:'Category',value:item.category},{label:'Complexity',value:item.complexity??'—'},{label:'Used in',value:item.usedIn.join(', ')||'—'}]
          : isDecision
            ? [{label:'Decision',value:item.decision},{label:'Modules',value:item.affectedModules.join(', ')||'—'}]
            : [{label:'Tags',value:item.tags.join(', ')||'—'}],
      });
      graphLinks.push({ id: `gk-${id}`, source: 'group-knowledge', target: id, strength: 0.34 });
      if ('projectId' in item && item.projectId) {
        graphLinks.push({ id: `pk-${id}`, source: `project-${item.projectId}`, target: id, strength: 0.24 });
      }
    });

    /* R&D + Ideas */
    const intelItems = [...(research.data ?? []), ...(ideas.data ?? [])];
    const intelPos   = distributeAround(intelItems, groups[3], 126, 2.2);
    intelItems.forEach((item, index) => {
      const isIdea = 'rating' in item;
      const id     = `${isIdea ? 'idea' : 'research'}-${item.id}`;
      graphNodes.push({
        id, label: item.title, kind: isIdea ? 'idea' : 'research',
        x: intelPos[index].x, y: intelPos[index].y,
        radius: isIdea ? 7.4 + item.rating : 7.6,
        route: isIdea ? '/ideas' : '/research',
        meta: isIdea ? `${item.rating}/5 · ${item.priority}` : item.status,
        description: isIdea ? item.description : item.problem,
        status: item.status,
        details: isIdea
          ? [{label:'Rating',value:`${item.rating}/5`},{label:'Priority',value:item.priority},{label:'Tags',value:item.tags.join(', ')||'—'}]
          : [{label:'Tags',value:item.tags.join(', ')||'—'},{label:'Project',value:item.project?.name??'—'}],
      });
      graphLinks.push({ id: `gi-${id}`, source: 'group-intel', target: id, strength: 0.36 });
      if ('projectId' in item && item.projectId) {
        graphLinks.push({ id: `pi-${id}`, source: `project-${item.projectId}`, target: id, strength: 0.26 });
      }
    });

    return { nodes: graphNodes, links: graphLinks };
  }, [
    algorithms.data, bugs.data, decisions.data, documents.data,
    ideas.data, projects.data, research.data, tasks.data,
  ]);

  useEffect(() => {
    setPositions((cur) => {
      const next = { ...cur };
      nodes.forEach((n) => { if (!next[n.id]) next[n.id] = { x: n.x, y: n.y }; });
      return next;
    });
  }, [nodes]);

  const positionedNodes = useMemo(
    () => nodes.map((n) => ({ ...n, x: positions[n.id]?.x ?? n.x, y: positions[n.id]?.y ?? n.y })),
    [nodes, positions]
  );

  const nodeMap      = useMemo(() => new Map(positionedNodes.map((n) => [n.id, n])), [positionedNodes]);
  const selectedNode = nodeMap.get(selectedId) ?? positionedNodes[0];

  const connectedNodes = useMemo(() => {
    if (!selectedNode) return [];
    const ids = new Set<string>();
    links.forEach((l) => {
      if (l.source === selectedNode.id) ids.add(l.target);
      if (l.target === selectedNode.id) ids.add(l.source);
    });
    return [...ids].map((id) => nodeMap.get(id)).filter((n): n is GraphNode => !!n);
  }, [links, nodeMap, selectedNode]);

  const toGraphPoint = (point: Point): Point => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return point;
    return { x: (point.x - rect.left - pan.x) / zoom, y: (point.y - rect.top - pan.y) / zoom };
  };

  const handleNodePointerDown = (event: React.PointerEvent<SVGCircleElement>, node: GraphNode) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const gp = toGraphPoint(getEventPoint(event));
    setDragging({ id: node.id, offset: { x: node.x - gp.x, y: node.y - gp.y } });
    setSelectedId(node.id);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragging) {
      const p = toGraphPoint(getEventPoint(event));
      setPositions((cur) => ({ ...cur, [dragging.id]: { x: p.x + dragging.offset.x, y: p.y + dragging.offset.y } }));
      return;
    }
    if (panning) {
      const p = getEventPoint(event);
      setPan({ x: panning.origin.x + p.x - panning.start.x, y: panning.origin.y + p.y - panning.start.y });
    }
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    setZoom((z) => Math.min(1.9, Math.max(0.45, z + (event.deltaY > 0 ? -0.08 : 0.08))));
  };

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setPositions(Object.fromEntries(nodes.map((n) => [n.id, { x: n.x, y: n.y }])));
  };

  const neuralCore  = getCssVar('--neural-core', '#0891b2');
  const hotCore     = getCssVar('--hot-core', '#65a30d');
  const violetCore  = getCssVar('--violet-core', '#7c3aed');
  const riskCore    = getCssVar('--status-risk', '#e11d48');
  const activeCore  = getCssVar('--status-active', '#059669');
  const graphBgFrom = getCssVar('--graph-bg-from', 'rgba(8,145,178,0.06)');
  const graphBgMid  = getCssVar('--graph-bg-mid', 'rgba(8,145,178,0.02)');
  const graphGrid   = getCssVar('--graph-grid', 'rgba(8,145,178,0.12)');
  const labelPrimary   = getCssVar('--text-primary', '#0f172a');
  const labelSecondary = getCssVar('--text-secondary', '#475569');
  const nodeFill       = getCssVar('--graph-node-fill', '#ffffff');

  /* ─── SVG defs ─── */
  const svgDefs = (
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="50%" r="65%">
        <stop offset="0%"   stopColor={graphBgFrom} />
        <stop offset="55%"  stopColor={graphBgMid} />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>

      <pattern id="dotGrid" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.75" fill={graphGrid} />
      </pattern>

      <filter id="glowCyan" x="-80%" y="-80%" width="260%" height="260%">
        <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor={neuralCore} floodOpacity="0.35" />
      </filter>
      <filter id="glowHot" x="-80%" y="-80%" width="260%" height="260%">
        <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor={hotCore} floodOpacity="0.35" />
      </filter>
      <filter id="glowViolet" x="-80%" y="-80%" width="260%" height="260%">
        <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor={violetCore} floodOpacity="0.35" />
      </filter>
      <filter id="glowRed" x="-80%" y="-80%" width="260%" height="260%">
        <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor={riskCore} floodOpacity="0.35" />
      </filter>
      <filter id="glowGreen" x="-80%" y="-80%" width="260%" height="260%">
        <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor={activeCore} floodOpacity="0.35" />
      </filter>

      <filter id="linkGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );

  function nodeGlowFilter(kind: GraphKind) {
    switch (kind) {
      case 'workspace': case 'task': case 'idea': return 'url(#glowHot)';
      case 'research':                             return 'url(#glowViolet)';
      case 'bug':                                  return 'url(#glowRed)';
      case 'decision':                             return 'url(#glowGreen)';
      default:                                     return 'url(#glowCyan)';
    }
  }

  /* ─── Graph SVG ─── */
  const graphSvg = (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={`w-full cursor-grab select-none touch-none active:cursor-grabbing ${fullscreen ? 'h-screen' : 'h-[540px]'}`}
      style={{ background: 'transparent' }}
      onPointerDown={(e) => {
        if ((e.target as Element).tagName !== 'circle') {
          setPanning({ start: getEventPoint(e), origin: pan });
        }
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => { setDragging(null); setPanning(null); }}
      onPointerCancel={() => { setDragging(null); setPanning(null); }}
      onWheel={handleWheel}
    >
      {svgDefs}
      <rect width={WIDTH} height={HEIGHT} fill="var(--bg-void)" />
      <rect width={WIDTH} height={HEIGHT} fill="url(#dotGrid)" opacity="0.6" />
      <rect width={WIDTH} height={HEIGHT} fill="url(#bgGlow)" />

      <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
        {/* links */}
        {links.map((link) => {
          const source = nodeMap.get(link.source);
          const target = nodeMap.get(link.target);
          if (!source || !target) return null;

          const active    = selectedId === link.source || selectedId === link.target
                         || hoveredId  === link.source || hoveredId  === link.target;
          const isHotLink = source.kind === 'workspace' || target.kind === 'workspace'
                         || source.kind === 'group'     || target.kind === 'group';

          /* curved mid-point offset */
          const mx = (source.x + target.x) / 2;
          const my = (source.y + target.y) / 2;
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len * 18;
          const ny =  dx / len * 18;
          const d  = `M ${source.x} ${source.y} Q ${mx + nx} ${my + ny} ${target.x} ${target.y}`;

          const strokeColor = source.kind === 'bug' || target.kind === 'bug'
            ? `${riskCore}99`
            : source.kind === 'research' || target.kind === 'research'
              ? `${violetCore}88`
              : active
                ? getCssVar('--graph-link-active', 'rgba(8,145,178,0.72)')
                : isHotLink
                  ? getCssVar('--graph-link-hot', 'rgba(8,145,178,0.38)')
                  : getCssVar('--graph-link', 'rgba(8,145,178,0.22)');

          return (
            <path
              key={link.id}
              d={d}
              fill="none"
              stroke={strokeColor}
              strokeWidth={active ? 2 : isHotLink ? 1.4 : 1}
              strokeLinecap="round"
              filter={active ? 'url(#linkGlow)' : undefined}
            />
          );
        })}

        {/* nodes */}
        {positionedNodes.map((node) => {
          const active     = selectedId === node.id || hoveredId === node.id;
          const showLabel  = active || node.kind === 'workspace' || node.kind === 'group' || node.kind === 'project';
          const glowFilter = nodeGlowFilter(node.kind);
          const r = node.radius;
          const color = getCssVar(
            node.kind === 'workspace' || node.kind === 'task' || node.kind === 'idea' ? '--hot-core'
            : node.kind === 'research' ? '--violet-core'
            : node.kind === 'bug'      ? '--status-risk'
            : node.kind === 'decision' ? '--status-active'
            : '--neural-core',
            '#0891b2'
          );

          const isHub = node.kind === 'workspace' || node.kind === 'group';
          const fillColor = isHub ? color : nodeFill;

          return (
            <g key={node.id}>
              {/* soft halo */}
              <circle
                cx={node.x} cy={node.y}
                r={r * (active ? 2.6 : 1.8)}
                fill={color}
                opacity={active ? 0.12 : 0.06}
              />
              {/* outer ring */}
              <circle
                cx={node.x} cy={node.y}
                r={r + (isHub ? 3 : 2)}
                fill="none"
                stroke={color}
                strokeWidth={active ? 2 : isHub ? 1.5 : 1.2}
                opacity={active ? 0.85 : 0.45}
              />
              {/* core */}
              <circle
                cx={node.x} cy={node.y}
                r={r}
                fill={fillColor}
                stroke={color}
                strokeWidth={isHub ? 0 : 1.5}
                filter={active ? glowFilter : undefined}
                opacity={node.kind === 'document' && !active ? 0.7 : 1}
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                onPointerEnter={() => setHoveredId(node.id)}
                onPointerLeave={() => setHoveredId(null)}
              />
              {/* hub inner dot */}
              {isHub && (
                <circle cx={node.x} cy={node.y} r={r * 0.35} fill="#ffffff" opacity={0.9} />
              )}
              {/* pulse ring on selected */}
              {selectedId === node.id && (
                <circle
                  cx={node.x} cy={node.y}
                  r={r * (2.4 + (tick % 2) * 0.3)}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.2}
                  opacity={0.35 - (tick % 2) * 0.12}
                />
              )}
              {/* label */}
              {showLabel && (
                <text
                  x={node.x + r + 8}
                  y={node.y + 4}
                  fontSize={node.kind === 'workspace' ? 13 : node.kind === 'group' ? 11 : 10}
                  fontWeight={isHub ? '600' : '500'}
                  fill={active || node.kind === 'workspace' ? labelPrimary : labelSecondary}
                  style={{ fontFamily: 'Inter, system-ui, sans-serif', pointerEvents: 'none' }}
                >
                  {node.label.length > 26 ? `${node.label.slice(0, 26)}…` : node.label}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );

  /* ─── Detail panel ─── */
  const detailPanel = selectedNode ? (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shadow-neural"
            style={{ background: nodeColors[selectedNode.kind], boxShadow: `0 0 8px ${nodeColors[selectedNode.kind]}` }}
          />
          <Badge variant={nodeBadgeVariant[selectedNode.kind]}>{selectedNode.kind}</Badge>
        </div>
        <h3 className="text-base font-semibold leading-snug text-primary">{selectedNode.label}</h3>
        {selectedNode.meta && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest" style={{ color: nodeColors[selectedNode.kind] }}>
            {selectedNode.meta}
          </p>
        )}
      </div>

      {selectedNode.description && (
        <p className="text-xs leading-relaxed text-secondary">{selectedNode.description}</p>
      )}

      {selectedNode.details && selectedNode.details.length > 0 && (
        <dl className="space-y-2 rounded-lg border border-subtle bg-elevated/50 p-3 backdrop-blur-sm">
          {selectedNode.details.map((detail) => (
            <div key={detail.label} className="flex justify-between gap-3 text-xs">
              <dt className="font-mono uppercase tracking-wider text-muted">{detail.label}</dt>
              <dd className="text-right text-secondary">{detail.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {selectedNode.status && (
        <div>
          <p className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-muted">Status</p>
          <Badge variant="draft">{selectedNode.status}</Badge>
        </div>
      )}

      {connectedNodes.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted">
            Linked signals · {connectedNodes.length}
          </p>
          <div className="max-h-40 space-y-0.5 overflow-y-auto">
            {connectedNodes.slice(0, 10).map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedId(node.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted transition-all hover:bg-overlay hover:text-primary"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: nodeColors[node.kind], boxShadow: `0 0 4px ${nodeColors[node.kind]}` }}
                />
                <span className="truncate">{node.label}</span>
                <Badge variant={nodeBadgeVariant[node.kind]} className="ml-auto shrink-0 !py-0 text-[8px]">
                  {node.kind}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedNode.route && (
        <a href={selectedNode.route}>
          <Button className="mt-1 w-full" size="sm">
            <Maximize2 size={12} className="mr-2" />
            Open full view
          </Button>
        </a>
      )}
    </div>
  ) : (
    <p className="text-xs text-muted">Click any node to view its metadata.</p>
  );

  /* ─── Controls ─── */
  const controls = (
    <div className="flex items-center gap-1 rounded-lg border border-subtle bg-surface/70 p-1 backdrop-blur-xl">
      <Button variant="ghost" size="sm" onClick={() => setZoom((v) => Math.max(0.45, v - 0.12))} className="!px-2">
        <ZoomOut size={14} />
      </Button>
      <span className="px-1 font-mono text-[10px] text-muted">{Math.round(zoom * 100)}%</span>
      <Button variant="ghost" size="sm" onClick={() => setZoom((v) => Math.min(1.9, v + 0.12))} className="!px-2">
        <ZoomIn size={14} />
      </Button>
      <div className="mx-1 h-4 w-px bg-border-subtle" />
      <Button variant="ghost" size="sm" onClick={resetView} className="!px-2">
        <RotateCcw size={14} />
      </Button>
    </div>
  );

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 ${fullscreen ? 'h-screen' : 'h-[520px]'}`}>
        <Activity size={28} className="animate-pulse text-neural-core" />
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Initialising neural map…</p>
      </div>
    );
  }

  /* ─── Fullscreen layout ─── */
  if (fullscreen) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-base">
        {/* graph */}
        <div className="absolute inset-0">{graphSvg}</div>

        {/* top HUD */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between p-4">
          {/* brand chip */}
          <div className="pointer-events-auto glass-panel rounded-xl px-4 py-3 shadow-neural">
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-neural-core shadow-[0_0_10px_var(--neural-core)] hot-pulse-anim" />
              <div>
                <span className="text-sm font-bold tracking-tight text-primary neural-glow-text">SPIL Intelligence</span>
                <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-neural">/ Opti</span>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
                {positionedNodes.length} nodes · {links.length} links
              </span>
              <div className="flex gap-1.5">
                {['cyan','hot','violet'].map((c) => (
                  <span
                    key={c}
                    className="h-1.5 w-4 rounded-full"
                    style={{
                      background: c==='cyan'?'var(--neural-core)':c==='hot'?'var(--hot-core)':'var(--violet-core)',
                      boxShadow:  c==='cyan'?'0 0 6px var(--neural-core)':c==='hot'?'0 0 6px var(--hot-core)':'0 0 6px var(--violet-core)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* controls */}
          <div className="pointer-events-auto">{controls}</div>
        </div>

        {/* bottom hint */}
        <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest text-muted">
          drag nodes · pan · scroll to zoom · click to inspect
        </p>

        {/* right panel */}
        <aside className="absolute right-0 top-0 flex h-full w-[300px] flex-col border-l border-subtle bg-surface/90 p-5 shadow-[-8px_0_32px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          {/* panel header */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-neural-core shadow-[0_0_6px_var(--neural-core)]" />
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted">Node metadata</p>
          </div>
          <div className="flex-1 overflow-y-auto">{detailPanel}</div>

          {/* bottom stats */}
          <div className="mt-4 border-t border-subtle pt-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Projects', value: projects.data?.length ?? 0, color: 'var(--neural-core)' },
                { label: 'Tasks',    value: tasks.data?.length    ?? 0, color: 'var(--hot-core)' },
                { label: 'Bugs',     value: bugs.data?.length     ?? 0, color: 'var(--status-risk)' },
                { label: 'Ideas',    value: ideas.data?.length    ?? 0, color: 'var(--violet-core)' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-subtle bg-elevated/40 px-3 py-2">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-muted">{stat.label}</p>
                  <p className="mt-0.5 font-mono text-base font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    );
  }

  /* ─── Embedded card layout ─── */
  return (
    <Card className="overflow-hidden !p-0">
      <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-primary">SPIL Neural Map</h2>
          <p className="text-xs text-muted">Drag nodes, pan the map, zoom, click any signal to inspect.</p>
        </div>
        {controls}
      </div>
      <div className="grid min-h-[540px] grid-cols-1 lg:grid-cols-[1fr_300px]">
        <div className="relative overflow-hidden bg-base">{graphSvg}</div>
        <aside className="border-l border-subtle bg-surface p-5">{detailPanel}</aside>
      </div>
    </Card>
  );
}
