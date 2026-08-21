import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <Sidebar />
      <div className="ml-[232px] pt-[52px]">
        <main className="px-7 py-6 max-w-[1240px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
