import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getParam } from '../lib/params.js';
import { toJsonArray } from '../lib/json.js';
import { serializeAlgorithm } from '../services/serialize.js';

export async function getAlgorithms(_req: Request, res: Response): Promise<void> {
  const items = await prisma.algorithm.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  res.json(items.map(serializeAlgorithm));
}

export async function getAlgorithm(req: Request, res: Response): Promise<void> {
  const item = await prisma.algorithm.findUnique({ where: { id: getParam(req, 'id') } });
  if (!item) {
    res.status(404).json({ error: 'Not Found', message: 'Algorithm not found' });
    return;
  }
  res.json(serializeAlgorithm(item));
}

export async function createAlgorithm(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const usedIn = Array.isArray(body.usedIn) ? (body.usedIn as string[]) : [];
  const item = await prisma.algorithm.create({
    data: {
      name: body.name as string,
      category: body.category as string,
      complexity: body.complexity as string | undefined,
      description: body.description as string | undefined,
      implementation: body.implementation as string | undefined,
      usedIn: toJsonArray(usedIn),
      alternatives: body.alternatives as string | undefined,
      codeRef: body.codeRef as string | undefined,
    },
  });
  res.status(201).json(serializeAlgorithm(item));
}

export async function updateAlgorithm(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = { ...body };
  if (Array.isArray(body.usedIn)) {
    data.usedIn = toJsonArray(body.usedIn as string[]);
  }
  const item = await prisma.algorithm.update({ where: { id: getParam(req, 'id') }, data });
  res.json(serializeAlgorithm(item));
}
