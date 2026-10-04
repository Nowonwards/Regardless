'use client';

import {
  Bell,
  Menu,
  Search,
  X,
  CheckCheck,
  Rocket,
  AlertTriangle,
  CalendarDays,
  Info,
  Check,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  platform: string | null;
  postId: string | null;
  read: boolean;
  createdAt: string;
}

interface HeaderProps {
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function Header({ onMenuClick, sidebarCollapsed }: HeaderProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      handleMarkAsRead(item.id);
    }
    setPopoverOpen(false);
    if (item.type === 'POST_PUBLISHED') {
      router.push('/history');
    } else if (item.type === 'POST_SCHEDULED') {
      router.push('/calendar');
    } else {
      router.push('/drafts');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'POST_PUBLISHED':
        return (
          <div className="p-1.5 rounded-none border border-border bg-foreground text-background shrink-0">
            <Rocket className="h-4 w-4" />
          </div>
        );
      case 'POST_FAILED':
        return (
          <div className="p-1.5 rounded-none border border-border bg-destructive text-destructive-foreground shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
        );
      case 'POST_SCHEDULED':
        return (
          <div className="p-1.5 rounded-none border border-border bg-primary text-primary-foreground shrink-0">
            <CalendarDays className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="p-1.5 rounded-none border border-border bg-muted text-foreground shrink-0">
            <Info className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-background border-b border-border transition-all duration-100 left-0',
        sidebarCollapsed ? 'lg:left-16' : 'lg:left-64'
      )}
    >
      <div className="flex items-center justify-between h-full px-4 sm:px-6 gap-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden rounded-none border border-border bg-card"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>

          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-9.5 w-72 max-w-full items-center gap-2.5 rounded-none border border-border bg-card px-3 text-xs font-mono text-muted-foreground transition-none hover:border-accent hover:text-foreground whitespace-nowrap overflow-hidden"
              aria-label="Search (press / to focus)"
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate flex-1 text-left min-w-0">Search drafts, ideas, posts</span>
              <kbd className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded-none ml-auto">
                <span className="text-[11px]">⌘</span>
                <span>K</span>
              </kbd>
            </button>
          </div>

          {searchOpen && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-none border border-border bg-card p-2 sm:left-4 sm:right-auto sm:w-96 shadow-[4px_4px_0_0_var(--border)] animate-in slide-in-from-top-2 duration-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search drafts, ideas, posts"
                  className="w-full pl-10 pr-8 h-9 text-xs font-mono truncate whitespace-nowrap"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setSearchOpen(false);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="pt-2 border-t border-border mt-2">
                <p className="px-2 text-xs font-mono text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border rounded-none">Esc</kbd> to exit
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Notifications Popover */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative rounded-none border border-border bg-card hover:bg-muted shadow-none active:translate-x-0 active:translate-y-0"
                aria-label="View notifications"
              >
                <Bell className="h-4 w-4 text-foreground" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-none bg-primary text-[10px] font-mono font-bold text-primary-foreground border border-border">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-88 sm:w-96 p-0 rounded-none border border-border bg-card shadow-[6px_6px_0_0_var(--border)]" align="end">
              <div className="p-3.5 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm uppercase font-mono tracking-wider">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="default" className="text-[10px] h-5 px-1.5 font-mono font-bold">
                      {unreadCount} NEW
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 font-mono uppercase"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </Button>
                )}
              </div>

              <ScrollArea className="max-h-[380px] divide-y-2 divide-border">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-none border border-border bg-muted flex items-center justify-center text-muted-foreground">
                      <Bell className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold uppercase font-mono text-foreground">No notifications yet</p>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      You will receive notifications whenever a post publishes, schedules, or requires attention.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-border">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={cn(
                          'p-3.5 flex items-start gap-3 cursor-pointer hover:bg-muted relative group transition-none',
                          !item.read && 'bg-muted/40'
                        )}
                      >
                        {getNotificationIcon(item.type)}

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className={cn('text-xs line-clamp-1', !item.read ? 'font-bold text-foreground font-sans' : 'font-medium text-foreground/80 font-sans')}>
                              {item.title}
                            </p>
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0 font-medium">
                              {formatTimeAgo(item.createdAt)}
                            </span>
                          </div>

                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>

                          {item.platform && (
                            <div className="pt-0.5">
                              <Badge variant="outline" className="text-[9px] h-4 uppercase font-bold px-1.5 py-0 tracking-wider">
                                {item.platform}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {!item.read && (
                          <div className="flex flex-col items-center justify-center gap-1 shrink-0 self-center">
                            <span className="h-2 w-2 rounded-none bg-primary border border-border" />
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(item.id, e)}
                              title="Mark as read"
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-0.5 rounded-none"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Clerk Auth Controls */}
          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="rounded-none border border-border text-xs font-mono font-bold">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="rounded-none bg-primary text-primary-foreground border border-border text-xs font-mono font-bold hover:opacity-90">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          </Show>
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8 rounded-none border border-border shadow-[2px_2px_0_0_var(--border)]',
                },
              }}
            />
          </Show>
        </div>
      </div>
    </header>
  );
}
