import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  kind: 'core' | 'hub' | 'node' | 'satellite';
  color: 'neural' | 'hot' | 'violet';
  pulseUntil: number;
  pulseIntensity: number;
}

interface Link {
  fromId: number;
  toId: number;
  strength: number;
}

interface Signal {
  fromId: number;
  toId: number;
  progress: number;
  startTime: number;
}

interface NeuralCanvasProps {
  variant?: 'background' | 'hero';
}

const FPS_INTERVAL = 1000 / 30;

const VARIANT_CONFIG = {
  background: {
    opacity: 0.55,
    coreNodes: 120,
    hubs: 16,
    clusters: 8,
    cloudScale: 0.34,
    coreRadius: 5,
    linkOpacityMin: 0.07,
    linkWidthHub: 0.75,
    linkWidthNode: 0.45,
    hoverRadius: 12,
    signalInterval: [1400, 2700] as const,
  },
  hero: {
    opacity: 1,
    coreNodes: 200,
    hubs: 24,
    clusters: 14,
    cloudScale: 0.44,
    coreRadius: 7.5,
    linkOpacityMin: 0.1,
    linkWidthHub: 1.1,
    linkWidthNode: 0.65,
    hoverRadius: 18,
    signalInterval: [900, 1800] as const,
  },
};

