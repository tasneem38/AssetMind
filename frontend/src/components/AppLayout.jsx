import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)] text-[var(--color-text-main)] font-sans">
      <Sidebar />
      <div className="ml-[240px] flex-1 flex flex-col min-h-screen">
        <Topbar />
        <div className="p-7 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
