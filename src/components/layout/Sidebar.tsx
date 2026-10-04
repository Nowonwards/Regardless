'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Lightbulb,
  FileText,
  CalendarDays,
  Kanban,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/drafts', label: 'Drafts', icon: FileText },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ collapsed = false, onToggleCollapse, isMobile = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { setTheme, isDark } = useTheme();

  return (
    <aside
      data-sidebar="true"
      className={cn(
        'sidebar-component fixed left-0 top-0 z-40 h-screen bg-[#0B0B0C] text-[#F4F1EA] border-r border-border transition-all duration-100 flex flex-col',
        isMobile ? 'w-64 z-50' : collapsed ? 'w-16 hidden lg:flex' : 'w-64 hidden lg:flex'
      )}
    >
      {/* Sidebar Header with Logo */}
      <div className={cn('flex items-center h-16 px-3.5 border-b border-border bg-[#0B0B0C]', collapsed && !isMobile ? 'justify-center' : 'justify-between')}>
        <Link href="/" className="flex items-center gap-2 group py-1 text-[#F4F1EA]" aria-label="Regardless home">
          <Logo size={28} showWordmark={!collapsed || isMobile} className="text-[#F4F1EA]" wordmarkClassName="text-[#F4F1EA]" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={isMobile ? onCloseMobile : onToggleCollapse}
          className={cn(
            'h-7 w-7 shrink-0 text-[#F4F1EA]/70 hover:text-[#F4F1EA] rounded-none border border-transparent hover:border-border hover:bg-[#151517]',
            collapsed && !isMobile && 'absolute -right-3.5 top-4 h-7 w-7 rounded-none border border-border bg-[#0B0B0C] text-[#F4F1EA] shadow-none'
          )}
          aria-label={isMobile ? 'Close sidebar' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isMobile ? <ChevronLeft className="h-4 w-4" /> : collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onCloseMobile : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-none px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-none border',
                isActive
                  ? 'bg-primary text-[#0B0B0C] border-border shadow-[2px_2px_0_0_#F4F1EA]'
                  : 'text-[#F4F1EA]/80 hover:bg-[#151517] hover:text-[#F4F1EA] border-transparent hover:border-[#333338]',
                collapsed && !isMobile && 'justify-center px-2'
              )}
              title={collapsed && !isMobile ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#0B0B0C]' : 'text-[#F4F1EA]/70')} strokeWidth={2} aria-hidden="true" />
              {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Theme Toggle */}
      <div className="p-3 border-t border-border bg-[#0B0B0C]">
        {!collapsed ? (
          <div className="space-y-2">
            <p className="px-1 text-[10px] font-mono font-bold tracking-wider uppercase text-[#F4F1EA]/60">Appearance</p>
            <div className="grid grid-cols-2 gap-1 rounded-none bg-[#151517] p-1 border border-border">
              <button
                type="button"
                className={cn(
                  'h-7 text-xs rounded-none border font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-none',
                  isDark ? 'bg-primary text-[#0B0B0C] border-border' : 'bg-transparent text-[#F4F1EA]/70 border-transparent hover:text-[#F4F1EA]'
                )}
                onClick={() => setTheme('dark')}
                aria-pressed={isDark}
              >
                <Moon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                className={cn(
                  'h-7 text-xs rounded-none border font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-none',
                  !isDark ? 'bg-primary text-[#0B0B0C] border-border' : 'bg-transparent text-[#F4F1EA]/70 border-transparent hover:text-[#F4F1EA]'
                )}
                onClick={() => setTheme('light')}
                aria-pressed={!isDark}
              >
                <Sun className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                <span>Light</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              className="h-8 w-8 rounded-none border border-border bg-[#151517] flex items-center justify-center text-[#F4F1EA] hover:bg-primary hover:text-[#0B0B0C]"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
