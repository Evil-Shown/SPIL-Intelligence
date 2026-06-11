import { Router } from 'express';
import * as projects from '../controllers/projects.js';
import * as research from '../controllers/research.js';
import * as decisions from '../controllers/decisions.js';
import * as algorithms from '../controllers/algorithms.js';
import * as ideas from '../controllers/ideas.js';
import * as tasks from '../controllers/tasks.js';
import * as bugs from '../controllers/bugs.js';
import * as documents from '../controllers/documents.js';
import * as dashboard from '../controllers/dashboard.js';
import * as ai from '../controllers/ai.js';

const router = Router();

router.get('/projects', projects.getProjects);
router.post('/projects', projects.createProject);
router.get('/projects/:id', projects.getProject);
router.put('/projects/:id', projects.updateProject);
router.delete('/projects/:id', projects.deleteProject);
router.get('/projects/:id/research', research.getProjectResearch);
router.post('/projects/:id/research', research.createResearch);

router.get('/research', research.getAllResearch);
router.post('/research', research.createResearch);
router.put('/research/:id', research.updateResearch);

router.get('/decisions', decisions.getDecisions);
router.post('/decisions', decisions.createDecision);
router.put('/decisions/:id', decisions.updateDecision);

router.get('/algorithms', algorithms.getAlgorithms);
router.post('/algorithms', algorithms.createAlgorithm);
router.get('/algorithms/:id', algorithms.getAlgorithm);
router.put('/algorithms/:id', algorithms.updateAlgorithm);

router.get('/ideas', ideas.getIdeas);
router.post('/ideas', ideas.createIdea);
router.put('/ideas/:id', ideas.updateIdea);
router.post('/ideas/:id/promote', ideas.promoteIdea);

router.get('/tasks', tasks.getTasks);
router.post('/tasks', tasks.createTask);
router.put('/tasks/:id', tasks.updateTask);
router.patch('/tasks/:id/status', tasks.updateTaskStatus);

router.get('/bugs', bugs.getBugs);
router.post('/bugs', bugs.createBug);
router.put('/bugs/:id', bugs.updateBug);

router.get('/documents', documents.getDocuments);
router.get('/documents/:id', documents.getDocument);
router.post('/documents', documents.createDocument);
router.put('/documents/:id', documents.updateDocument);

router.get('/dashboard/stats', dashboard.getDashboardStats);
router.get('/dashboard/activity', dashboard.getDashboardActivity);

router.post('/ai/chat', ai.chat);
router.get('/ai/conversations', ai.getConversations);
router.post('/ai/conversations', ai.createConversation);
router.get('/ai/conversations/:id', ai.getConversation);
router.delete('/ai/conversations/:id', ai.deleteConversation);

export default router;
