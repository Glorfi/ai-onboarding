import { Outlet } from 'react-router';
import { SidebarWidget } from '@/widgets/sidebar';
import { SidebarProvider } from '@/shared/ui';

export function MainLayout() {
  return (
    <SidebarProvider>
      <SidebarWidget />
      {/* <div className="flex h-screen"> */}
        <main className=" flex flex-1 overflow-auto w-full">
          <Outlet />
        </main>
      {/* </div> */}
    </SidebarProvider>
  );
}
