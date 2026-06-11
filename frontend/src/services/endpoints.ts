import { api } from './api';
import type {
  Project,
  Research,
  Decision,
  Algorithm,
  Idea,
  Task,
  Bug,
  Document,
  Conversation,
  DashboardStats,
  ActivityItem,
} from '../types';

export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
  activity: () => api.get<ActivityItem[]>('/dashboard/activity').then((r) => r.data),
};

export const projectsApi = {
  list: () => api.get<Project[]>('/projects').then((r) => r.data),
  get: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (data: Partial<Project>) => api.post<Project>('/projects', data).then((r) => r.data),
  update: (id: string, data: Partial<Project>) =>
    api.put<Project>(`/projects/${id}`, data).then((r) => r.data),
};

export const researchApi = {
  list: () => api.get<Research[]>('/research').then((r) => r.data),
  update: (id: string, data: Partial<Research>) =>
    api.put<Research>(`/research/${id}`, data).then((r) => r.data),
  create: (data: Partial<Research>) => api.post<Research>('/research', data).then((r) => r.data),
};

export const decisionsApi = {
  list: (status?: string) =>
    api.get<Decision[]>('/decisions', { params: status ? { status } : {} }).then((r) => r.data),
  create: (data: Partial<Decision>) => api.post<Decision>('/decisions', data).then((r) => r.data),
};

export const algorithmsApi = {
  list: () => api.get<Algorithm[]>('/algorithms').then((r) => r.data),
  get: (id: string) => api.get<Algorithm>(`/algorithms/${id}`).then((r) => r.data),
};

export const ideasApi = {
  list: () => api.get<Idea[]>('/ideas').then((r) => r.data),
  update: (id: string, data: Partial<Idea>) => api.put<Idea>(`/ideas/${id}`, data).then((r) => r.data),
  promote: (id: string) => api.post<Project>(`/ideas/${id}/promote`).then((r) => r.data),
};

export const tasksApi = {
  list: (projectId?: string) =>
    api.get<Task[]>('/tasks', { params: projectId ? { projectId } : {} }).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    api.patch<Task>(`/tasks/${id}/status`, { status }).then((r) => r.data),
  create: (data: Partial<Task>) => api.post<Task>('/tasks', data).then((r) => r.data),
};

export const bugsApi = {
  list: (projectId?: string) =>
    api.get<Bug[]>('/bugs', { params: projectId ? { projectId } : {} }).then((r) => r.data),
  update: (id: string, data: Partial<Bug>) => api.put<Bug>(`/bugs/${id}`, data).then((r) => r.data),
};

export const documentsApi = {
  list: (projectId?: string) =>
    api.get<Document[]>('/documents', { params: projectId ? { projectId } : {} }).then((r) => r.data),
  get: (id: string) => api.get<Document>(`/documents/${id}`).then((r) => r.data),
};

export const aiApi = {
  conversations: () => api.get<Conversation[]>('/ai/conversations').then((r) => r.data),
  getConversation: (id: string) =>
    api.get<Conversation>(`/ai/conversations/${id}`).then((r) => r.data),
  deleteConversation: (id: string) => api.delete(`/ai/conversations/${id}`),
};

export async function streamChat(
  message: string,
  options: { conversationId?: string; projectId?: string },
  onDelta: (text: string) => void,
  onDone: (conversationId: string) => void,
  onError: (error: string) => void
): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';
  const response = await fetch(`${API_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, ...options }),
  });

  if (!response.ok) {
    onError('Failed to connect to AI service');
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError('No response stream');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6)) as {
          type: string;
          text?: string;
          conversationId?: string;
          message?: string;
        };
        if (data.type === 'delta' && data.text) onDelta(data.text);
        if (data.type === 'done' && data.conversationId) onDone(data.conversationId);
        if (data.type === 'error' && data.message) onError(data.message);
      } catch {
        // skip malformed
      }
    }
  }
}
