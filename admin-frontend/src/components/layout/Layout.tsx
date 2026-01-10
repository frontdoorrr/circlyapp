import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { Outlet, useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': '대시보드',
  '/reports': '신고 관리',
  '/users': '사용자 관리',
  '/circles': 'Circle 관리',
  '/notifications': '알림 관리',
};

export function Layout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || '';

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title={title} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
