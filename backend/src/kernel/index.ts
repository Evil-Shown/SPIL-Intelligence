// ── Tool Registration Auto-Load ──────────────────────────────
// Importing each tool module triggers its top-level register() call.
// Tool handlers remain strictly module-private.
import './tools/tasks.js';
import './tools/bugs.js';
import './tools/decisions.js';
import './tools/deletes.js';
import './tools/knowledge.js';

// ── Canonical Single Front Door Export ─────────────────────────
export { execute } from './execute.js';
export { toClaudeTools, allNames, getVersion } from './registry.js';
export { countSince } from './audit.js';
export type { ExecutionContext, ExecutionResult, TurnClass, SideEffect } from './types.js';
