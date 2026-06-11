import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getParam } from '../lib/params.js';
import { serializeTask } from '../services/serialize.js';

export async function getTasks(req: Request, res: Response): Promise<void> {
  const projectId = req.query.projectId as string | undefined;
  const items = await prisma.task.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: { project: { select: { id: true, name: true } } },
  });
  res.json(items.map(serializeTask));
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const item = await prisma.task.create({
    data: {
      title: body.title as string,
      description: body.description as string | undefined,
      status: body.status as 'TODO' | undefined,
      priority: body.priority as 'HIGH' | undefined,
      assignee: body.assignee as string | undefined,
      dueDate: body.dueDate ? new Date(body.dueDate as string) : undefined,
      module: body.module as string | undefined,
      projectId: body.projectId as string | undefined,
    },
  });
  res.status(201).json(serializeTask(item));
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = { ...body };
  if (body.dueDate) {
    data.dueDate = new Date(body.dueDate as string);
  }
  const item = await prisma.task.update({ where: { id: getParam(req, 'id') }, data });
  res.json(serializeTask(item));
}

export async function updateTaskStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body as { status: string };
  const item = await prisma.task.update({
    where: { id: getParam(req, 'id') },
    data: { status: status as 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' },
  });
  res.json(serializeTask(item));
}
