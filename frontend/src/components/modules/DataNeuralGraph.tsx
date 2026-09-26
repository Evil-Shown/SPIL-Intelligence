import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import {
  type GraphNode,
  useNeuralGraphData,
} from '../../lib/companyBrainGraph';

interface Node3D {
  id: string;
  label: string;
  kind: string;
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  color: THREE.Color;
  size: number;
  raw: GraphNode;
  mesh?: THREE.Mesh;
}

interface Link3D {
  source: Node3D;
  target: Node3D;
  strength: number;
}

export function DataNeuralGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string>('workspace');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<'samaritan' | 'cyan' | 'purple' | 'crimson'>('samaritan');

  const { graph, counts } = useNeuralGraphData(1200, 800);

  // Theme palettes (Samaritan light theme + dark crystal alternatives)
  const themeColors = useMemo(() => {
    switch (themeMode) {
      case 'samaritan':
        return {
          core: 0xe10600,
          glow: 0xff4d4d,
          edge: 0x94a3b8,
          particle: 0x64748b,
          ambientBg: 0xf5f5f5,
          isLight: true,
        };
      case 'purple':
        return {
          core: 0xd946ef,
          glow: 0xa855f7,
          edge: 0x8b5cf6,
          particle: 0xf472b6,
          ambientBg: 0x06020a,
          isLight: false,
        };
      case 'crimson':
        return {
          core: 0xe10600,
          glow: 0xff3b30,
          edge: 0x991b1b,
          particle: 0xfca5a5,
          ambientBg: 0x080203,
          isLight: false,
        };
      case 'cyan':
      default:
        return {
          core: 0x00f0ff,
          glow: 0x38bdf8,
          edge: 0x0284c7,
          particle: 0xbae6fd,
          ambientBg: 0x030712,
          isLight: false,
        };
    }
  }, [themeMode]);

  // Construct 3D Spherical/Brain Topology
  const { nodes3D, links3D, nodeMap } = useMemo(() => {
    const rawNodes = graph.nodes;
    const n = rawNodes.length;
    const radius = 240;

    const map = new Map<string, Node3D>();
    const n3dList: Node3D[] = [];

    rawNodes.forEach((rn, i) => {
      // Golden spiral distribution on 3D sphere + core cluster
      let x = 0, y = 0, z = 0;
      if (rn.kind === 'workspace') {
        x = 0; y = 0; z = 0;
      } else if (rn.kind === 'department') {
        const phi = Math.acos(1 - (2 * (i + 1)) / (n + 1));
        const theta = Math.PI * (1 + 5 ** 0.5) * (i + 1);
        const r = radius * 0.45;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      } else {
        const phi = Math.acos(1 - (2 * (i + 1)) / (n + 1));
        const theta = Math.PI * (1 + 5 ** 0.5) * (i + 1);
        const r = radius * (0.65 + Math.sin(i * 3.7) * 0.35);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      }

      // Base color by category
      let hexColor = themeColors.particle;
      if (rn.kind === 'workspace') hexColor = themeColors.isLight ? 0x0a0a0a : 0xffffff;
      else if (rn.kind === 'department') hexColor = themeColors.core;
      else if (rn.kind === 'person') hexColor = themeColors.isLight ? 0x166534 : 0x22c55e;
      else if (rn.kind === 'bug') hexColor = themeColors.isLight ? 0x991b1b : 0xef4444;
      else if (rn.kind === 'workflow') hexColor = themeColors.isLight ? 0x475569 : themeColors.glow;

      const nodeObj: Node3D = {
        id: rn.id,
        label: rn.label,
        kind: rn.kind,
        x, y, z,
        baseX: x, baseY: y, baseZ: z,
        color: new THREE.Color(hexColor),
        size: rn.kind === 'workspace' ? 14 : rn.kind === 'department' ? 8 : 4.5,
        raw: rn,
      };

      map.set(rn.id, nodeObj);
      n3dList.push(nodeObj);
    });

    const l3dList: Link3D[] = [];
    graph.links.forEach((l) => {
      const src = map.get(l.source);
      const tgt = map.get(l.target);
      if (src && tgt) {
        l3dList.push({ source: src, target: tgt, strength: l.strength });
      }
    });

    return { nodes3D: n3dList, links3D: l3dList, nodeMap: map };
  }, [graph, themeColors]);

  const selectedNode = nodeMap.get(selectedId) ?? nodes3D[0];

  const connectedNodes = useMemo(() => {
    if (!selectedNode) return [];
    const connected: Node3D[] = [];
    links3D.forEach((l) => {
      if (l.source.id === selectedNode.id) connected.push(l.target);
      if (l.target.id === selectedNode.id) connected.push(l.source);
    });
    return connected;
  }, [selectedNode, links3D]);

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(themeColors.ambientBg, themeColors.isLight ? 0.0014 : 0.0018);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
    camera.position.set(0, 40, 520);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(themeColors.ambientBg, 1);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Main Brain Group (for rotation & dragging)
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // ── 1. Central Core Glowing Star / Sun ──
    const coreGeo = new THREE.SphereGeometry(18, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: themeColors.isLight ? 0xe10600 : 0xffffff,
      transparent: true,
      opacity: themeColors.isLight ? 0.95 : 0.95,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    brainGroup.add(coreMesh);

    // Core halo sprite
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    if (themeColors.isLight) {
      gradient.addColorStop(0, 'rgba(225, 6, 0, 0.9)');
      gradient.addColorStop(0.25, 'rgba(225, 6, 0, 0.45)');
      gradient.addColorStop(0.65, 'rgba(225, 6, 0, 0.12)');
      gradient.addColorStop(1, 'rgba(245, 245, 245, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(0, 240, 255, 0.8)');
      gradient.addColorStop(0.6, 'rgba(0, 240, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      color: themeColors.core,
      transparent: true,
      blending: themeColors.isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
      opacity: themeColors.isLight ? 0.75 : 1,
    });
    const coreSprite = new THREE.Sprite(spriteMat);
    coreSprite.scale.set(160, 160, 1);
    brainGroup.add(coreSprite);

    // ── 2. Instanced or Sphere Meshes for Nodes ──
    const nodeMeshes: THREE.Mesh[] = [];
    nodes3D.forEach((n) => {
      const geo = new THREE.SphereGeometry(n.size, 16, 16);
      const isSelected = n.id === selectedId;
      const mat = new THREE.MeshStandardMaterial({
        color: n.color,
        emissive: n.color,
        emissiveIntensity: themeColors.isLight
          ? (isSelected ? 0.9 : 0.25)
          : (isSelected ? 1.8 : 0.8),
        roughness: themeColors.isLight ? 0.5 : 0.2,
        metalness: themeColors.isLight ? 0.2 : 0.8,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(n.x, n.y, n.z);
      (mesh as any).nodeId = n.id;
      brainGroup.add(mesh);
      nodeMeshes.push(mesh);
      n.mesh = mesh;
    });

    // ── 3. High-Density Synaptic Lines (Links) ──
    const linePositions = new Float32Array(links3D.length * 6);
    const lineColors = new Float32Array(links3D.length * 6);

    const baseEdgeColor = new THREE.Color(themeColors.edge);
    const brightEdgeColor = new THREE.Color(themeColors.core);

    links3D.forEach((link, i) => {
      const i6 = i * 6;
      linePositions[i6] = link.source.x;
      linePositions[i6 + 1] = link.source.y;
      linePositions[i6 + 2] = link.source.z;
      linePositions[i6 + 3] = link.target.x;
      linePositions[i6 + 4] = link.target.y;
      linePositions[i6 + 5] = link.target.z;

      const c = link.source.id === selectedId || link.target.id === selectedId ? brightEdgeColor : baseEdgeColor;
      lineColors[i6] = c.r;
      lineColors[i6 + 1] = c.g;
      lineColors[i6 + 2] = c.b;
      lineColors[i6 + 3] = c.r;
      lineColors[i6 + 4] = c.g;
      lineColors[i6 + 5] = c.b;
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: themeColors.isLight ? 0.55 : 0.45,
      blending: themeColors.isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    brainGroup.add(lineSegments);

    // ── 4. Floating Neural Dust Particles ──
    const dustCount = themeColors.isLight ? 450 : 800;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 180 + Math.random() * 180;
      dustPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      dustPos[i * 3 + 2] = r * Math.cos(phi);
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: themeColors.isLight ? 2.6 : 2.2,
      color: themeColors.particle,
      transparent: true,
      opacity: themeColors.isLight ? 0.45 : 0.5,
      blending: themeColors.isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    brainGroup.add(dustPoints);

    // ── 5. Ambient Lights ──
    const ambientLight = new THREE.AmbientLight(0xffffff, themeColors.isLight ? 0.95 : 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(themeColors.core, themeColors.isLight ? 1.5 : 3, 600);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // ── 6. Interactive Raycasting & Mouse Controls ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    let isPointerDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e: MouseEvent) => {
      isPointerDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isPointerDown) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        brainGroup.rotation.y += deltaX * 0.006;
        brainGroup.rotation.x += deltaY * 0.006;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const onPointerUp = () => {
      isPointerDown = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clickMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(clickMouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object as any;
        if (hit.nodeId) {
          setSelectedId(hit.nodeId);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.4, 200, 1000);
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('click', onClick);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Handle Resize
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // ── 7. Animation Loop with Organic Breathing ──
    let clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Continuous subtle idle rotation
      if (isRotating && !isPointerDown) {
        brainGroup.rotation.y += 0.0025;
        brainGroup.rotation.x = Math.sin(elapsed * 0.3) * 0.08;
      }

      // Organic pulsating breathing of the core
      const pulse = 1 + Math.sin(elapsed * 3.5) * 0.12;
      coreMesh.scale.set(pulse, pulse, pulse);
      coreSprite.scale.set(160 * pulse, 160 * pulse, 1);

      // Dust drift
      dustPoints.rotation.y -= 0.0008;
      dustPoints.rotation.z += 0.0004;

      // Hover Raycasting
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object as any;
        setHoveredId(hit.nodeId);
        container.style.cursor = 'pointer';
      } else {
        setHoveredId(null);
        container.style.cursor = isPointerDown ? 'grabbing' : 'grab';
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('click', onClick);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [nodes3D, links3D, themeColors, isRotating]);

  return (
    <div
      className="relative h-full w-full overflow-hidden select-none transition-colors duration-300"
      style={{ backgroundColor: themeColors.isLight ? '#f5f5f5' : '#030712' }}
    >
      {/* 3D WebGL Canvas Mount */}
      <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" />

      {/* ─── HUD OVERLAYS & CONTROLS ─── */}

      {/* Top Left Header */}
      <div className="pointer-events-none absolute left-6 top-6 z-20 font-mono">
        <div className="flex items-center gap-3">
          <span
            className="h-2 w-2 rounded-none lamp"
            style={{ backgroundColor: themeColors.isLight ? '#e10600' : '#00f0ff' }}
          />
          <h1
            className={`text-sm font-bold uppercase tracking-[0.3em] ${
              themeColors.isLight ? 'text-black' : 'text-white'
            }`}
          >
            QUANTUM SYNAPSE TOPOLOGY // 3D CORE
          </h1>
        </div>
        <p
          className={`mt-1 text-[10px] uppercase tracking-widest ${
            themeColors.isLight ? 'text-black/60 font-semibold' : 'text-white/50'
          }`}
        >
          {nodes3D.length} ACTIVE NEURAL NODES · {links3D.length} SYNAPTIC LINKS · ROTATION: {isRotating ? 'ACTIVE' : 'LOCKED'}
        </p>
      </div>

      {/* Top Right Theme & Mode Controls */}
      <div className="absolute right-6 top-6 z-20 flex items-center gap-3 font-mono">
        {/* Color Theme Selector */}
        <div
          className={`flex items-center gap-2 border px-3 py-1.5 backdrop-blur-md ${
            themeColors.isLight
              ? 'border-black/20 bg-white/85 shadow-sm text-black'
              : 'border-white/20 bg-black/60 text-white'
          }`}
        >
          <span
            className={`text-[9px] uppercase tracking-widest ${
              themeColors.isLight ? 'text-black/60 font-bold' : 'text-white/50'
            }`}
          >
            THEME PALETTE:
          </span>
          {(['samaritan', 'cyan', 'purple', 'crimson'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setThemeMode(mode)}
              className={`h-4 w-4 rounded-none border transition-all ${
                themeMode === mode
                  ? themeColors.isLight
                    ? 'border-black scale-125 shadow-[0_0_8px_rgba(225,6,0,0.5)]'
                    : 'border-white scale-125 shadow-[0_0_8px_white]'
                  : 'border-black/30 opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor:
                  mode === 'samaritan'
                    ? '#ffffff'
                    : mode === 'cyan'
                    ? '#00f0ff'
                    : mode === 'purple'
                    ? '#d946ef'
                    : '#e10600',
                outline: mode === 'samaritan' ? '2px solid #e10600' : undefined,
              }}
              title={mode.toUpperCase()}
            />
          ))}
        </div>

        {/* Rotation Toggle */}
        <button
          type="button"
          onClick={() => setIsRotating((r) => !r)}
          className={`border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md transition-all ${
            themeColors.isLight
              ? 'border-black/20 bg-white/85 text-black hover:border-black hover:bg-black hover:text-white shadow-sm'
              : 'border-white/20 bg-black/60 text-white hover:border-white hover:bg-white hover:text-black'
          }`}
        >
          {isRotating ? 'PAUSE ROTATION' : 'RESUME ROTATION'}
        </button>
      </div>

      {/* Floating Center Notification on Hover */}
      {hoveredId && nodeMap.get(hoveredId) && (
        <div
          className={`pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 border px-4 py-1.5 font-mono shadow-md backdrop-blur-md ${
            themeColors.isLight
              ? 'border-black/30 bg-white/95 text-black shadow-black/10'
              : 'border-cyan-400/40 bg-black/80 text-white shadow-[0_0_20px_rgba(0,240,255,0.3)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-none"
              style={{ backgroundColor: themeColors.isLight ? '#e10600' : '#00f0ff' }}
            />
            <span className="text-xs font-bold uppercase tracking-wider">
              {nodeMap.get(hoveredId)!.label}
            </span>
            <span
              className={`text-[9px] uppercase tracking-widest ${
                themeColors.isLight ? 'text-[#e10600] font-bold' : 'text-cyan-400'
              }`}
            >
              [{nodeMap.get(hoveredId)!.kind}]
            </span>
          </div>
        </div>
      )}

      {/* Bottom Center Guidance Strip */}
      <div
        className={`pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.25em] ${
          themeColors.isLight ? 'text-black/50 font-bold' : 'text-white/40'
        }`}
      >
        [ DRAG TO ROTATE 3D SPHERE · SCROLL TO ZOOM · CLICK NODE TO INSPECT ]
      </div>

      {/* Right Hand Target Dossier */}
      <aside
        className={`absolute right-6 bottom-6 top-24 z-20 flex w-[320px] flex-col border p-5 font-mono shadow-lg backdrop-blur-xl transition-colors duration-200 ${
          themeColors.isLight
            ? 'border-black/20 bg-white/90 text-black shadow-black/10'
            : 'border-white/20 bg-black/75 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
        }`}
      >
        <div className={`border-b pb-3 ${themeColors.isLight ? 'border-black/15' : 'border-white/20'}`}>
          <div className="flex items-center justify-between text-[9px] uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-none lamp"
                style={{ backgroundColor: themeColors.isLight ? '#e10600' : '#00f0ff' }}
              />
              <span className={`font-bold ${themeColors.isLight ? 'text-black/60' : 'text-white/60'}`}>
                TARGET DOSSIER
              </span>
            </div>
            <span className="text-[#1c7a43] font-bold">ONLINE</span>
          </div>
          <h2 className={`mt-2 text-base font-bold uppercase tracking-wider ${themeColors.isLight ? 'text-black' : 'text-white'}`}>
            {selectedNode?.label ?? 'ROOT SYNAPSE'}
          </h2>
          <p
            className={`mt-0.5 text-[9px] uppercase tracking-widest ${
              themeColors.isLight ? 'text-[#e10600] font-bold' : 'text-cyan-400'
            }`}
          >
            CLASS: {selectedNode?.kind ?? 'CORE BRAIN'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pt-4 text-xs">
          {selectedNode?.raw.description && (
            <p
              className={`border p-3 text-[11px] leading-relaxed ${
                themeColors.isLight
                  ? 'border-black/10 bg-black/[0.03] text-black/85'
                  : 'border-white/10 bg-white/5 text-white/80'
              }`}
            >
              {selectedNode.raw.description}
            </p>
          )}

          {selectedNode?.raw.details && selectedNode.raw.details.length > 0 && (
            <dl
              className={`space-y-1.5 border p-3 text-[10px] ${
                themeColors.isLight
                  ? 'border-black/10 bg-black/[0.02]'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {selectedNode.raw.details.map((detail) => (
                <div
                  key={detail.label}
                  className={`flex justify-between border-b pb-1 ${
                    themeColors.isLight ? 'border-black/10' : 'border-white/10'
                  }`}
                >
                  <dt className={`uppercase tracking-wider ${themeColors.isLight ? 'text-black/55' : 'text-white/50'}`}>
                    {detail.label}
                  </dt>
                  <dd className={`font-bold ${themeColors.isLight ? 'text-black' : 'text-white'}`}>
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {connectedNodes.length > 0 && (
            <div>
              <p
                className={`mb-2 text-[9px] uppercase tracking-widest font-bold ${
                  themeColors.isLight ? 'text-black/60' : 'text-white/50'
                }`}
              >
                CONNECTED SYNAPSES ({connectedNodes.length})
              </p>
              <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                {connectedNodes.slice(0, 10).map((cn) => (
                  <button
                    key={cn.id}
                    type="button"
                    onClick={() => setSelectedId(cn.id)}
                    className={`flex w-full items-center justify-between border px-2.5 py-1.5 text-left text-[10px] transition-all ${
                      themeColors.isLight
                        ? 'border-black/10 bg-black/[0.02] text-black hover:border-black hover:bg-black/5'
                        : 'border-white/10 bg-white/5 text-white hover:border-cyan-400 hover:bg-cyan-950/40'
                    }`}
                  >
                    <span className="truncate font-semibold">{cn.label}</span>
                    <span
                      className={`text-[8px] uppercase tracking-wider ${
                        themeColors.isLight ? 'text-[#e10600] font-bold' : 'text-cyan-400'
                      }`}
                    >
                      {cn.kind}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedNode?.raw.route && (
            <Link to={selectedNode.raw.route} className="block pt-2">
              <button
                type="button"
                className={`w-full border py-2 text-center font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${
                  themeColors.isLight
                    ? 'border-black bg-black text-white hover:bg-[#e10600] hover:border-[#e10600]'
                    : 'border-cyan-400 bg-cyan-500/20 text-white hover:bg-cyan-400 hover:text-black'
                }`}
              >
                OPEN WORKSPACE MODULE ➔
              </button>
            </Link>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className={`mt-4 border-t pt-3 ${themeColors.isLight ? 'border-black/15' : 'border-white/20'}`}>
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div
              className={`border p-2 ${
                themeColors.isLight
                  ? 'border-black/10 bg-black/[0.02]'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <p className={`uppercase tracking-wider ${themeColors.isLight ? 'text-black/50' : 'text-white/40'}`}>
                DEPARTMENTS
              </p>
              <p className={`text-sm font-bold ${themeColors.isLight ? 'text-[#e10600]' : 'text-cyan-400'}`}>
                {counts.departments}
              </p>
            </div>
            <div
              className={`border p-2 ${
                themeColors.isLight
                  ? 'border-black/10 bg-black/[0.02]'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <p className={`uppercase tracking-wider ${themeColors.isLight ? 'text-black/50' : 'text-white/40'}`}>
                PERSONNEL
              </p>
              <p className="text-sm font-bold text-[#1c7a43]">{counts.people}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
