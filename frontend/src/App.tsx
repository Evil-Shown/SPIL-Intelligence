import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { AppLayout } from './components/layout/AppLayout';
import { NeuralHomeLayout } from './components/layout/NeuralHomeLayout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Knowledge } from './pages/Knowledge';
import { ResearchPage } from './pages/Research';
import { Ideas } from './pages/Ideas';
import { Decisions } from './pages/Decisions';
import { Algorithms } from './pages/Algorithms';
import { Tasks } from './pages/Tasks';
import { Bugs } from './pages/Bugs';
import { Documents } from './pages/Documents';
import { AiAssistant } from './pages/AiAssistant';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route element={<NeuralHomeLayout />}>
              <Route index element={<Dashboard />} />
            </Route>
            <Route element={<AppLayout />}>
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="knowledge" element={<Knowledge />} />
              <Route path="research" element={<ResearchPage />} />
              <Route path="ideas" element={<Ideas />} />
              <Route path="decisions" element={<Decisions />} />
              <Route path="algorithms" element={<Algorithms />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="bugs" element={<Bugs />} />
              <Route path="documents" element={<Documents />} />
              <Route path="ai" element={<AiAssistant />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