function getCssVar(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

function nodeRgb(
  node: Node,
  neuralRgb: string,
  hotRgb: string,
  violetRgb: string
): string {
  if (node.color === 'hot') return hotRgb;
  if (node.color === 'violet') return violetRgb;
  return neuralRgb;
}

export function NeuralCanvas({ variant = 'background' }: NeuralCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
  const signalsRef = useRef<Signal[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const lastFrameRef = useRef(0);
  const signalTimerRef = useRef(0);
  const isHero = variant === 'hero';

  useEffect(() => {
    const config = VARIANT_CONFIG[variant];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initGraph = () => {
      resize();

      const nodes: Node[] = [];
      const links: Link[] = [];
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const cloudRadius = Math.min(w, h) * config.cloudScale;
      const hubIds: number[] = [];

      nodes.push({
        x: cx,
        y: cy,
        baseX: cx,
        baseY: cy,
        vx: 0,
        vy: 0,
        radius: config.coreRadius,
        kind: 'core',
        color: 'neural',
        pulseUntil: 0,
        pulseIntensity: 0,
      });

      for (let i = 0; i < config.hubs; i++) {
        const angle = (i / config.hubs) * Math.PI * 2 + Math.random() * 0.3;
        const distance = cloudRadius * (0.12 + Math.random() * 0.78);
        const point = polarPoint(cx, cy, distance, angle);
        const id = nodes.length;

        hubIds.push(id);
        nodes.push({
          x: point.x,
          y: point.y,
          baseX: point.x,
          baseY: point.y,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          radius: 2.4 + Math.random() * 2.2,
          kind: 'hub',
          color: 'neural',
          pulseUntil: 0,
          pulseIntensity: 0,
        });
        links.push({ fromId: 0, toId: id, strength: 0.4 + Math.random() * 0.4 });
      }

      for (let i = 0; i < config.coreNodes; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = cloudRadius * Math.sqrt(Math.random()) * 0.96;
        const point = polarPoint(cx, cy, distance, angle);
        const id = nodes.length;
        const nearestHub = hubIds.reduce((best, hubId) => {
          const hub = nodes[hubId];
          const bestHub = nodes[best];
          return Math.hypot(hub.x - point.x, hub.y - point.y) <
            Math.hypot(bestHub.x - point.x, bestHub.y - point.y)
            ? hubId
            : best;
        }, hubIds[0]);

        nodes.push({
          x: point.x,
          y: point.y,
          baseX: point.x,
          baseY: point.y,
          vx: (Math.random() - 0.5) * 0.14,
          vy: (Math.random() - 0.5) * 0.14,
          radius: 0.85 + Math.random() * 1.3,
          kind: 'node',
          color: Math.random() > 0.92 ? 'violet' : 'neural',
          pulseUntil: 0,
          pulseIntensity: 0,
        });
        links.push({ fromId: nearestHub, toId: id, strength: 0.2 + Math.random() * 0.32 });

        if (Math.random() > 0.7) {
          links.push({
            fromId: hubIds[Math.floor(Math.random() * hubIds.length)],
            toId: id,
            strength: 0.1 + Math.random() * 0.16,
          });
        }
      }

      for (let cluster = 0; cluster < config.clusters; cluster++) {
        const angle = (cluster / config.clusters) * Math.PI * 2 + Math.random() * 0.4;
        const distance = cloudRadius * (0.82 + Math.random() * 0.38);
        const center = polarPoint(cx, cy, distance, angle);
        const anchor = hubIds[Math.floor(Math.random() * hubIds.length)];
        const clusterHubId = nodes.length;

        nodes.push({
          x: center.x,
          y: center.y,
          baseX: center.x,
          baseY: center.y,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
          radius: 2.2 + Math.random() * 1.8,
          kind: 'hub',
          color: cluster % 3 === 0 ? 'violet' : 'neural',
          pulseUntil: 0,
          pulseIntensity: 0,
        });
        links.push({ fromId: anchor, toId: clusterHubId, strength: 0.24 });

        const spokes = 14 + Math.floor(Math.random() * 14);
        for (let i = 0; i < spokes; i++) {
          const spokeAngle = (i / spokes) * Math.PI * 2;
          const spokeDistance = 28 + Math.random() * 50;
          const point = polarPoint(center.x, center.y, spokeDistance, spokeAngle);
          const id = nodes.length;

          nodes.push({
            x: point.x,
            y: point.y,
            baseX: point.x,
            baseY: point.y,
            vx: (Math.random() - 0.5) * 0.08,
            vy: (Math.random() - 0.5) * 0.08,
            radius: 0.7 + Math.random() * 1,
            kind: 'satellite',
            color: cluster % 3 === 0 ? 'violet' : 'neural',
            pulseUntil: 0,
            pulseIntensity: 0,
          });
          links.push({ fromId: clusterHubId, toId: id, strength: 0.16 + Math.random() * 0.22 });
        }
      }

      nodesRef.current = nodes;
      linksRef.current = links;
    };

    initGraph();

    const handleResize = () => initGraph();
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    const emitSignal = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;
      if (!nodes.length || !links.length) return;

      const link = links[Math.floor(Math.random() * links.length)];
      const from = nodes[link.fromId];
      const to = nodes[link.toId];
      if (!from || !to) return;

      from.pulseUntil = performance.now() + 900;
      to.pulseUntil = performance.now() + 900;
      from.pulseIntensity = 1;
      to.pulseIntensity = 0.75;
      signalsRef.current.push({
        fromId: link.fromId,
        toId: link.toId,
        progress: 0,
        startTime: performance.now(),
      });
    };

    const drawBase = (w: number, h: number) => {
      const bgBase = getCssVar('--bg-base', '#f1f5f9');
      ctx.fillStyle = bgBase;
      ctx.fillRect(0, 0, w, h);
    };

    const drawDotGrid = (w: number, h: number) => {
      const gridColor = getCssVar('--graph-grid', 'rgba(8,145,178,0.12)');
      const spacing = 36;
      ctx.fillStyle = gridColor;
      for (let x = 0; x < w; x += spacing) {
        for (let y = 0; y < h; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 0.75, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawBackdrop = (
      w: number,
      h: number,
      neuralRgb: string,
      hotRgb: string,
      violetRgb: string
    ) => {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const r = Math.max(w, h) * (isHero ? 0.65 : 0.55);

      const main = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      main.addColorStop(0, `rgba(${neuralRgb}, ${isHero ? 0.14 : 0.08})`);
      main.addColorStop(0.35, `rgba(${hotRgb}, ${isHero ? 0.06 : 0.03})`);
      main.addColorStop(0.65, `rgba(${violetRgb}, ${isHero ? 0.04 : 0.02})`);
      main.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = main;
      ctx.fillRect(0, 0, w, h);
    };

    const drawCurvedLink = (
      from: Node,
      to: Node,
      opacity: number,
      lineWidth: number,
      rgb: string,
      curveOffset: number
    ) => {
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length;
      const ny = dx / length;
      const cpx = mx + nx * curveOffset;
      const cpy = my + ny * curveOffset;

      const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, `rgba(${rgb}, ${opacity * 0.6})`);
      gradient.addColorStop(0.5, `rgba(${rgb}, ${opacity})`);
      gradient.addColorStop(1, `rgba(${rgb}, ${opacity * 0.5})`);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(cpx, cpy, to.x, to.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const drawHubBloom = (node: Node, rgb: string, timestamp: number) => {
      const bloomRadius = node.kind === 'core' ? (isHero ? 72 : 48) : 22 + node.pulseIntensity * 16;
      const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, bloomRadius);
      glow.addColorStop(0, `rgba(${rgb}, ${0.22 + node.pulseIntensity * 0.3})`);
      glow.addColorStop(0.55, `rgba(${rgb}, ${0.06 + node.pulseIntensity * 0.1})`);
      glow.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(node.x, node.y, bloomRadius, 0, Math.PI * 2);
      ctx.fill();

      if (node.pulseIntensity > 0.12 || node.kind === 'core') {
        const ringR = bloomRadius * (node.kind === 'core' ? 0.55 : 0.85);
        const pulse = node.kind === 'core' ? 1 + Math.sin(timestamp / 220) * 0.06 : 1;
        ctx.strokeStyle = `rgba(${rgb}, ${node.kind === 'core' ? 0.25 : node.pulseIntensity * 0.35})`;
        ctx.lineWidth = node.kind === 'core' ? 1.2 : 0.8;
        ctx.beginPath();
        ctx.arc(node.x, node.y, ringR * pulse, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawSignal = (signal: Signal, neuralRgb: string, hotRgb: string) => {
      const from = nodesRef.current[signal.fromId];
      const to = nodesRef.current[signal.toId];
      if (!from || !to) return;

      const x = from.x + (to.x - from.x) * signal.progress;
      const y = from.y + (to.y - from.y) * signal.progress;
      const size = isHero ? 22 : 16;

      const glow = ctx.createRadialGradient(x, y, 0, x, y, size);
      glow.addColorStop(0, `rgba(${hotRgb}, 0.85)`);
      glow.addColorStop(0.4, `rgba(${neuralRgb}, 0.35)`);
      glow.addColorStop(1, `rgba(${neuralRgb}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${hotRgb}, 0.95)`;
      ctx.beginPath();
      ctx.arc(x, y, isHero ? 3.8 : 3, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawNode = (
      node: Node,
      index: number,
      isHover: boolean,
      neuralRgb: string,
      hotRgb: string,
      violetRgb: string,
      neuralCore: string,
      nodeFill: string
    ) => {
      const rgb = nodeRgb(node, neuralRgb, hotRgb, violetRgb);
      const radius = node.radius + (isHover ? 1.4 : 0) + node.pulseIntensity * 2;
      const isSmall = node.kind === 'node' || node.kind === 'satellite';

      if (!isSmall) {
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 4.5);
        const alpha = 0.14 + (isHover ? 0.2 : 0) + node.pulseIntensity * 0.28;
        glow.addColorStop(0, `rgba(${rgb}, ${alpha})`);
        glow.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      if (isSmall) {
        ctx.fillStyle = nodeFill;
        ctx.fill();
        ctx.strokeStyle =
          isHover || node.pulseIntensity > 0
            ? `rgba(${rgb}, 0.95)`
            : `rgba(${rgb}, 0.55)`;
        ctx.lineWidth = isHover ? 1.8 : 1.2;
        ctx.stroke();
      } else if (node.kind === 'core') {
        ctx.fillStyle = `rgba(${hotRgb}, 0.95)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${rgb}, 0.5)`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else {
        ctx.fillStyle =
          isHover || node.pulseIntensity > 0
            ? node.color === 'neural'
              ? neuralCore
              : `rgba(${rgb}, 0.95)`
            : `rgba(${rgb}, 0.82)`;
        ctx.fill();
        if (isHero) {
          ctx.strokeStyle = `rgba(255,255,255,0.5)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      if (isHover && index > 0) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb}, 0.35)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    };

    const draw = (timestamp: number) => {
      animationRef.current = requestAnimationFrame(draw);

      if (timestamp - lastFrameRef.current < FPS_INTERVAL) return;
      lastFrameRef.current = timestamp;

      const nodes = nodesRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const neuralRgb = getCssVar('--neural-rgb', '8, 145, 178');
      const hotRgb = getCssVar('--neural-rgb', '8, 145, 178');
      const violetRgb = getCssVar('--neural-violet-rgb', '124, 58, 237');
      const neuralCore = getCssVar('--neural-core', '#0891b2');
      const nodeFill = getCssVar('--graph-node-fill', '#ffffff');

      ctx.clearRect(0, 0, w, h);

      if (isHero) {
        drawBase(w, h);
        drawDotGrid(w, h);
      }

      drawBackdrop(w, h, neuralRgb, hotRgb, violetRgb);

      if (!prefersReducedMotion) {
        nodes.forEach((node, index) => {
          node.x += node.vx + (node.baseX - node.x) * 0.005;
          node.y += node.vy + (node.baseY - node.y) * 0.005;
          node.x += Math.sin(timestamp / 2800 + index * 0.37) * 0.12;
          node.y += Math.cos(timestamp / 3000 + index * 0.31) * 0.1;
          node.pulseIntensity =
            node.pulseUntil > timestamp ? Math.max(0, (node.pulseUntil - timestamp) / 900) : 0;
        });

        signalTimerRef.current += FPS_INTERVAL;
        const [minInterval, maxInterval] = config.signalInterval;
        if (signalTimerRef.current > minInterval + Math.random() * (maxInterval - minInterval)) {
          signalTimerRef.current = 0;
          emitSignal();
        }

        signalsRef.current = signalsRef.current.filter((signal) => {
          signal.progress = (timestamp - signal.startTime) / 1000;
          return signal.progress < 1;
        });
      }

      const mouseDistances = nodes
        .map((node, index) => ({
          index,
          distance: Math.hypot(node.x - mouseRef.current.x, node.y - mouseRef.current.y),
        }))
        .sort((a, b) => a.distance - b.distance);
      const hoverSet = new Set(
        mouseDistances.slice(0, config.hoverRadius).map((item) => item.index)
      );

      linksRef.current.forEach((link, index) => {
        const from = nodes[link.fromId];
        const to = nodes[link.toId];
        if (!from || !to) return;

        const distance = Math.hypot(to.x - from.x, to.y - from.y);
        const isHover = hoverSet.has(link.fromId) || hoverSet.has(link.toId);
        const isPulsing = from.pulseIntensity > 0 || to.pulseIntensity > 0;
        const rgb =
          from.color === 'violet' || to.color === 'violet'
            ? violetRgb
            : from.color === 'hot' || to.color === 'hot'
              ? hotRgb
              : neuralRgb;

        let opacity = Math.max(config.linkOpacityMin, link.strength * (1 - Math.min(distance, 540) / 760));
        if (isHover) opacity = Math.min(0.75, opacity * 2.5);
        if (isPulsing) opacity = Math.max(opacity, 0.5);

        drawCurvedLink(
          from,
          to,
          opacity,
          from.kind === 'hub' || to.kind === 'hub' ? config.linkWidthHub : config.linkWidthNode,
          rgb,
          Math.sin(index * 1.7) * (isHero ? 16 : 12)
        );
      });

      signalsRef.current.forEach((signal) => drawSignal(signal, neuralRgb, hotRgb));

      nodes.forEach((node) => {
        if (node.kind === 'core' || node.kind === 'hub') {
          drawHubBloom(node, nodeRgb(node, neuralRgb, hotRgb, violetRgb), timestamp);
        }
      });

      nodes.forEach((node, index) => {
        drawNode(
          node,
          index,
          hoverSet.has(index),
          neuralRgb,
          hotRgb,
          violetRgb,
          neuralCore,
          nodeFill
        );
      });
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className={isHero ? 'absolute inset-0 z-0' : 'pointer-events-none fixed inset-0 z-0'}
      style={{ opacity: VARIANT_CONFIG[variant].opacity }}
      aria-hidden={!isHero}
    />
  );
}
