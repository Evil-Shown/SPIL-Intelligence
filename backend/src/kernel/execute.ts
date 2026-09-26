import * as registry from './registry.js';
import * as audit from './audit.js';
import type { ExecutionContext, ExecutionResult, TurnClass } from './types.js';

function deriveClass(sideEffect: string, status: string): TurnClass {
  if (status === 'refused' && sideEffect === 'critical') return 'door';
  if (status === 'executed' && (sideEffect === 'compensable' || sideEffect === 'screen'))
    return 'executed';
  return 'read';
}

export async function execute(
  name: string,
  args: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<ExecutionResult> {
  const def = registry.get(name);

  if (!def) {
    await audit.append({
      tool: name,
      sideEffect: 'none',
      argsJson: JSON.stringify(args),
      status: 'refused',
      refusalReason: `unknown tool: ${name}`,
      actorId: ctx.actorId,
      modelTurn: ctx.modelTurn,
      conversationId: ctx.conversationId,
      registryVersion: registry.getVersion(),
    });
    return { status: 'refused', refusalReason: `unknown tool: ${name}`, class: 'read' };
  }

  // Critical class — gated refusal until proposal flow exists
  if (def.sideEffect === 'critical') {
    const reason = `${name}: requires proposal flow. not built yet.`;
    await audit.append({
      tool: name,
      sideEffect: 'critical',
      argsJson: JSON.stringify(args),
      status: 'refused',
      refusalReason: reason,
      actorId: ctx.actorId,
      modelTurn: ctx.modelTurn,
      conversationId: ctx.conversationId,
      registryVersion: registry.getVersion(),
    });
    return { status: 'refused', refusalReason: reason, class: 'door' };
  }

  // Execute through the one front door
  const row = await audit.append({
    tool: name,
    sideEffect: def.sideEffect,
    argsJson: JSON.stringify(args),
    status: 'executed',
    actorId: ctx.actorId,
    modelTurn: ctx.modelTurn,
    conversationId: ctx.conversationId,
    registryVersion: registry.getVersion(),
  });

  try {
    const result = await def.handler(args);
    await audit.finish(row.seq, result);
    return {
      status: 'executed',
      result,
      class: deriveClass(def.sideEffect, 'executed'),
    };
  } catch (err) {
    await audit.fail(row.seq, err);
    return {
      status: 'failed',
      refusalReason: err instanceof Error ? err.message : String(err),
      class: 'read',
    };
  }
}
