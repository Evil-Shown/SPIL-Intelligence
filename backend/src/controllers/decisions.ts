import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getParam } from '../lib/params.js';
import { toJsonArray } from '../lib/json.js';
import { serializeDecision } from '../services/serialize.js';

export async function getDecisions(req: Request, res: Response): Promise<void> {
  const status = req.query.status as string | undefined;
  const items = await prisma.decision.findMany({
    where: status ? { status } : undefined,
    orderBy: { number: 'desc' },
    include: { project: { select: { id: true, name: true } } },
  });
  res.json(items.map(serializeDecision));
}

export async function createDecision(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const affectedModules = Array.isArray(body.affectedModules)
    ? (body.affectedModules as string[])
    : [];

  const maxDecision = await prisma.decision.aggregate({ _max: { number: true } });
  const nextNumber = (maxDecision._max.number ?? 0) + 1;

  const item = await prisma.decision.create({
    data: {
      number: nextNumber,
      title: body.title as string,
      context: body.context as string | undefined,
      decision: body.decision as string,
      reason: body.reason as string | undefined,
      rejected: body.rejected as string | undefined,
      status: body.status as 'ACCEPTED' | undefined,
      affectedModules: toJsonArray(affectedModules),
      projectId: body.projectId as string | undefined,
    },
  });
  res.status(201).json(serializeDecision(item));
}

export async function updateDecision(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = { ...body };
  if (Array.isArray(body.affectedModules)) {
    data.affectedModules = toJsonArray(body.affectedModules as string[]);
  }
  const item = await prisma.decision.update({
    where: { id: getParam(req, 'id') },
    data,
  });
  res.json(serializeDecision(item));
}
