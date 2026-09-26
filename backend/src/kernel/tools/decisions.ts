import { register } from '../registry.js';
import { prisma } from '../../lib/prisma.js';
import { toJsonArray } from '../../lib/json.js';
import { serializeDecision } from '../../services/serialize.js';

// ── Read: search_decisions ────────────────────────────────────
register({
  name: 'search_decisions',
  description: 'Search Architecture Decision Records (ADRs). Filter by status or project.',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['PROPOSED', 'ACCEPTED', 'REJECTED', 'SUPERSEDED'],
        description: 'Filter by decision status',
      },
      projectId: { type: 'string', description: 'Filter by project ID' },
    },
  },
  sideEffect: 'none',
  version: '1.0.0',
  handler: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.status) where.status = args.status;
    if (args.projectId) where.projectId = args.projectId;

    const items = await prisma.decision.findMany({
      where,
      orderBy: { number: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    });
    return items.map(serializeDecision);
  },
});

// ── Write: create_decision (Drafts only - compensable) ─────────
register({
  name: 'create_decision',
  description:
    'Draft a new Architecture Decision Record (ADR). Must be PROPOSED or UNDER_REVIEW. Publishing/accepting is gated under publish_decision.',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'ADR Title' },
      decision: { type: 'string', description: 'The decision statement' },
      context: { type: 'string', description: 'Context and problem statement' },
      reason: { type: 'string', description: 'Justification for the decision' },
      rejected: { type: 'string', description: 'Alternatives considered and why rejected' },
      affectedModules: {
        type: 'array',
        items: { type: 'string' },
        description: 'Modules affected by this decision',
      },
      projectId: { type: 'string', description: 'Target project ID' },
    },
    required: ['title', 'decision'],
  },
  sideEffect: 'compensable',
  version: '1.0.0',
  handler: async (args) => {
    const maxDecision = await prisma.decision.aggregate({ _max: { number: true } });
    const nextNumber = (maxDecision._max.number ?? 0) + 1;

    const affectedModules = Array.isArray(args.affectedModules)
      ? (args.affectedModules as string[])
      : [];

    const item = await prisma.decision.create({
      data: {
        number: nextNumber,
        title: String(args.title),
        decision: String(args.decision),
        context: args.context ? String(args.context) : undefined,
        reason: args.reason ? String(args.reason) : undefined,
        rejected: args.rejected ? String(args.rejected) : undefined,
        status: 'PROPOSED', // Always draft when created via compensable tool
        affectedModules: toJsonArray(affectedModules),
        projectId: args.projectId ? String(args.projectId) : undefined,
      },
      include: { project: { select: { id: true, name: true } } },
    });
    return serializeDecision(item);
  },
});

// ── Gated: publish_decision (Critical - law enforced refusal) ──
register({
  name: 'publish_decision',
  description:
    'Formally publish and accept an ADR (status=ACCEPTED). Irreversible architectural commitment.',
  parameters: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Decision ID to publish/accept' },
    },
    required: ['id'],
  },
  sideEffect: 'critical', // Will be refused by kernel.execute() in Phase 0
  version: '1.0.0',
  handler: async (_args) => {
    throw new Error('publish_decision: gated. requires human approval dossier.');
  },
});
