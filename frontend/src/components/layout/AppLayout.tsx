import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PageWrapper } from './PageWrapper';

export function AppLayout() {
  return (
    <div className="relative min-h-screen bg-[#f7f7f7]">
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
