import { prisma } from '../lib/prisma.js';

interface AuditEntry {
  tool: string;
  sideEffect: string;
  argsJson: string;
  status: string;
  refusalReason?: string;
  actorId: string;
  modelTurn?: string;
  conversationId?: string;
  registryVersion: string;
}

export async function append(entry: AuditEntry) {
  return prisma.toolExecution.create({
    data: {
      tool: entry.tool,
      sideEffect: entry.sideEffect,
      argsJson: entry.argsJson,
      status: entry.status,
      refusalReason: entry.refusalReason ?? null,
      modelTurn: entry.modelTurn ?? null,
      actorId: entry.actorId,
      registryVersion: entry.registryVersion,
      conversationId: entry.conversationId ?? null,
    },
  });
}

/** ONLY allowed update on this table: completing an in-flight execution with its result. */
export async function finish(seq: number, result: unknown) {
  await prisma.toolExecution.update({
    where: { seq },
    data: { resultJson: JSON.stringify(result) },
  });
}

/** ONLY other allowed update: marking an in-flight execution as failed. */
export async function fail(seq: number, error: unknown) {
  await prisma.toolExecution.update({
    where: { seq },
    data: {
      status: 'failed',
      resultJson: null,
      refusalReason: error instanceof Error ? error.message : String(error),
    },
  });
}

/** Count executions by class within a time window, for the status endpoint. */
export async function countSince(since: Date) {
  const [executed, refused] = await Promise.all([
    prisma.toolExecution.count({
      where: { sideEffect: 'compensable', status: 'executed', occurredAt: { gte: since } },
    }),
    prisma.toolExecution.count({
      where: { sideEffect: 'critical', status: 'refused', occurredAt: { gte: since } },
    }),
  ]);
  return { executed, refused };
}
