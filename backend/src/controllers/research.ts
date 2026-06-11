import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getParam } from '../lib/params.js';
import { toJsonArray } from '../lib/json.js';
import { serializeResearch } from '../services/serialize.js';

export async function getAllResearch(_req: Request, res: Response): Promise<void> {
  const items = await prisma.research.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { project: { select: { id: true, name: true } } },
  });
  res.json(items.map(serializeResearch));
}

export async function getProjectResearch(req: Request, res: Response): Promise<void> {
  const items = await prisma.research.findMany({
    where: { projectId: getParam(req, 'id') },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(items.map(serializeResearch));
}

export async function createResearch(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const tags = Array.isArray(body.tags) ? (body.tags as string[]) : [];
  const routeProjectId = getParam(req, 'id');
  const projectId = routeProjectId || (body.projectId as string | undefined);

  const item = await prisma.research.create({
    data: {
      title: body.title as string,
      problem: body.problem as string | undefined,
      hypothesis: body.hypothesis as string | undefined,
      experiment: body.experiment as string | undefined,
      results: body.results as string | undefined,
      conclusion: body.conclusion as string | undefined,
      nextSteps: body.nextSteps as string | undefined,
      status: body.status as 'IDEA' | undefined,
      tags: toJsonArray(tags),
      projectId,
    },
  });
  res.status(201).json(serializeResearch(item));
}

export async function updateResearch(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = { ...body };
  if (Array.isArray(body.tags)) {
    data.tags = toJsonArray(body.tags as string[]);
  }
  const item = await prisma.research.update({
    where: { id: getParam(req, 'id') },
    data,
  });
  res.json(serializeResearch(item));
}
