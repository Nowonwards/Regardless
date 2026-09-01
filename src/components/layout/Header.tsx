'use client';

import {
  Bell,
  User,
  LogOut,
  Menu,
  Search,
  X,
  Settings as SettingsIcon,
  CheckCheck,
  Rocket,
  AlertTriangle,
  Calendar as CalendarIcon,
  Info,
  Check,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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

export function Header({ user, onMenuClick, sidebarCollapsed }: HeaderProps) {
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
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Rocket className="h-4 w-4" />
          </div>
        );
      case 'POST_FAILED':
        return (
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
        );
      case 'POST_SCHEDULED':
        return (
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <CalendarIcon className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Info className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border/60 transition-all duration-200 left-0',
        sidebarCollapsed ? 'lg:left-16' : 'lg:left-64'
      )}
    >
      <div className="flex items-center justify-between h-full px-4 sm:px-6 gap-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden rounded-xl"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>

          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-9.5 w-72 items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 pl-10 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/60 hover:text-foreground hover:shadow-xs"
              aria-label="Search (press / to focus)"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Search drafts, ideas, posts...</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70 bg-background/80 border border-border/60 rounded-md ml-auto mr-2.5 shadow-2xs">
                <span className="text-[11px]">⌘</span>
                <span>K</span>
              </kbd>
            </button>
          </div>

          {searchOpen && (
            <div className="absolute left-3 right-3 top-full z-50 mt-2 rounded-md border bg-popover p-2 shadow-lg sm:left-4 sm:right-auto sm:w-96 animate-in slide-in-from-top-2 duration-150">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search drafts, ideas, posts..."
                  className="w-full pl-10 h-9 text-sm"
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
              <div className="pt-2 border-t mt-2">
                <p className="px-2 text-xs text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">Esc</kbd> to exit
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications Popover */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl hover:bg-muted/60 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-50 duration-200">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-88 sm:w-96 p-0 rounded-2xl shadow-xl border-border/80" align="end">
              <div className="p-3.5 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-semibold bg-primary/10 text-primary">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-7 text-xs text-muted-foreground hover:text-primary gap-1 px-2"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </Button>
                )}
              </div>

              <ScrollArea className="max-h-[380px] divide-y divide-border/40">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Bell className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">No notifications yet</p>
                    <p className="text-[11px] text-muted-foreground">
                      You'll receive notifications whenever a post publishes, schedules, or requires attention.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={cn(
                          'p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-muted/40 relative group',
                          !item.read && 'bg-primary/5 dark:bg-primary/10'
                        )}
                      >
                        {getNotificationIcon(item.type)}

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className={cn('text-xs line-clamp-1', !item.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
                              {item.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-normal">
                              {formatTimeAgo(item.createdAt)}
                            </span>
                          </div>

                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>

                          {item.platform && (
                            <div className="pt-0.5">
                              <Badge variant="outline" className="text-[9px] h-4 uppercase font-semibold px-1.5 py-0 tracking-wider">
                                {item.platform}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {!item.read && (
                          <div className="flex flex-col items-center justify-center gap-1 shrink-0 self-center">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(item.id, e)}
                              title="Mark as read"
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity p-0.5 rounded"
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

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all"
                aria-label={user?.name || 'User menu'}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="px-3 py-2 border-b">
                <p className="font-semibold text-sm truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || 'user@regardless.app'}</p>
              </div>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <User className="h-4 w-4 mr-2" aria-hidden="true" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <SettingsIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                Platform Connections
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              >
                <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
