import { register } from '../registry.js';
import { prisma } from '../../lib/prisma.js';
import { serializeTask } from '../../services/serialize.js';

// ── Read: search_tasks ───────────────────────────────────────
register({
  name: 'search_tasks',
  description: 'Search and list tasks. Filter optionally by projectId, status, or assignee.',
  parameters: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Filter by project ID' },
      status: {
        type: 'string',
        enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'],
        description: 'Filter by task status',
      },
      assignee: { type: 'string', description: 'Filter by assignee name' },
      limit: { type: 'number', description: 'Maximum number of tasks to return (default 20)' },
    },
  },
  sideEffect: 'none',
  version: '1.0.0',
  handler: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.projectId) where.projectId = args.projectId;
    if (args.status) where.status = args.status;
    if (args.assignee) where.assignee = { contains: String(args.assignee) };

    const items = await prisma.task.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: typeof args.limit === 'number' ? Math.min(args.limit, 50) : 20,
      include: { project: { select: { id: true, name: true } } },
    });
    return items.map(serializeTask);
  },
});

// ── Write: create_task ────────────────────────────────────────
register({
  name: 'create_task',
  description: 'Create a new engineering task. Reversible via soft-delete.',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Clear, concise task title' },
      description: { type: 'string', description: 'Detailed description or acceptance criteria' },
      priority: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        description: 'Task priority level',
      },
      status: {
        type: 'string',
        enum: ['TODO', 'IN_PROGRESS', 'DONE'],
        description: 'Initial task status (default: TODO)',
      },
      assignee: { type: 'string', description: 'Name of the team member assigned' },
      module: { type: 'string', description: 'Engineering module/component' },
      projectId: { type: 'string', description: 'Target project ID' },
    },
    required: ['title'],
  },
  sideEffect: 'compensable',
  version: '1.0.0',
  handler: async (args) => {
    const item = await prisma.task.create({
      data: {
        title: String(args.title),
        description: args.description ? String(args.description) : undefined,
        priority: (args.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') || 'MEDIUM',
        status: (args.status as 'TODO' | 'IN_PROGRESS' | 'DONE') || 'TODO',
        assignee: args.assignee ? String(args.assignee) : undefined,
        module: args.module ? String(args.module) : undefined,
        projectId: args.projectId ? String(args.projectId) : undefined,
      },
      include: { project: { select: { id: true, name: true } } },
    });
    return serializeTask(item);
  },
});

// ── Write: update_task ────────────────────────────────────────
register({
  name: 'update_task',
  description: 'Update properties of an existing task.',
  parameters: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Task ID to update' },
      title: { type: 'string', description: 'New task title' },
      description: { type: 'string', description: 'New description' },
      priority: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      },
      assignee: { type: 'string', description: 'New assignee' },
      module: { type: 'string', description: 'New module' },
    },
    required: ['id'],
  },
  sideEffect: 'compensable',
  version: '1.0.0',
  handler: async (args) => {
    const { id, ...data } = args;
    const existing = await prisma.task.findUnique({ where: { id: String(id) }, select: { firstTouchedAt: true } });
    const updateData: Record<string, unknown> = { ...data };
    if (existing && !existing.firstTouchedAt) {
      updateData.firstTouchedAt = new Date();
    }
    const item = await prisma.task.update({
      where: { id: String(id) },
      data: updateData,
      include: { project: { select: { id: true, name: true } } },
    });
    return serializeTask(item);
  },
});

// ── Write: update_task_status ─────────────────────────────────
register({
  name: 'update_task_status',
  description: 'Advance or change the status of a task.',
  parameters: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Task ID' },
      status: {
        type: 'string',
        enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'],
        description: 'New status for the task',
      },
    },
    required: ['id', 'status'],
  },
  sideEffect: 'compensable',
  version: '1.0.0',
  handler: async (args) => {
    const existing = await prisma.task.findUnique({ where: { id: String(args.id) }, select: { firstTouchedAt: true } });
    const updateData: Record<string, unknown> = {
      status: args.status as 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED',
    };
    if (existing && !existing.firstTouchedAt) {
      updateData.firstTouchedAt = new Date();
    }
    const item = await prisma.task.update({
      where: { id: String(args.id) },
      data: updateData,
      include: { project: { select: { id: true, name: true } } },
    });
    return serializeTask(item);
  },
});
