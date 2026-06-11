import { Outlet } from 'react-router-dom';
import { NeuralCanvas } from '../modules/NeuralCanvas';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PageWrapper } from './PageWrapper';

export function AppLayout() {
  return (
    <div className="relative min-h-screen bg-base">
      <NeuralCanvas />
      {/* Grid dot overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--graph-grid) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <Sidebar />
      <PageWrapper>
        <TopBar />
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </PageWrapper>
    </div>
  );
}
