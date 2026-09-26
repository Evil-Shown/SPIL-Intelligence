export type SideEffect = 'none' | 'screen' | 'compensable' | 'critical';
export type ExecutionStatus = 'executed' | 'refused' | 'failed';
export type TurnClass = 'read' | 'proposal' | 'door' | 'executed';

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  sideEffect: SideEffect;
  version: string;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface ExecutionContext {
  actorId: string;
  conversationId?: string;
  modelTurn?: string;
}

export interface ExecutionResult {
  status: ExecutionStatus;
  result?: unknown;
  refusalReason?: string;
  class: TurnClass;
}
