export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
export type ResearchStatus = 'IDEA' | 'EXPERIMENTING' | 'ANALYZING' | 'CONCLUDED' | 'ARCHIVED';
export type DecisionStatus = 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED' | 'UNDER_REVIEW';
export type IdeaStatus = 'BACKLOG' | 'EVALUATING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type BugStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WONT_FIX';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MessageRole = 'USER' | 'ASSISTANT';

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  progress: number;
  team: string;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
  bugCount?: number;
  _count?: {
    tasks: number;
    bugs: number;
    research: number;
    decisions: number;
  };
  tasks?: Task[];
  bugs?: Bug[];
  research?: Research[];
  decisions?: Decision[];
  documents?: Document[];
}

export interface Research {
  id: string;
  title: string;
  problem?: string | null;
  hypothesis?: string | null;
  experiment?: string | null;
  results?: string | null;
  conclusion?: string | null;
  nextSteps?: string | null;
  status: ResearchStatus;
  tags: string[];
  projectId?: string | null;
  project?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Decision {
  id: string;
  number: number;
  title: string;
  context?: string | null;
  decision: string;
  reason?: string | null;
  rejected?: string | null;
  status: DecisionStatus;
  affectedModules: string[];
  projectId?: string | null;
  project?: { id: string; name: string };
  createdAt: string;
}

export interface Algorithm {
  id: string;
  name: string;
  category: string;
  complexity?: string | null;
  description?: string | null;
  implementation?: string | null;
  usedIn: string[];
  alternatives?: string | null;
  codeRef?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description?: string | null;
  rating: number;
  priority: Priority;
  status: IdeaStatus;
  tags: string[];
  projectId?: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  assignee?: string | null;
  dueDate?: string | null;
  module?: string | null;
  projectId?: string | null;
  project?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Bug {
  id: string;
  title: string;
  description?: string | null;
  severity: Severity;
  status: BugStatus;
  module?: string | null;
  resolution?: string | null;
  assignee?: string | null;
  projectId?: string | null;
  project?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  tags: string[];
  projectId?: string | null;
  project?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  conversationId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title?: string | null;
  context?: string | null;
  projectId?: string | null;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  activeProjects: number;
  openTasks: number;
  overdueTasks: number;
  researchItems: number;
  activeResearch: number;
  ideas: number;
  avgIdeaRating: number;
  recentProject: Project | null;
  sparklines: {
    projects: number[];
    tasks: number[];
    research: number[];
    ideas: number[];
  };
}

export interface ActivityItem {
  id: string;
  type: 'task' | 'research' | 'decision' | 'bug';
  action: string;
  entity: string;
  module: string;
  timestamp: string;
}
