import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const [
    activeProjects,
    openTasks,
    overdueTasks,
    researchItems,
    activeResearch,
    ideas,
    avgRating,
    recentProject,
  ] = await Promise.all([
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS'] } } }),
    prisma.task.count({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.research.count(),
    prisma.research.count({
      where: { status: { in: ['EXPERIMENTING', 'ANALYZING'] } },
    }),
    prisma.idea.count(),
    prisma.idea.aggregate({ _avg: { rating: true } }),
    prisma.project.findFirst({ orderBy: { updatedAt: 'desc' } }),
  ]);

  res.json({
    activeProjects,
    openTasks,
    overdueTasks,
    researchItems,
    activeResearch,
    ideas,
    avgIdeaRating: avgRating._avg.rating ?? 0,
    recentProject,
    sparklines: {
      projects: [3, 4, 4, 5, 5, 6, activeProjects],
      tasks: [18, 20, 19, 22, 21, 24, openTasks],
      research: [8, 9, 10, 10, 11, 12, researchItems],
      ideas: [25, 27, 28, 29, 30, 30, ideas],
    },
  });
}

export async function getDashboardActivity(_req: Request, res: Response): Promise<void> {
  const [tasks, research, decisions, bugs] = await Promise.all([
    prisma.task.findMany({ orderBy: { updatedAt: 'desc' }, take: 3, include: { project: true } }),
    prisma.research.findMany({ orderBy: { updatedAt: 'desc' }, take: 2 }),
    prisma.decision.findMany({ orderBy: { createdAt: 'desc' }, take: 2 }),
    prisma.bug.findMany({ orderBy: { updatedAt: 'desc' }, take: 2 }),
  ]);

  const activities = [
    ...tasks.map((t) => ({
      id: t.id,
      type: 'task' as const,
      action: t.status === 'DONE' ? 'completed' : 'updated',
      entity: t.title,
      module: t.module ?? t.project?.name ?? 'general',
      timestamp: t.updatedAt,
    })),
    ...research.map((r) => ({
      id: r.id,
      type: 'research' as const,
      action: r.status === 'IDEA' ? 'new experiment' : 'updated',
      entity: r.title,
      module: 'R&D',
      timestamp: r.updatedAt,
    })),
    ...decisions.map((d) => ({
      id: d.id,
      type: 'decision' as const,
      action: d.status.toLowerCase().replace('_', ' '),
      entity: `ADR-${String(d.number).padStart(3, '0')}: ${d.title}`,
      module: 'decisions',
      timestamp: d.createdAt,
    })),
    ...bugs.map((b) => ({
      id: b.id,
      type: 'bug' as const,
      action: b.status === 'RESOLVED' ? 'resolved' : 'reported',
      entity: b.title,
      module: b.module ?? 'general',
      timestamp: b.updatedAt,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8);

  res.json(activities);
}
