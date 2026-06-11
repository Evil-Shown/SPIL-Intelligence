import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getParam } from '../lib/params.js';
import { serializeDocument } from '../services/serialize.js';

export async function getDocuments(req: Request, res: Response): Promise<void> {
  const projectId = req.query.projectId as string | undefined;
  const items = await prisma.document.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: { project: { select: { id: true, name: true } } },
  });
  res.json(items.map(serializeDocument));
}

export async function getDocument(req: Request, res: Response): Promise<void> {
  const item = await prisma.document.findUnique({
    where: { id: getParam(req, 'id') },
    include: { project: { select: { id: true, name: true } } },
  });
  if (!item) {
    res.status(404).json({ error: 'Not Found', message: 'Document not found' });
    return;
  }
  res.json(serializeDocument(item));
}

export async function createDocument(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const item = await prisma.document.create({
    data: {
      title: body.title as string,
      content: body.content as string,
      tags: JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
      projectId: body.projectId as string | undefined,
    },
  });
  res.status(201).json(serializeDocument(item));
}

export async function updateDocument(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = { ...body };
  if (Array.isArray(body.tags)) {
    data.tags = JSON.stringify(body.tags);
  }
  const item = await prisma.document.update({ where: { id: getParam(req, 'id') }, data });
  res.json(serializeDocument(item));
}
