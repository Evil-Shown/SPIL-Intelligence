import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { APP_NAME, WORKSPACE_NAME } from '../../lib/constants';
import {
  type GraphKind,
  type GraphNode,
  type Point,
  nodeBadgeVariant,
  nodeColors,
  useNeuralGraphData,
} from '../../lib/neuralGraphData';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const FPS_INTERVAL = 1000 / 30;

interface Signal {
  linkId: string;
  progress: number;
  startTime: number;
}

function getCssVar(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Cyan-first palette — no yellow. Bugs stay red, R&D stays violet. */
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
      return violetRgb;
    case 'workspace':
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
  return kind === 'workspace' || kind === 'group';
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
      const hitRadius = node.radius + 8;
      if (dist <= hitRadius && dist < bestDist) {
        bestDist = dist;
        found = node;
      }
    }
    return found;
  }, []);

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setPositions(Object.fromEntries(graph.nodes.map((n) => [n.id, { x: n.x, y: n.y }])));
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
      const spread = Math.min(w, h) * 0.46;
      const nodes: AmbientNode[] = [];
      for (let i = 0; i < 55; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = spread * Math.sqrt(Math.random());
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        nodes.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.06,
          vy: (Math.random() - 0.5) * 0.06,
          r: 0.6 + Math.random() * 1.1,
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

    const drawJarvisBackground = (w: number, h: number, neuralRgb: string, timestamp: number) => {
      const bg = getCssVar('--bg-base', '#f1f5f9');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const gridColor = getCssVar('--graph-grid', 'rgba(8,145,178,0.12)');
      const spacing = 32;
      ctx.fillStyle = gridColor;
      for (let x = 0; x < w; x += spacing) {
        for (let y = 0; y < h; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const cx = w * 0.5;
      const cy = h * 0.5;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55);
      glow.addColorStop(0, `rgba(${neuralRgb}, 0.1)`);
      glow.addColorStop(0.4, `rgba(${neuralRgb}, 0.03)`);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const scanY = ((timestamp / 40) % (h + 120)) - 60;
      const scan = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scan.addColorStop(0, 'rgba(255,255,255,0)');
      scan.addColorStop(0.5, `rgba(${neuralRgb}, 0.04)`);
      scan.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = scan;
      ctx.fillRect(0, 0, w, h);
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
          if (d > 90) continue;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${neuralRgb}, ${0.04 * (1 - d / 90)})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }

      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pulseRgb}, 0.35)`;
        ctx.fill();
      });
    };

    const drawCurvedLink = (
      from: Point,
      to: Point,
      opacity: number,
      lineWidth: number,
      rgb: string,
      curveOffset: number
    ) => {
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, `rgba(${rgb}, ${opacity * 0.3})`);
      gradient.addColorStop(0.5, `rgba(${rgb}, ${opacity})`);
      gradient.addColorStop(1, `rgba(${rgb}, ${opacity * 0.25})`);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(mx + nx * curveOffset, my + ny * curveOffset, to.x, to.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const drawJarvisCore = (
      x: number,
      y: number,
      r: number,
      timestamp: number,
      pulseRgb: string,
      neuralRgb: string
    ) => {
      drawJarvisRings(x, y, timestamp, pulseRgb, r / 19);

      const coreGlow = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
      coreGlow.addColorStop(0, `rgba(${pulseRgb}, 0.35)`);
      coreGlow.addColorStop(1, `rgba(${pulseRgb}, 0)`);
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(x, y, r * 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${pulseRgb}, 0.7)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pulseRgb}, 0.15)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${pulseRgb}, 0.95)`;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${neuralRgb}, 1)`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    };

    const drawNode = (
      node: GraphNode & Point,
      active: boolean,
      timestamp: number,
      neuralRgb: string,
      pulseRgb: string,
      violetRgb: string,
      riskRgb: string,
      labelPrimary: string,
      labelSecondary: string
    ) => {
      const rgb = kindRgb(node.kind, neuralRgb, pulseRgb, violetRgb, riskRgb);
      const r = node.radius;
      const hub = isHub(node.kind);
      const showLabel = active || hub || node.kind === 'project';

      if (node.kind === 'workspace') {
        drawJarvisCore(node.x, node.y, r, timestamp, pulseRgb, neuralRgb);
      } else {
        if (active) {
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3);
          glow.addColorStop(0, `rgba(${rgb}, 0.2)`);
          glow.addColorStop(1, `rgba(${rgb}, 0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, r + (hub ? 2.5 : 1.5), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb}, ${active ? 0.85 : hub ? 0.55 : 0.4})`;
        ctx.lineWidth = active ? 1.4 : hub ? 1.2 : 0.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, hub ? r * 0.55 : r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${active ? 1 : 0.75})`;
        ctx.fill();

        if (hub) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 0.18, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }

      if (active && interactionRef.current.selectedId === node.id) {
        const pulse = 2.2 + Math.sin(timestamp / 600) * 0.25;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb}, 0.3)`;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (showLabel) {
        const label = node.label.length > 28 ? `${node.label.slice(0, 28)}…` : node.label;
        const fontSize = node.kind === 'workspace' ? 12 : node.kind === 'group' ? 10 : 9;
        ctx.font = `500 ${fontSize}px "JetBrains Mono", monospace`;
        ctx.fillStyle = active || node.kind === 'workspace' ? labelPrimary : labelSecondary;
        ctx.fillText(label.toUpperCase(), node.x + r + 8, node.y + 3);
      }
    };

    const drawSignal = (from: Point, to: Point, progress: number, neuralRgb: string, pulseRgb: string) => {
      const x = from.x + (to.x - from.x) * progress;
      const y = from.y + (to.y - from.y) * progress;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 14);
      glow.addColorStop(0, `rgba(${pulseRgb}, 0.9)`);
      glow.addColorStop(0.5, `rgba(${neuralRgb}, 0.4)`);
      glow.addColorStop(1, `rgba(${neuralRgb}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = (timestamp: number) => {
      animationRef.current = requestAnimationFrame(draw);
      if (timestamp - lastFrameRef.current < FPS_INTERVAL) return;
      lastFrameRef.current = timestamp;

      const { selectedId: sel, hoveredId: hov, positions: pos, pan: p, zoom: z } =
        interactionRef.current;
      const { nodes, links } = graphRef.current;

      const neuralRgb = getCssVar('--neural-rgb', '8, 145, 178');
      const pulseRgb = '14, 116, 144';
      const violetRgb = getCssVar('--neural-violet-rgb', '124, 58, 237');
      const riskRgb = '225, 29, 72';
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
        x: pos[n.id]?.x ?? n.x,
        y: pos[n.id]?.y ?? n.y,
      }));
      const map = new Map(positioned.map((n) => [n.id, n]));

      links.forEach((link, index) => {
        const source = map.get(link.source);
        const target = map.get(link.target);
        if (!source || !target) return;

        const active =
          sel === link.source || sel === link.target || hov === link.source || hov === link.target;
        const isHot =
          source.kind === 'workspace' ||
          target.kind === 'workspace' ||
          source.kind === 'group' ||
          target.kind === 'group';

        const linkKind =
          source.kind === 'bug' || target.kind === 'bug'
            ? 'bug'
            : source.kind === 'research' || target.kind === 'research'
              ? 'research'
              : source.kind;
        const rgb = kindRgb(linkKind, neuralRgb, pulseRgb, violetRgb, riskRgb);

        const opacity = active ? 0.75 : isHot ? 0.42 : 0.18;
        drawCurvedLink(
          source,
          target,
          opacity,
          active ? 1.2 : isHot ? 0.85 : 0.55,
          rgb,
          Math.sin(index * 1.7) * 10
        );
      });

      signalsRef.current.forEach((signal) => {
        const link = links.find((l) => l.id === signal.linkId);
        if (!link) return;
        const source = map.get(link.source);
        const target = map.get(link.target);
        if (!source || !target) return;
        drawSignal(source, target, signal.progress, neuralRgb, pulseRgb);
      });

      positioned.forEach((node) => {
        const active = sel === node.id || hov === node.id;
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
          className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        />
      </div>

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between p-4">
        <div className="pointer-events-auto glass-panel rounded-xl border border-default px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-neural-core shadow-[0_0_10px_var(--neural-core)] neural-logo-pulse" />
            <div>
              <span className="text-sm font-bold tracking-tight text-primary">{APP_NAME}</span>
              <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-neural">
                / {WORKSPACE_NAME}
              </span>
            </div>
          </div>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted">
            {positionedNodes.length} nodes · {graph.links.length} links
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-subtle bg-surface/80 p-1 backdrop-blur-xl">
          <Button variant="ghost" size="sm" onClick={() => setZoom((v) => Math.max(0.4, v - 0.1))} className="!px-2">
            <ZoomOut size={14} />
          </Button>
          <span className="px-1 font-mono text-[10px] text-muted">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom((v) => Math.min(2, v + 0.1))} className="!px-2">
            <ZoomIn size={14} />
          </Button>
          <div className="mx-1 h-4 w-px bg-border-subtle" />
          <Button variant="ghost" size="sm" onClick={resetView} className="!px-2">
            <RotateCcw size={14} />
          </Button>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest text-muted">
        drag nodes · pan · scroll to zoom · click to inspect
      </p>

      <aside className="absolute right-0 top-0 z-20 flex h-full w-[300px] flex-col border-l border-subtle bg-surface/90 p-5 shadow-[-8px_0_32px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-neural-core shadow-[0_0_6px_var(--neural-core)]" />
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted">Node metadata</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: nodeColors[selectedNode.kind] }}
                  />
                  <Badge variant={nodeBadgeVariant[selectedNode.kind]}>{selectedNode.kind}</Badge>
                </div>
                <h3 className="text-base font-semibold leading-snug text-primary">{selectedNode.label}</h3>
                {selectedNode.meta && (
                  <p
                    className="mt-1 font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: nodeColors[selectedNode.kind] }}
                  >
                    {selectedNode.meta}
                  </p>
                )}
              </div>

              {selectedNode.description && (
                <p className="text-xs leading-relaxed text-secondary">{selectedNode.description}</p>
              )}

              {selectedNode.details && selectedNode.details.length > 0 && (
                <dl className="space-y-2 rounded-lg border border-subtle bg-elevated/50 p-3">
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
                    Linked · {connectedNodes.length}
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
                          style={{ background: nodeColors[node.kind] }}
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
                <Link to={selectedNode.route}>
                  <Button className="mt-1 w-full" size="sm">
                    <Maximize2 size={12} className="mr-2" />
                    Open full view
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted">Click any node to inspect.</p>
          )}
        </div>

        <div className="mt-4 border-t border-subtle pt-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Projects', value: counts.projects, color: 'var(--neural-core)' },
              { label: 'Tasks', value: counts.tasks, color: 'var(--neural-pulse)' },
              { label: 'Bugs', value: counts.bugs, color: 'var(--status-risk)' },
              { label: 'Ideas', value: counts.ideas, color: 'var(--violet-core)' },
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
    </>
  );
}
