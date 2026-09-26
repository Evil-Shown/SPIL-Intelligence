import type { ToolDef } from './types.js';

const tools = new Map<string, ToolDef>();
const REGISTRY_VERSION = '1.0.0';

export function register(def: ToolDef): void {
  if (tools.has(def.name)) {
    throw new Error(`Tool "${def.name}" is already registered`);
  }
  tools.set(def.name, def);
}

export function get(name: string): ToolDef | undefined {
  return tools.get(name);
}

export function getVersion(): string {
  return REGISTRY_VERSION;
}

export function allNames(): string[] {
  return [...tools.keys()];
}

/** Single source of truth: generates Anthropic tool definitions from the registry. */
export function toClaudeTools(): Array<{
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}> {
  return [...tools.values()].map((def) => ({
    name: def.name,
    description: def.description,
    input_schema: { type: 'object', ...def.parameters },
  }));
}
