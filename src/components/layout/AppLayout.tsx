'use client';

import { useState } from 'react';
import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-full overflow-hidden bg-background/80 flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={cn(
          'flex-1 flex flex-col h-screen min-w-0 transition-all duration-200',
          'ml-0',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <Header
          user={user}
          onMenuClick={() => setMobileSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 min-h-0 overflow-hidden pt-16 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 lg:p-4.5 max-w-7xl mx-auto w-full overflow-y-auto no-scrollbar">{children}</div>
        </main>
      </div>

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Sidebar
              collapsed={false}
              isMobile={true}
              onCloseMobile={() => setMobileSidebarOpen(false)}
              onToggleCollapse={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
