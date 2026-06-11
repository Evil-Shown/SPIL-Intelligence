import type { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma.js';
import { getParam } from '../lib/params.js';
import { parseJsonArray } from '../lib/json.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function buildContext(projectId?: string): Promise<string> {
  if (!projectId) return 'No project context loaded.';

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      decisions: { orderBy: { number: 'desc' }, take: 5 },
      tasks: { where: { status: { in: ['TODO', 'IN_PROGRESS'] } }, take: 10 },
      research: { orderBy: { updatedAt: 'desc' }, take: 5 },
    },
  });

  if (!project) return 'Project not found.';

  const algorithms = await prisma.algorithm.findMany({ take: 10 });

  const decisionsText = project.decisions
    .map((d) => `ADR-${d.number}: ${d.title} (${d.status}) — ${d.decision}`)
    .join('\n');

  const tasksText = project.tasks.map((t) => `- [${t.priority}] ${t.title} (${t.status})`).join('\n');

  const researchText = project.research.map((r) => `- ${r.title} (${r.status})`).join('\n');

  const algorithmsText = algorithms.map((a) => `- ${a.name} (${a.category})`).join('\n');

  return `
Project: ${project.name}
Description: ${project.description ?? 'N/A'}
Status: ${project.status} | Progress: ${project.progress}%

Recent Decisions:
${decisionsText || 'None'}

Open Tasks:
${tasksText || 'None'}

Research:
${researchText || 'None'}

Algorithms:
${algorithmsText || 'None'}
`.trim();
}

function buildSystemPrompt(context: string, projectName?: string): string {
  return `You are SPIL Intelligence, the AI assistant for SPIL Labs — a software company that builds glass-cutting ERP systems, optimization tools, and R&D solutions.

Current context: ${projectName ?? 'General'}
Loaded knowledge:
${context}

You have deep knowledge of:
- Glass cutting industry manufacturing processes
- Geometric algorithms (polygon boolean, nesting, arc fitting, offset)
- The GSAP platform (Glass Shape Automation Platform)
- shapes-core (Java geometry library)
- shapes-service (Spring Boot REST API)
- Opti-Shapes (React frontend)

Answer with engineering precision. When referencing code, be specific about class names and methods. When referencing decisions, cite the ADR number.`;
}

export async function chat(req: Request, res: Response): Promise<void> {
  const { message, conversationId, projectId } = req.body as {
    message?: string;
    conversationId?: string;
    projectId?: string;
  };

  if (!message) {
    res.status(400).json({ error: 'Bad Request', message: 'Message is required' });
    return;
  }

  let conversation = conversationId
    ? await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    : null;

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        title: message.slice(0, 60),
        projectId,
        messages: { create: { role: 'USER', content: message } },
      },
      include: { messages: true },
    });
  } else {
    await prisma.message.create({
      data: { role: 'USER', content: message, conversationId: conversation.id },
    });
  }

  const project = projectId
    ? await prisma.project.findUnique({ where: { id: projectId } })
    : null;

  const context = await buildContext(projectId);
  const systemPrompt = buildSystemPrompt(context, project?.name);

  const history = conversation.messages.map((m) => ({
    role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
    content: m.content,
  }));

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';

  try {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-key-here') {
      const fallback =
        `I'm SPIL Intelligence. I can help with geometry algorithms, project decisions, and engineering tasks.\n\n` +
        `**Note:** Set ANTHROPIC_API_KEY in backend/.env to enable live AI responses.\n\n` +
        `Regarding your question: "${message}"\n\n` +
        `Based on loaded context for **${project?.name ?? 'SPIL Opti'}**, I recommend reviewing the relevant ADRs and shapes-core documentation for implementation details.`;

      for (const word of fallback.split(' ')) {
        fullResponse += word + ' ';
        res.write(`data: ${JSON.stringify({ type: 'delta', text: word + ' ' })}\n\n`);
        await new Promise((r) => setTimeout(r, 20));
      }
    } else {
      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [...history, { role: 'user', content: message }],
      });

      stream.on('text', (text) => {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`);
      });

      await stream.finalMessage();
    }

    await prisma.message.create({
      data: {
        role: 'ASSISTANT',
        content: fullResponse.trim(),
        conversationId: conversation.id,
      },
    });

    res.write(
      `data: ${JSON.stringify({ type: 'done', conversationId: conversation.id })}\n\n`
    );
    res.end();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`);
    res.end();
  }
}

export async function getConversations(_req: Request, res: Response): Promise<void> {
  const items = await prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
  });
  res.json(items);
}

export async function getConversation(req: Request, res: Response): Promise<void> {
  const item = await prisma.conversation.findUnique({
    where: { id: getParam(req, 'id') },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!item) {
    res.status(404).json({ error: 'Not Found', message: 'Conversation not found' });
    return;
  }
  res.json(item);
}

export async function createConversation(req: Request, res: Response): Promise<void> {
  const { title, projectId } = req.body as { title?: string; projectId?: string };
  const item = await prisma.conversation.create({
    data: { title, projectId, context: projectId ? await buildContext(projectId) : undefined },
  });
  res.status(201).json(item);
}

export async function deleteConversation(req: Request, res: Response): Promise<void> {
  await prisma.conversation.delete({ where: { id: getParam(req, 'id') } });
  res.status(204).send();
}
