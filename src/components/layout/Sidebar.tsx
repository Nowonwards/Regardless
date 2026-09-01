import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  FileText,
  Calendar,
  Kanban,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { RegardlessMark } from '@/components/icons/RegardlessMark';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/ideas', label: 'Ideas', icon: Sparkles },
  { href: '/drafts', label: 'Drafts', icon: FileText },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
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
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-background/80 backdrop-blur-xl border-r transition-all duration-200 flex flex-col',
        isMobile ? 'w-64 z-50 shadow-2xl' : collapsed ? 'w-16 hidden lg:flex' : 'w-64 hidden lg:flex'
      )}
    >
      <div className={cn('flex items-center h-16 px-4 border-b border-border/60', collapsed && !isMobile ? 'justify-center' : 'justify-between')}>
        {!collapsed || isMobile ? (
          <Link href="/" className="flex min-w-0 items-center gap-2.5 group" aria-label="Regardless home">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform" aria-hidden="true">
              <RegardlessMark size={20} className="text-primary-foreground" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base tracking-tight truncate text-foreground">Regardless</span>
            </div>
          </Link>
        ) : (
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs hover:scale-105 transition-transform" aria-label="Regardless home">
            <RegardlessMark size={20} className="text-primary-foreground" aria-hidden="true" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={isMobile ? onCloseMobile : onToggleCollapse}
          className={cn('h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground', collapsed && !isMobile && 'absolute -right-4 top-4 h-8 w-8 rounded-full border bg-background shadow-md')}
          aria-label={isMobile ? 'Close sidebar' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isMobile ? <ChevronLeft className="h-4 w-4" /> : collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onCloseMobile : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/15 font-semibold shadow-sm'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                collapsed && !isMobile && 'justify-center px-2.5'
              )}
              title={collapsed && !isMobile ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn('h-4.5 w-4.5 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" aria-hidden="true" />
              )}
              {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/60 bg-muted/10">
        {!collapsed && (
          <div className="space-y-2">
            <p className="px-1 text-[11px] font-medium tracking-wider uppercase text-muted-foreground/70">Appearance</p>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1 border border-border/40">
              <Button
                variant={isDark ? 'secondary' : 'ghost'}
                size="sm"
                className={cn('h-7 text-xs rounded-lg shadow-none font-medium', isDark && 'bg-background shadow-xs text-foreground')}
                onClick={() => setTheme('dark')}
                aria-pressed={isDark}
              >
                <Moon className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                <span>Dark</span>
              </Button>
              <Button
                variant={!isDark ? 'secondary' : 'ghost'}
                size="sm"
                className={cn('h-7 text-xs rounded-lg shadow-none font-medium', !isDark && 'bg-background shadow-xs text-foreground')}
                onClick={() => setTheme('light')}
                aria-pressed={!isDark}
              >
                <Sun className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                <span>Light</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
