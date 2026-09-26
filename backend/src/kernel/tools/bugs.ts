import { register } from '../registry.js';
import { prisma } from '../../lib/prisma.js';
import { serializeBug } from '../../services/serialize.js';

// ── Read: search_bugs ─────────────────────────────────────────
register({
  name: 'search_bugs',
  description: 'Search defect tracker. Filter by projectId, severity, or status.',
  parameters: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Filter by project ID' },
      severity: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        description: 'Filter by bug severity',
      },
      status: {
        type: 'string',
        enum: ['OPEN', 'RESOLVED', 'CLOSED'],
        description: 'Filter by bug status',
      },
      limit: { type: 'number', description: 'Max bugs to return' },
    },
  },
  sideEffect: 'none',
  version: '1.0.0',
  handler: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.projectId) where.projectId = args.projectId;
    if (args.severity) where.severity = args.severity;
    if (args.status) where.status = args.status;

    const items = await prisma.bug.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: typeof args.limit === 'number' ? Math.min(args.limit, 50) : 20,
      include: { project: { select: { id: true, name: true } } },
    });
    return items.map(serializeBug);
  },
});

// ── Write: create_bug ─────────────────────────────────────────
register({
  name: 'create_bug',
  description: 'Log a new bug in the defect tracker. Reversible.',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Short bug summary' },
      description: { type: 'string', description: 'Reproduction steps and failure details' },
      severity: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        description: 'Impact severity',
      },
      module: { type: 'string', description: 'Module where the defect occurs' },
      assignee: { type: 'string', description: 'Assigned developer or tester' },
      projectId: { type: 'string', description: 'Associated project ID' },
    },
    required: ['title'],
  },
  sideEffect: 'compensable',
  version: '1.0.0',
  handler: async (args) => {
    const item = await prisma.bug.create({
      data: {
        title: String(args.title),
        description: args.description ? String(args.description) : undefined,
        severity: (args.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') || 'MEDIUM',
        status: 'OPEN',
        module: args.module ? String(args.module) : undefined,
        assignee: args.assignee ? String(args.assignee) : undefined,
        projectId: args.projectId ? String(args.projectId) : undefined,
      },
      include: { project: { select: { id: true, name: true } } },
    });
    return serializeBug(item);
  },
});

// ── Write: update_bug ─────────────────────────────────────────
register({
  name: 'update_bug',
  description: 'Update bug status, resolution notes, or severity.',
  parameters: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Bug ID' },
      status: {
        type: 'string',
        enum: ['OPEN', 'RESOLVED', 'CLOSED'],
      },
      resolution: { type: 'string', description: 'Resolution explanation' },
      severity: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      },
    },
    required: ['id'],
  },
  sideEffect: 'compensable',
  version: '1.0.0',
  handler: async (args) => {
    const { id, ...data } = args;
    const item = await prisma.bug.update({
      where: { id: String(id) },
      data: data as Record<string, unknown>,
      include: { project: { select: { id: true, name: true } } },
    });
    return serializeBug(item);
  },
});
