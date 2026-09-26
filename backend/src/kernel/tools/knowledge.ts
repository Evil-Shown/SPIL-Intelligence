import { register } from '../registry.js';
import { prisma } from '../../lib/prisma.js';
import { toJsonArray } from '../../lib/json.js';
import {
  serializeIdea,
  serializeResearch,
  serializeDocument,
  serializeProject,
  serializeAlgorithm,
} from '../../services/serialize.js';

// ── Ideas ─────────────────────────────────────────────────────
register({
  name: 'search_ideas',
  description: 'List innovation backlog ideas.',
  parameters: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['BACKLOG', 'IN_PROGRESS', 'ARCHIVED'] },
    },
  },
  sideEffect: 'none',
  version: '1.0.0',
  handler: async (args) => {
    const where = args.status ? { status: String(args.status) } : undefined;
    const items = await prisma.idea.findMany({
      where,
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
    });
    return items.map(serializeIdea);
  },
});

register({
  name: 'create_idea',
  description: 'Record a new feature or product idea.',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Idea title' },
      description: { type: 'string', description: 'Idea concept' },
      rating: { type: 'number', description: 'Rating 1-5' },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
      tags: { type: 'array', items: { type: 'string' } },
    },
    required: ['title'],
  },
  sideEffect: 'compensable',
  version: '1.0.0',
  handler: async (args) => {
    const tags = Array.isArray(args.tags) ? (args.tags as string[]) : [];
    const item = await prisma.idea.create({
      data: {
        title: String(args.title),
        description: args.description ? String(args.description) : undefined,
        rating: typeof args.rating === 'number' ? args.rating : undefined,
        priority: (args.priority as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM',
        status: 'BACKLOG',
        tags: toJsonArray(tags),
      },
    });
    return serializeIdea(item);
  },
});

register({
  name: 'promote_idea',
  description: 'Promote an idea to an active project. Compensable (project can be deleted).',
  parameters: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Idea ID to convert to project' },
    },
    required: ['id'],
  },
  sideEffect: 'compensable',
  version: '1.0.0',
  handler: async (args) => {
    const idea = await prisma.idea.findUnique({ where: { id: String(args.id) } });
    if (!idea) throw new Error('Idea not found');

    const project = await prisma.project.create({
      data: {
        name: idea.title,
        description: idea.description,
        status: 'ACTIVE',
        progress: 0,
        team: 'SPIL Opti',
      },
    });

    await prisma.idea.update({
      where: { id: idea.id },
      data: { status: 'IN_PROGRESS', projectId: project.id },
    });

    return serializeProject(project);
  },
});

// ── Research ──────────────────────────────────────────────────
register({
  name: 'search_research',
  description: 'Search scientific R&D research notes and experiments.',
  parameters: {
    type: 'object',
    properties: {
      projectId: { type: 'string' },
      status: {
        type: 'string',
        enum: ['IDEA', 'EXPERIMENTING', 'ANALYZING', 'CONCLUDED', 'ARCHIVED'],
      },
    },
  },
  sideEffect: 'none',
  version: '1.0.0',
  handler: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.projectId) where.projectId = args.projectId;
    if (args.status) where.status = args.status;

    const items = await prisma.research.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    });
    return items.map(serializeResearch);
  },
});

register({
  name: 'create_research',
  description: 'Create an R&D research card with problem, hypothesis, and experiment notes.',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      problem: { type: 'string' },
      hypothesis: { type: 'string' },
      experiment: { type: 'string' },
      projectId: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
    },
    required: ['title'],
  },
  sideEffect: 'compensable',
  version: '1.0.0',
  handler: async (args) => {
    const tags = Array.isArray(args.tags) ? (args.tags as string[]) : [];
    const item = await prisma.research.create({
      data: {
        title: String(args.title),
        problem: args.problem ? String(args.problem) : undefined,
        hypothesis: args.hypothesis ? String(args.hypothesis) : undefined,
        experiment: args.experiment ? String(args.experiment) : undefined,
        status: 'IDEA',
        tags: toJsonArray(tags),
        projectId: args.projectId ? String(args.projectId) : undefined,
      },
    });
    return serializeResearch(item);
  },
});

// ── Documents ─────────────────────────────────────────────────
register({
  name: 'search_documents',
  description: 'Search knowledge base documents by project or tag.',
  parameters: {
    type: 'object',
    properties: {
      projectId: { type: 'string' },
    },
  },
  sideEffect: 'none',
  version: '1.0.0',
  handler: async (args) => {
    const where = args.projectId ? { projectId: String(args.projectId) } : undefined;
    const items = await prisma.document.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    });
    return items.map(serializeDocument);
  },
});

register({
  name: 'create_document',
  description: 'Create markdown documentation in the knowledge base.',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      content: { type: 'string', description: 'Markdown body' },
      tags: { type: 'array', items: { type: 'string' } },
      projectId: { type: 'string' },
    },
    required: ['title', 'content'],
  },
  sideEffect: 'compensable',
  version: '1.0.0',
  handler: async (args) => {
    const tags = Array.isArray(args.tags) ? (args.tags as string[]) : [];
    const item = await prisma.document.create({
      data: {
        title: String(args.title),
        content: String(args.content),
        tags: JSON.stringify(tags),
        projectId: args.projectId ? String(args.projectId) : undefined,
      },
    });
    return serializeDocument(item);
  },
});

// ── Projects & Algorithms (Read-only) ─────────────────────────
register({
  name: 'search_projects',
  description: 'List all company projects and their status.',
  parameters: { type: 'object', properties: {} },
  sideEffect: 'none',
  version: '1.0.0',
  handler: async () => {
    const items = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { tasks: true, bugs: true } } },
    });
    return items.map(serializeProject);
  },
});

register({
  name: 'search_algorithms',
  description: 'Search the geometry and optimization algorithm library.',
  parameters: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'e.g. Geometry, Spatial, Optimization, Collision' },
    },
  },
  sideEffect: 'none',
  version: '1.0.0',
  handler: async (args) => {
    const where = args.category ? { category: String(args.category) } : undefined;
    const items = await prisma.algorithm.findMany({ where, orderBy: { name: 'asc' } });
    return items.map(serializeAlgorithm);
  },
});
