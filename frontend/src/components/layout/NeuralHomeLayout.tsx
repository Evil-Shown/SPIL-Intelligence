import { Outlet } from 'react-router-dom';

export function NeuralHomeLayout() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-base">
      <Outlet />
    </div>
  );
}
