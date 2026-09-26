import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import {
  type GraphKind,
  type GraphNode,
  type Point,
  nodeColors,
  useNeuralGraphData,
} from '../../lib/companyBrainGraph';

const FPS_INTERVAL = 1000 / 60;

interface Signal {
  linkId: string;
  progress: number;
  startTime: number;
}

interface RenderNode extends GraphNode {
  x: number;
  y: number;
}

function getCssVar(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Soft palette keyed by node purpose. Bugs stay rose, workflows use the pulse color. */
function kindRgb(
  kind: GraphKind,
  neuralRgb: string,
  pulseRgb: string,
  violetRgb: string,
  riskRgb: string
): string {
  switch (kind) {
    case 'bug':
      return riskRgb;
    case 'research':
    case 'idea':
    case 'customer':
    case 'communication':
      return violetRgb;
    case 'workspace':
    case 'workflow':
    case 'support':
      return pulseRgb;
    default:
      return neuralRgb;
  }
}

interface AmbientNode {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  r: number;
}

function isHub(kind: GraphKind) {
  return kind === 'workspace' || kind === 'department' || kind === 'domain';
}

function isMajorNode(kind: GraphKind) {
  return kind === 'workspace' || kind === 'department' || kind === 'workflow';
}

export function DataNeuralGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef(0);
  const lastFrameRef = useRef(0);
  const signalTimerRef = useRef(0);
  const signalsRef = useRef<Signal[]>([]);
  const ambientRef = useRef<AmbientNode[]>([]);
  const ambientSizeRef = useRef('');

  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [selectedId, setSelectedId] = useState('workspace');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState<{ id: string; offset: Point } | null>(null);
  const [panning, setPanning] = useState<{ start: Point; origin: Point } | null>(null);

  const { graph, isLoading, counts } = useNeuralGraphData(size.w, size.h);

  const interactionRef = useRef({
    selectedId,
    hoveredId,
    positions,
    pan,
    zoom,
    dragging,
    panning,
  });

  useEffect(() => {
    interactionRef.current = { selectedId, hoveredId, positions, pan, zoom, dragging, panning };
  }, [selectedId, hoveredId, positions, pan, zoom, dragging, panning]);

  const graphRef = useRef(graph);
  graphRef.current = graph;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const prevSizeRef = useRef(size);

  useEffect(() => {
    const sizeChanged = prevSizeRef.current.w !== size.w || prevSizeRef.current.h !== size.h;
    if (sizeChanged) {
      prevSizeRef.current = size;
      setPositions(Object.fromEntries(graph.nodes.map((n) => [n.id, { x: n.x, y: n.y }])));
      return;
    }
    setPositions((cur) => {
      const next = { ...cur };
      graph.nodes.forEach((n) => {
        if (!next[n.id]) next[n.id] = { x: n.x, y: n.y };
      });
      return next;
    });
  }, [graph.nodes, size.w, size.h]);

  const positionedNodes = useMemo(
    () => graph.nodes.map((n) => ({ ...n, x: positions[n.id]?.x ?? n.x, y: positions[n.id]?.y ?? n.y })),
    [graph.nodes, positions]
  );

  const nodeMap = useMemo(
    () => new Map(positionedNodes.map((n) => [n.id, n])),
    [positionedNodes]
  );

  const selectedNode = nodeMap.get(selectedId) ?? positionedNodes[0];

  const connectedNodes = useMemo(() => {
    if (!selectedNode) return [];
    const ids = new Set<string>();
    graph.links.forEach((l) => {
      if (l.source === selectedNode.id) ids.add(l.target);
      if (l.target === selectedNode.id) ids.add(l.source);
    });
    return [...ids].map((id) => nodeMap.get(id)).filter((n): n is GraphNode => !!n);
  }, [graph.links, nodeMap, selectedNode]);

  const screenToGraph = useCallback((clientX: number, clientY: number): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    const { pan: p, zoom: z } = interactionRef.current;
    return { x: (clientX - rect.left - p.x) / z, y: (clientY - rect.top - p.y) / z };
  }, []);

  const hitTest = useCallback((point: Point): GraphNode | null => {
    const { positions: pos } = interactionRef.current;
    let found: GraphNode | null = null;
    let bestDist = Infinity;
    for (const node of graphRef.current.nodes) {
      const x = pos[node.id]?.x ?? node.x;
      const y = pos[node.id]?.y ?? node.y;
      const dist = Math.hypot(x - point.x, y - point.y);
      const hitRadius = node.radius + (isHub(node.kind) ? 14 : 10);
      if (dist <= hitRadius && dist < bestDist) {
        bestDist = dist;
        found = { ...node, x, y };
      }
    }
    return found;
  }, []);

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setPositions(Object.fromEntries(graph.nodes.map((n) => [n.id, { x: n.x, y: n.y }])));
  };

  const focusNode = (node: GraphNode) => {
    const targetZoom = Math.min(1.55, Math.max(1.05, zoom));
    setSelectedId(node.id);
    setZoom(targetZoom);
    setPan({
      x: size.w * 0.43 - node.x * targetZoom,
      y: size.h * 0.5 - node.y * targetZoom,
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isLoading) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size.w * dpr;
      canvas.height = size.h * dpr;
      canvas.style.width = `${size.w}px`;
      canvas.style.height = `${size.h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const initAmbient = (w: number, h: number) => {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const spread = Math.min(w, h) * 0.52;
      const nodes: AmbientNode[] = [];
      for (let i = 0; i < 95; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = spread * Math.sqrt(Math.random());
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        nodes.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.045,
          vy: (Math.random() - 0.5) * 0.045,
          r: 0.45 + Math.random() * 1.35,
        });
      }
      ambientRef.current = nodes;
    };

    const sizeKey = `${size.w}x${size.h}`;
    if (ambientSizeRef.current !== sizeKey) {
      initAmbient(size.w, size.h);
      ambientSizeRef.current = sizeKey;
    }

    const emitSignal = () => {
      const links = graphRef.current.links;
      if (!links.length) return;
      const link = links[Math.floor(Math.random() * links.length)];
      signalsRef.current.push({ linkId: link.id, progress: 0, startTime: performance.now() });
    };

    const drawJarvisBackground = (w: number, h: number, _neuralRgb: string, timestamp: number) => {
      // Clean clinical Samaritan background
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, w, h);

      // Precision surveillance grid
      const spacing = 48;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Precision crosshairs at every intersection
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.font = '8px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let x = spacing; x < w; x += spacing * 2) {
        for (let y = spacing; y < h; y += spacing * 2) {
          ctx.fillText('+', x, y);
        }
      }

      // Tactical scanline sweep
      const scanY = ((timestamp / 25) % (h + 100)) - 50;
      const scan = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scan.addColorStop(0, 'rgba(225, 6, 0, 0)');
      scan.addColorStop(0.5, 'rgba(225, 6, 0, 0.03)');
      scan.addColorStop(1, 'rgba(225, 6, 0, 0)');
      ctx.fillStyle = scan;
      ctx.fillRect(0, 0, w, h);
    };

    const curvePoint = (from: Point, to: Point, curveOffset: number, progress: number): Point => {
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const cpx = mx + (-dy / len) * curveOffset;
      const cpy = my + (dx / len) * curveOffset;
      const oneMinus = 1 - progress;

      return {
        x: oneMinus * oneMinus * from.x + 2 * oneMinus * progress * cpx + progress * progress * to.x,
        y: oneMinus * oneMinus * from.y + 2 * oneMinus * progress * cpy + progress * progress * to.y,
      };
    };

    const drawJarvisRings = (cx: number, cy: number, timestamp: number, rgb: string, scale = 1) => {
      const rings = [
        { r: 52 * scale, speed: 0.0004, dash: [4, 8], width: 0.8, alpha: 0.35 },
        { r: 78 * scale, speed: -0.0003, dash: [2, 10], width: 0.6, alpha: 0.25 },
        { r: 108 * scale, speed: 0.0002, dash: [6, 14], width: 0.5, alpha: 0.18 },
      ];
      rings.forEach((ring, i) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(timestamp * ring.speed + i * 1.2);
        ctx.beginPath();
        ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb}, ${ring.alpha})`;
        ctx.lineWidth = ring.width;
        ctx.setLineDash(ring.dash);
        ctx.stroke();
        ctx.restore();
      });
    };

    const drawAmbientLayer = (timestamp: number, neuralRgb: string, pulseRgb: string) => {
      const nodes = ambientRef.current;
      nodes.forEach((n, i) => {
        n.x += n.vx + (n.baseX - n.x) * 0.004;
        n.y += n.vy + (n.baseY - n.y) * 0.004;
        n.x += Math.sin(timestamp / 3000 + i) * 0.08;
        n.y += Math.cos(timestamp / 3200 + i) * 0.06;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 86) continue;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${neuralRgb}, ${0.035 * (1 - d / 86)})`;
          ctx.lineWidth = 0.35;
          ctx.stroke();
        }
      }

      nodes.forEach((n, index) => {
        if (index % 17 === 0) {
          const haze = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 12);
          haze.addColorStop(0, `rgba(${pulseRgb}, 0.08)`);
          haze.addColorStop(1, `rgba(${pulseRgb}, 0)`);
          ctx.fillStyle = haze;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 12, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pulseRgb}, 0.26)`;
        ctx.fill();
      });
    };

    const drawCurvedLink = (
      from: Point,
      to: Point,
      opacity: number,
      lineWidth: number,
      _rgb: string,
      curveOffset: number,
      active = false
    ) => {
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      ctx.save();
      if (active) {
        // Active tactical selection link
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(mx + nx * curveOffset, my + ny * curveOffset, to.x, to.y);
        ctx.strokeStyle = '#e10600';
        ctx.lineWidth = Math.max(1.5, lineWidth);
        ctx.stroke();

        // Directional midpoint pip
        const midX = (from.x + to.x) / 2 + nx * curveOffset * 0.5;
        const midY = (from.y + to.y) / 2 + ny * curveOffset * 0.5;
        ctx.fillStyle = '#e10600';
        ctx.fillRect(midX - 2, midY - 2, 4, 4);
      } else {
        // High-contrast subtle tactical link
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(mx + nx * curveOffset, my + ny * curveOffset, to.x, to.y);
        ctx.strokeStyle = `rgba(0, 0, 0, ${Math.min(0.35, opacity * 0.45)})`;
        ctx.lineWidth = Math.max(0.7, lineWidth * 0.8);
        ctx.stroke();
      }
    const drawClusterHalo = (node: RenderNode, timestamp: number, _rgb: string, focused: boolean) => {
      if (node.kind === 'workspace') return;
      const base = node.kind === 'department' ? node.radius * 3.8 : node.radius * 2.8;
      const radius = base + Math.sin(timestamp / 2000 + node.x * 0.01) * 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = focused ? 'rgba(225, 6, 0, 0.4)' : 'rgba(0, 0, 0, 0.07)';
      ctx.lineWidth = focused ? 1.2 : 0.8;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.restore();
    };

    const drawNode = (
      node: RenderNode,
      active: boolean,
      _timestamp: number,
      neuralRgb: string,
      pulseRgb: string,
      violetRgb: string,
      riskRgb: string,
      _labelPrimary: string,
      _labelSecondary: string
    ) => {
      const rgb = kindRgb(node.kind, neuralRgb, pulseRgb, violetRgb, riskRgb);
      const r = node.radius;
      const hub = isHub(node.kind);
      const showLabel =
        active ||
        hub ||
        node.kind === 'project' ||
        node.kind === 'workflow' ||
        node.kind === 'person' ||
        node.kind === 'customer';

      if (node.kind === 'workspace') {
        // Samaritan Prime Core: Concentric crosshair rings with pulsing crimson core
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 2.8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(225, 6, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 1.8, 0, Math.PI * 2);
        ctx.strokeStyle = '#e10600';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
        ctx.stroke();

        // Crosshair lines through core
        ctx.strokeStyle = 'rgba(225, 6, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(node.x - r * 3.2, node.y);
        ctx.lineTo(node.x + r * 3.2, node.y);
        ctx.moveTo(node.x, node.y - r * 3.2);
        ctx.lineTo(node.x, node.y + r * 3.2);
        ctx.stroke();

        // Inner solid core
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = '#e10600';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      } else {
        // High-contrast tactical node
        const isTargetActive = active || interactionRef.current.selectedId === node.id;
        ctx.save();

        if (isTargetActive) {
          // Bounding box around selected target
          const boxSize = r * 2.6;
          ctx.strokeStyle = '#e10600';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(node.x - boxSize / 2, node.y - boxSize / 2, boxSize, boxSize);

          // Corner ticks
          ctx.fillStyle = '#e10600';
          ctx.font = '9px "Share Tech Mono", monospace';
          ctx.fillText('+', node.x - boxSize / 2, node.y - boxSize / 2);
          ctx.fillText('+', node.x + boxSize / 2, node.y - boxSize / 2);
        }

        // Crisp solid node circle with dark boundary
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = isTargetActive ? '#e10600' : 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = isTargetActive ? 2 : 1.2;
        ctx.stroke();

        // Node center pip
        ctx.beginPath();
        ctx.arc(node.x, node.y, hub ? r * 0.55 : r * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = isTargetActive ? '#e10600' : `rgba(${rgb}, 0.95)`;
        ctx.fill();

        ctx.restore();
      }

      if (showLabel) {
        const label = node.label.length > 28 ? `${node.label.slice(0, 28)}...` : node.label;
        const fontSize = node.kind === 'workspace' ? 11 : node.kind === 'department' ? 10 : 9;
        ctx.font = `600 ${fontSize}px "Share Tech Mono", monospace`;
        const text = label.toUpperCase();
        const textWidth = ctx.measureText(text).width;
        const labelX = node.x + r + 8;
        const labelY = node.y - fontSize / 2 - 2;
        const padX = 5;
        const labelH = fontSize + 6;

        // Brutalist 0-radius label box
        ctx.fillStyle = active ? '#000000' : '#ffffff';
        ctx.fillRect(labelX - padX, labelY, textWidth + padX * 2, labelH);
        ctx.strokeStyle = active ? '#e10600' : 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 1;
        ctx.strokeRect(labelX - padX, labelY, textWidth + padX * 2, labelH);

        ctx.fillStyle = active ? '#ffffff' : '#000000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, labelX, labelY + labelH / 2);
      }
    };

    const drawSignal = (
      from: Point,
      to: Point,
      progress: number,
      curveOffset: number,
      _neuralRgb: string,
      _pulseRgb: string
    ) => {
      const { x, y } = curvePoint(from, to, curveOffset, progress);
      const tail = curvePoint(from, to, curveOffset, Math.max(0, progress - 0.04));

      ctx.save();
      // Packet vector line
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#e10600';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sharp packet diamond/crosshair pip
      ctx.fillStyle = '#e10600';
      ctx.fillRect(x - 2, y - 2, 4, 4);

      ctx.restore();
    };

    const draw = (timestamp: number) => {
      animationRef.current = requestAnimationFrame(draw);
      if (timestamp - lastFrameRef.current < FPS_INTERVAL) return;
      lastFrameRef.current = timestamp;

      const { selectedId: sel, hoveredId: hov, positions: pos, pan: p, zoom: z, dragging: drag } =
        interactionRef.current;
      const { nodes, links } = graphRef.current;

      const neuralRgb = getCssVar('--neural-rgb', '109, 143, 232');
      const pulseRgb = getCssVar('--neural-pulse-rgb', '138, 168, 240');
      const violetRgb = getCssVar('--neural-violet-rgb', '167, 139, 250');
      const riskRgb = getCssVar('--risk-rgb', '233, 138, 160');
      const labelPrimary = getCssVar('--text-primary', '#0f172a');
      const labelSecondary = getCssVar('--text-secondary', '#475569');

      ctx.clearRect(0, 0, size.w, size.h);
      drawJarvisBackground(size.w, size.h, neuralRgb, timestamp);
      drawAmbientLayer(timestamp, neuralRgb, pulseRgb);

      signalTimerRef.current += FPS_INTERVAL;
      if (signalTimerRef.current > 1100 + Math.random() * 900) {
        signalTimerRef.current = 0;
        emitSignal();
      }
      signalsRef.current = signalsRef.current.filter((s) => {
        s.progress = (timestamp - s.startTime) / 900;
        return s.progress < 1;
      });

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(z, z);

      const positioned = nodes.map((n) => ({
        ...n,
        x:
          (pos[n.id]?.x ?? n.x) +
          (drag?.id === n.id ? 0 : Math.sin(timestamp / 2400 + n.x * 0.013) * (isHub(n.kind) ? 0.9 : 1.6)),
        y:
          (pos[n.id]?.y ?? n.y) +
          (drag?.id === n.id ? 0 : Math.cos(timestamp / 2600 + n.y * 0.011) * (isHub(n.kind) ? 0.8 : 1.35)),
      }));
      const map = new Map(positioned.map((n) => [n.id, n]));
      const focusId = hov ?? sel;
      const focusedIds = new Set<string>([focusId]);

      links.forEach((link) => {
        if (link.source === focusId) focusedIds.add(link.target);
        if (link.target === focusId) focusedIds.add(link.source);
      });

      positioned
        .filter((node) => isMajorNode(node.kind) || (node.kind === 'domain' && focusedIds.has(node.id)))
        .forEach((node) => {
          const rgb = kindRgb(node.kind, neuralRgb, pulseRgb, violetRgb, riskRgb);
          drawClusterHalo(node, timestamp, rgb, focusedIds.has(node.id));
        });

      links.forEach((link, index) => {
        const source = map.get(link.source);
        const target = map.get(link.target);
        if (!source || !target) return;

        const active =
          sel === link.source || sel === link.target || hov === link.source || hov === link.target;
        const inFocus = focusedIds.has(link.source) && focusedIds.has(link.target);
        const isHot =
          source.kind === 'workspace' ||
          target.kind === 'workspace' ||
          source.kind === 'department' ||
          target.kind === 'department' ||
          source.kind === 'domain' ||
          target.kind === 'domain';

        const linkKind =
          source.kind === 'bug' || target.kind === 'bug'
            ? 'bug'
            : source.kind === 'research' || target.kind === 'research'
              ? 'research'
              : source.kind;
        const rgb = kindRgb(linkKind, neuralRgb, pulseRgb, violetRgb, riskRgb);

        const opacity = active ? 0.82 : inFocus ? 0.46 : isHot ? 0.28 : 0.1;
        const curveOffset = Math.sin(index * 1.7) * 10;
        drawCurvedLink(
          source,
          target,
          opacity,
          active ? 1.35 : inFocus ? 0.95 : isHot ? 0.7 : 0.42,
          rgb,
          curveOffset,
          active
        );
      });

      signalsRef.current.forEach((signal) => {
        const link = links.find((l) => l.id === signal.linkId);
        if (!link) return;
        const source = map.get(link.source);
        const target = map.get(link.target);
        if (!source || !target) return;
        const linkIndex = links.findIndex((l) => l.id === signal.linkId);
        drawSignal(source, target, signal.progress, Math.sin(linkIndex * 1.7) * 10, neuralRgb, pulseRgb);
      });

      [...positioned]
        .sort((a, b) => Number(focusedIds.has(a.id)) - Number(focusedIds.has(b.id)))
        .forEach((node) => {
        const active = sel === node.id || hov === node.id || focusedIds.has(node.id);
        drawNode(node, active, timestamp, neuralRgb, pulseRgb, violetRgb, riskRgb, labelPrimary, labelSecondary);
      });

      ctx.restore();
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isLoading, size]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const gp = screenToGraph(e.clientX, e.clientY);
    const hit = hitTest(gp);
    if (hit) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging({ id: hit.id, offset: { x: hit.x - gp.x, y: hit.y - gp.y } });
      setSelectedId(hit.id);
    } else {
      setPanning({ start: { x: e.clientX, y: e.clientY }, origin: pan });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const gp = screenToGraph(e.clientX, e.clientY);
    if (dragging) {
      setPositions((cur) => ({
        ...cur,
        [dragging.id]: { x: gp.x + dragging.offset.x, y: gp.y + dragging.offset.y },
      }));
      return;
    }
    if (panning) {
      setPan({
        x: panning.origin.x + e.clientX - panning.start.x,
        y: panning.origin.y + e.clientY - panning.start.y,
      });
      return;
    }
    const hit = hitTest(gp);
    setHoveredId(hit?.id ?? null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const gp = screenToGraph(e.clientX, e.clientY);
    const hit = hitTest(gp);
    if (hit) focusNode(hit);
  };

  const handlePointerUp = () => {
    setDragging(null);
    setPanning(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom((z) => Math.min(2, Math.max(0.4, z + (e.deltaY > 0 ? -0.07 : 0.07))));
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
        <Activity size={28} className="animate-pulse text-neural-core" />
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Loading neural map…</p>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 z-10">
        <canvas
          ref={canvasRef}
          className={`h-full w-full touch-none ${
            dragging || panning ? 'cursor-grabbing' : hoveredId ? 'cursor-pointer' : 'cursor-grab'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
        />
      </div>

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between p-3">
        {/* Top-Left Topology Header */}
        <div className="pointer-events-auto border border-black/90 bg-white/95 px-3.5 py-2 font-mono shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-[#e10600] lamp" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-black">
              TOPOLOGY // COMPANY BRAIN
            </span>
            <span className="text-[10px] text-black/40">/ SPIL-OPTI</span>
          </div>
          <p className="mt-0.5 text-[9px] uppercase tracking-widest text-black/60">
            {positionedNodes.length} NODES · {graph.links.length} LINKS · SYSTEM: NOMINAL
          </p>
        </div>

        {/* Top-Right Tactical Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-1 border border-black/90 bg-white/95 p-1 font-mono shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <button
            type="button"
            onClick={() => setZoom((v) => Math.max(0.4, v - 0.1))}
            className="px-2 py-0.5 text-xs font-bold hover:bg-black hover:text-white transition-colors"
          >
            -
          </button>
          <span className="px-1 text-[10px] font-bold text-black/80">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((v) => Math.min(2, v + 0.1))}
            className="px-2 py-0.5 text-xs font-bold hover:bg-black hover:text-white transition-colors"
          >
            +
          </button>
          <div className="mx-1 h-3.5 w-px bg-black/20" />
          <button
            type="button"
            onClick={resetView}
            className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider hover:bg-[#e10600] hover:text-white transition-colors"
          >
            RESET
          </button>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 font-mono text-[9px] uppercase tracking-widest text-black/40">
        [ DRAG NODES · DBL-CLICK TO FOCUS · SCROLL TO ZOOM · CLICK TO INSPECT ]
      </p>

      {/* Bottom-Left Tactical Legend */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 w-[240px] border border-black/90 bg-white/95 p-3 font-mono shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="mb-2 flex items-center justify-between border-b border-black/15 pb-1 text-[9px] uppercase tracking-widest text-black font-bold">
          <span>CLASSIFICATION KEY</span>
          <span className="h-1.5 w-1.5 bg-[#e10600]" />
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[9px] font-semibold text-black/80">
          <div className="flex items-center gap-2 border border-black/10 bg-black/[0.02] px-2 py-1">
            <span className="h-2 w-2 bg-[#e10600]" />
            <span>DEPARTMENTS</span>
          </div>
          <div className="flex items-center gap-2 border border-black/10 bg-black/[0.02] px-2 py-1">
            <span className="h-2 w-2 bg-[#1c7a43]" />
            <span>PERSONNEL</span>
          </div>
          <div className="flex items-center gap-2 border border-black/10 bg-black/[0.02] px-2 py-1">
            <span className="h-2 w-2 bg-[#8a6a00]" />
            <span>WORKFLOWS</span>
          </div>
          <div className="flex items-center gap-2 border border-black/10 bg-black/[0.02] px-2 py-1">
            <span className="h-2 w-2 bg-[#111111]" />
            <span>CUSTOMERS</span>
          </div>
        </div>
      </div>

      {/* Top Center Tactical Workflow Banner */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 hidden -translate-x-1/2 border border-black/85 bg-white/95 px-4 py-1.5 font-mono shadow-sm lg:block">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-[#e10600]" />
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-black/80">
            ACTIVE WORKFLOW LOOP: BUG TRIAGE ➔ DEV TASK ➔ OPTI INSIGHT ➔ QA SIGNOFF
          </span>
        </div>
      </div>

      {/* Right-Hand Tactical Target Dossier */}
      <aside className="absolute right-0 top-0 z-20 flex h-full w-[310px] flex-col border-l border-black/90 bg-white/95 p-4 font-mono shadow-[-8px_0_24px_rgba(0,0,0,0.06)]">
        <div className="mb-3 border-b border-black/90 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-[#e10600] lamp" />
              <span className="text-[9px] uppercase tracking-widest text-black/60 font-bold">
                TARGET DOSSIER
              </span>
            </div>
            <span className="text-[9px] text-[#1c7a43] font-bold">NODE: ONLINE</span>
          </div>
          <h2 className="mt-2 font-display text-lg font-bold uppercase tracking-wider text-black">
            {selectedNode?.label ?? 'SPIL Intelligence'}
          </h2>
          <p className="mt-0.5 text-[9px] uppercase tracking-widest text-black/50">
            CLASS: {selectedNode?.kind ?? 'ROOT CORE'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className="h-2 w-2"
                    style={{ background: nodeColors[selectedNode.kind] }}
                  />
                  <span className="border border-black/30 px-1.5 py-0.5 text-[9px] uppercase font-bold text-black">
                    {selectedNode.kind}
                  </span>
                </div>
                {selectedNode.meta && (
                  <p className="font-mono text-[9px] uppercase tracking-widest text-black/60">
                    METRIC: {selectedNode.meta}
                  </p>
                )}
              </div>

              {selectedNode.description && (
                <p className="border border-black/10 bg-black/[0.02] p-2 text-[11px] leading-relaxed text-black/80">
                  {selectedNode.description}
                </p>
              )}

              {selectedNode.details && selectedNode.details.length > 0 && (
                <dl className="space-y-1.5 border border-black/20 bg-white p-2 text-[10px]">
                  {selectedNode.details.map((detail) => (
                    <div key={detail.label} className="flex justify-between gap-2 border-b border-black/[0.06] pb-1">
                      <dt className="uppercase tracking-wider text-black/50">{detail.label}</dt>
                      <dd className="text-right font-bold text-black">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {connectedNodes.length > 0 && (
                <div>
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-black/60 font-bold">
                    CONNECTED TARGETS // {connectedNodes.length}
                  </p>
                  <div className="max-h-36 space-y-1 overflow-y-auto">
                    {connectedNodes.slice(0, 8).map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedId(node.id)}
                        className="flex w-full items-center justify-between border border-black/15 bg-white px-2 py-1 text-left text-[10px] text-black hover:border-black hover:bg-black hover:text-white transition-all"
                      >
                        <span className="truncate font-semibold">{node.label}</span>
                        <span className="text-[8px] uppercase tracking-wider opacity-60">
                          {node.kind}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.route && (
                <Link to={selectedNode.route}>
                  <button
                    type="button"
                    className="mt-2 w-full border border-black bg-black px-3 py-1.5 text-center font-mono text-[9px] font-bold uppercase tracking-widest text-white hover:bg-[#e10600] hover:border-[#e10600] transition-colors"
                  >
                    ACCESS ENTITY ➔
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-black/40">SELECT NODE TO INITIALIZE DOSSIER.</p>
          )}
        </div>

        {/* Bottom Counts Strip */}
        <div className="mt-3 border-t border-black/90 pt-3">
          <div className="grid grid-cols-2 gap-1.5 text-[9px]">
            {[
              { label: 'DEPTS', value: counts.departments, color: '#e10600' },
              { label: 'PEOPLE', value: counts.people, color: '#1c7a43' },
              { label: 'LOOPS', value: counts.workflows, color: '#8a6a00' },
              { label: 'LINKS', value: counts.links, color: '#111111' },
            ].map((stat) => (
              <div key={stat.label} className="border border-black/20 bg-white p-1.5">
                <p className="uppercase tracking-widest text-black/50">{stat.label}</p>
                <p className="mt-0.5 text-sm font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
