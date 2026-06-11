import { parseJsonArray } from '../lib/json.js';
import type {
  Algorithm,
  Bug,
  Decision,
  Document,
  Idea,
  Project,
  Research,
  Task,
  Conversation,
  Message,
} from '@prisma/client';

export function serializeProject(project: Project & {
  _count?: { tasks: number; bugs: number };
}) {
  return {
    ...project,
    taskCount: project._count?.tasks,
    bugCount: project._count?.bugs,
  };
}

export function serializeResearch(research: Research) {
  return { ...research, tags: parseJsonArray(research.tags) };
}

export function serializeDecision(decision: Decision) {
  return { ...decision, affectedModules: parseJsonArray(decision.affectedModules) };
}

export function serializeAlgorithm(algorithm: Algorithm) {
  return { ...algorithm, usedIn: parseJsonArray(algorithm.usedIn) };
}

export function serializeIdea(idea: Idea) {
  return { ...idea, tags: parseJsonArray(idea.tags) };
}

export function serializeDocument(doc: Document) {
  return { ...doc, tags: parseJsonArray(doc.tags) };
}

export function serializeTask(task: Task) {
  return task;
}

export function serializeBug(bug: Bug) {
  return bug;
}

export function serializeConversation(
  conversation: Conversation & { messages?: Message[] }
) {
  return conversation;
}
