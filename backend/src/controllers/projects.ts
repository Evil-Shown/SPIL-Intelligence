import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getParam } from '../lib/params.js';
import { serializeProject } from '../services/serialize.js';

export async function getProjects(_req: Request, res: Response): Promise<void> {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { tasks: true, bugs: true } } },
  });
  res.json(projects.map(serializeProject));
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: getParam(req, 'id') },
    include: {
      _count: { select: { tasks: true, bugs: true, research: true, decisions: true } },
      tasks: { orderBy: { updatedAt: 'desc' }, take: 5 },
      bugs: { orderBy: { updatedAt: 'desc' }, take: 5 },
      research: { orderBy: { updatedAt: 'desc' }, take: 5 },
      decisions: { orderBy: { createdAt: 'desc' }, take: 5 },
      documents: { orderBy: { updatedAt: 'desc' } },
    },
  });
  if (!project) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found' });
    return;
  }
  res.json(serializeProject(project));
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const { name, description, status, progress, team } = req.body as {
    name?: string;
    description?: string;
    status?: string;
    progress?: number;
    team?: string;
  };
  if (!name) {
    res.status(400).json({ error: 'Bad Request', message: 'Name is required' });
    return;
  }
  const project = await prisma.project.create({
    data: { name, description, status, progress, team },
  });
  res.status(201).json(serializeProject(project));
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const project = await prisma.project.update({
    where: { id: getParam(req, 'id') },
    data: req.body,
  });
  res.json(serializeProject(project));
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  await prisma.project.delete({ where: { id: getParam(req, 'id') } });
  res.status(204).send();
}
