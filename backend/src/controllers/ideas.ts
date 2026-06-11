import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getParam } from '../lib/params.js';
import { toJsonArray } from '../lib/json.js';
import { serializeIdea } from '../services/serialize.js';

export async function getIdeas(_req: Request, res: Response): Promise<void> {
  const items = await prisma.idea.findMany({ orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }] });
  res.json(items.map(serializeIdea));
}

export async function createIdea(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const tags = Array.isArray(body.tags) ? (body.tags as string[]) : [];
  const item = await prisma.idea.create({
    data: {
      title: body.title as string,
      description: body.description as string | undefined,
      rating: body.rating as number | undefined,
      priority: body.priority as 'HIGH' | undefined,
      status: body.status as 'BACKLOG' | undefined,
      tags: toJsonArray(tags),
    },
  });
  res.status(201).json(serializeIdea(item));
}

export async function updateIdea(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = { ...body };
  if (Array.isArray(body.tags)) {
    data.tags = toJsonArray(body.tags as string[]);
  }
  const item = await prisma.idea.update({ where: { id: getParam(req, 'id') }, data });
  res.json(serializeIdea(item));
}

export async function promoteIdea(req: Request, res: Response): Promise<void> {
  const idea = await prisma.idea.findUnique({ where: { id: getParam(req, 'id') } });
  if (!idea) {
    res.status(404).json({ error: 'Not Found', message: 'Idea not found' });
    return;
  }

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

  res.status(201).json(project);
}
