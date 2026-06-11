import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getParam } from '../lib/params.js';
import { serializeBug } from '../services/serialize.js';

export async function getBugs(req: Request, res: Response): Promise<void> {
  const projectId = req.query.projectId as string | undefined;
  const items = await prisma.bug.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { project: { select: { id: true, name: true } } },
  });
  res.json(items.map(serializeBug));
}

export async function createBug(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const item = await prisma.bug.create({
    data: {
      title: body.title as string,
      description: body.description as string | undefined,
      severity: body.severity as 'HIGH' | undefined,
      status: body.status as 'OPEN' | undefined,
      module: body.module as string | undefined,
      resolution: body.resolution as string | undefined,
      assignee: body.assignee as string | undefined,
      projectId: body.projectId as string | undefined,
    },
  });
  res.status(201).json(serializeBug(item));
}

export async function updateBug(req: Request, res: Response): Promise<void> {
  const item = await prisma.bug.update({
    where: { id: getParam(req, 'id') },
    data: req.body,
  });
  res.json(serializeBug(item));
}
