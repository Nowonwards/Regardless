'use client';

import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Camera,
  Pin,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  SlidersHorizontal,
  Send,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { SlideOver } from '@/components/ui/slide-over';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Platform, PostWithRelations, PostStatus } from '@/types';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfDay,
  addDays,
  isToday,
  isWeekend,
  isBefore,
} from 'date-fns';

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

interface CalendarViewProps {
  posts: PostWithRelations[];
  onPostClick: (post: PostWithRelations) => void;
  onCreatePost: (date: Date, platform?: Platform) => void;
}

const PLATFORM_CONFIG: Record<Platform, { name: string; borderAccent: string; pillClass: string; icon: React.ReactNode }> = {
  INSTAGRAM: {
    name: 'Instagram',
    borderAccent: 'border-l-[hsl(var(--instagram))]',
    pillClass: 'badge-instagram',
    icon: <Camera className="h-3 w-3" />,
  },
  PINTEREST: {
    name: 'Pinterest',
    borderAccent: 'border-l-[hsl(var(--pinterest))]',
    pillClass: 'badge-pinterest',
    icon: <Pin className="h-3 w-3" />,
  },
  LINKEDIN: {
    name: 'LinkedIn',
    borderAccent: 'border-l-[hsl(var(--linkedin))]',
    pillClass: 'badge-linkedin',
    icon: <Briefcase className="h-3 w-3" />,
  },
};

const STATUS_BADGES: Record<PostStatus, { label: string; className: string }> = {
  IDEA: { label: 'Idea', className: 'badge-idea' },
  SELECTED: { label: 'Selected', className: 'badge-selected' },
  DRAFTED: { label: 'Drafted', className: 'badge-drafted' },
  IN_REVISION: { label: 'In Revision', className: 'badge-in_revision' },
  APPROVED: { label: 'Approved', className: 'badge-approved' },
  SCHEDULED: { label: 'Scheduled', className: 'badge-scheduled' },
  POSTED: { label: 'Published', className: 'badge-posted' },
  FAILED: { label: 'Failed', className: 'badge-failed' },
};

export function CalendarView({ posts, onPostClick, onCreatePost }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('week');
  const [inspectingPost, setInspectingPost] = useState<PostWithRelations | null>(null);

  const isPastDate = (day: Date) => {
    return isBefore(startOfDay(day), startOfDay(new Date()));
  };

  const getVisibleDays = () => {
    switch (viewType) {
      case 'day':
        return [currentDate];
      case 'week': {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
      }
      case 'month': {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
      }
      case 'agenda':
        return [];
    }
  };

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      switch (viewType) {
        case 'day':
          return addDays(prev, direction === 'next' ? 1 : -1);
        case 'week':
          return addDays(prev, direction === 'next' ? 7 : -7);
        case 'month':
          return addDays(prev, direction === 'next' ? 30 : -30);
        case 'agenda':
          return prev;
      }
    });
  };

  const visibleDays = getVisibleDays();
  const postsByDay = useMemo(() => {
    const map = new Map<string, PostWithRelations[]>();
    posts.forEach((post) => {
      const rawDate = post.publishedAt || post.scheduledAt || (post.status === 'POSTED' ? post.updatedAt : null);
      if (!rawDate) return;
      const key = new Date(rawDate).toISOString().split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    });
    return map;
  }, [posts]);

  const agendaPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const aTime = new Date(a.publishedAt || a.scheduledAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.publishedAt || b.scheduledAt || b.updatedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [posts]);

  return (
    <div className="h-full flex flex-col space-y-2.5 min-h-0">
      {/* Calendar Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-2 shrink-0">
        {/* Navigation & Date Label */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="h-7 text-xs rounded-none font-mono font-medium px-2.5 border border-border"
          >
            Today
          </Button>

          <div className="flex items-center rounded-none border border-border bg-card p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-none"
              onClick={() => navigate('prev')}
              aria-label="Previous period"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-none"
              onClick={() => navigate('next')}
              aria-label="Next period"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2 py-1 rounded-none hover:bg-surface transition-colors text-xs sm:text-sm font-bold text-foreground font-display"
              >
                <span>
                  {viewType === 'day'
                    ? format(currentDate, 'MMMM d, yyyy')
                    : viewType === 'week'
                    ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
                    : viewType === 'month'
                    ? format(currentDate, 'MMMM yyyy')
                    : 'All Scheduled & Published Posts'}
                </span>
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-none border border-border" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* View Switcher Segmented Control */}
        <div className="flex items-center rounded-none border border-border bg-surface p-0.5">
          {(['month', 'week', 'day', 'agenda'] as CalendarViewType[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewType(v)}
              className={cn(
                'px-2.5 py-0.5 text-xs font-mono font-medium rounded-none transition-all capitalize',
                viewType === v
                  ? 'bg-primary text-primary-foreground font-bold border border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Surface Grid */}
      <div className="flex-1 min-h-0 rounded-none border border-border bg-card overflow-hidden flex flex-col">
        {viewType === 'week' && (
          <div className="flex flex-col h-full min-h-0">
            {/* Day Header Row */}
            <div className="grid grid-cols-7 border-b border-border/70 bg-surface/50 text-center shrink-0">
              {visibleDays.map((day) => {
                const today = isToday(day);
                const weekend = isWeekend(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'py-1.5 px-2 border-r border-border-subtle last:border-r-0 flex flex-col items-center gap-0.5',
                      today && 'bg-primary/5',
                      weekend && !today && 'bg-surface/70 text-muted-foreground'
                    )}
                  >
                    <span className={cn('text-[10px] font-mono font-medium uppercase tracking-wider', today ? 'text-foreground dark:text-primary font-bold' : 'text-muted-foreground')}>
                      {format(day, 'EEE')}
                    </span>
                    <span className={cn('text-base font-mono font-semibold h-6 w-6 flex items-center justify-center rounded-none', today ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground')}>
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Day Columns */}
            <div className="flex-1 min-h-0 grid grid-cols-7 divide-x divide-border-subtle overflow-hidden">
              {visibleDays.map((day) => {
                const dayKey = day.toISOString().split('T')[0];
                const dayPosts = postsByDay.get(dayKey) || [];
                const today = isToday(day);
                const weekend = isWeekend(day);
                const isPast = isPastDate(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'h-full p-1.5 space-y-1.5 flex flex-col overflow-y-auto no-scrollbar',
                      today && 'bg-surface/80',
                      weekend && !today && 'bg-surface/30',
                      isPast && !today && 'bg-muted/[0.12]'
                    )}
                  >
                    {dayPosts.length === 0 ? (
                      !isPast ? (
                        <button
                          type="button"
                          onClick={() => onCreatePost(day)}
                          className="w-full h-16 border border-dashed border-border hover:border-primary rounded-none flex flex-col items-center justify-center text-muted-foreground/60 hover:text-primary transition-all group"
                        >
                          <Plus className="h-3.5 w-3.5 mb-0.5 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-mono">Add post</span>
                        </button>
                      ) : null
                    ) : (
                      <div className="space-y-1.5">
                        {dayPosts.map((post) => {
                          const config = PLATFORM_CONFIG[post.platform];
                          const postDate = post.publishedAt || post.scheduledAt || post.updatedAt;

                          return (
                            <div
                              key={post.id}
                              onClick={() => setInspectingPost(post)}
                              className={cn(
                                'p-2 rounded-none border border-border bg-card hover:border-primary cursor-pointer transition-all border-l-[3px] text-left group space-y-1',
                                config.borderAccent
                              )}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="flex items-center gap-1 text-[9px] font-mono font-medium text-muted-foreground">
                                  {config.icon}
                                  {postDate && format(new Date(postDate), 'h:mm a')}
                                </span>
                                <Badge className={cn('text-[8px] font-mono font-medium px-1 py-0 h-3.5', STATUS_BADGES[post.status].className)} variant="outline">
                                  {STATUS_BADGES[post.status].label}
                                </Badge>
                              </div>

                              <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                {post.title}
                              </p>

                              <div className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground">
                                <Layers className="h-3 w-3" />
                                <span>{post.content?.slides?.length || 1} slides</span>
                              </div>
                            </div>
                          );
                        })}

                        {!isPast && (
                          <button
                            type="button"
                            onClick={() => onCreatePost(day)}
                            className="w-full py-1 border border-dashed border-border hover:border-primary rounded-none flex items-center justify-center text-muted-foreground hover:text-primary text-[9px] font-mono gap-1 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add post</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewType === 'day' && (
          <div className="flex-1 min-h-0 flex flex-col p-3 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-border/70 pb-2.5 mb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {(postsByDay.get(currentDate.toISOString().split('T')[0]) || []).length} post(s) scheduled or published
                </p>
              </div>
              {!isPastDate(currentDate) && (
                <Button size="sm" onClick={() => onCreatePost(currentDate)} className="gap-1 rounded-none border border-primary bg-primary text-primary-foreground font-bold h-7 text-xs font-mono">
                  <Plus className="h-3.5 w-3.5" />
                  Create Post
                </Button>
              )}
            </div>

            <div className="space-y-2.5">
              {(postsByDay.get(currentDate.toISOString().split('T')[0]) || []).map((post) => {
                const config = PLATFORM_CONFIG[post.platform];
                const postDate = post.publishedAt || post.scheduledAt || post.updatedAt;

                return (
                  <div
                    key={post.id}
                    onClick={() => setInspectingPost(post)}
                    className={cn(
                      'p-3.5 rounded-none border border-border bg-card hover:border-primary cursor-pointer transition-all border-l-4 flex items-center justify-between gap-4',
                      config.borderAccent
                    )}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs font-mono font-semibold px-2 py-0.5 rounded-none border', config.pillClass)}>
                          {config.icon}
                          <span className="ml-1">{post.platform}</span>
                        </Badge>
                        <Badge className={cn('text-xs font-mono font-medium rounded-none border', STATUS_BADGES[post.status].className)} variant="outline">
                          {STATUS_BADGES[post.status].label}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {postDate && format(new Date(postDate), 'h:mm a')}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-sm truncate">{post.title}</h4>
                      <p className="text-xs text-muted-foreground truncate max-w-xl">
                        {post.content?.caption || 'No caption'}
                      </p>
                    </div>

                    <Button variant="ghost" size="sm" className="shrink-0 text-xs gap-1 rounded-none">
                      Inspect
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewType === 'month' && (
          <div className="flex flex-col h-full min-h-0">
            {/* Month Day Names */}
            <div className="grid grid-cols-7 border-b border-border bg-surface text-center py-1.5 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Month Grid */}
            <div className="flex-1 min-h-0 grid grid-cols-7 divide-x divide-y divide-border overflow-y-auto no-scrollbar">
              {(() => {
                const start = startOfMonth(currentDate);
                const end = endOfMonth(currentDate);
                const days = eachDayOfInterval({ start, end });
                const firstDayOfWeek = startOfWeek(start, { weekStartsOn: 1 });
                const paddingDaysCount = Math.floor((start.getTime() - firstDayOfWeek.getTime()) / (1000 * 60 * 60 * 24));
                const paddingDays = Array.from({ length: paddingDaysCount }, (_, i) => addDays(firstDayOfWeek, i));
                const allDays = [...paddingDays, ...days];

                return allDays.map((day) => {
                  const today = isToday(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const dayKey = day.toISOString().split('T')[0];
                  const dayPosts = postsByDay.get(dayKey) || [];
                  const isPast = isPastDate(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'min-h-[64px] p-1 flex flex-col justify-between transition-colors',
                        !isCurrentMonth && 'bg-surface/40 opacity-40',
                        today && 'bg-surface/80',
                        isPast && !today && 'bg-muted/[0.12]'
                      )}
                      onClick={() => {
                        if (dayPosts.length === 0 && !isPast) onCreatePost(day);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-[11px] font-mono font-semibold h-4.5 w-4.5 flex items-center justify-center rounded-none',
                            today ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayPosts.length > 0 && (
                          <span className="text-[9px] font-mono text-muted-foreground font-medium">
                            {dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-0.5 my-0.5 no-scrollbar">
                        {dayPosts.slice(0, 2).map((post) => {
                          const config = PLATFORM_CONFIG[post.platform];
                          return (
                            <div
                              key={post.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectingPost(post);
                              }}
                              className={cn(
                                'px-1 py-0.5 rounded-none text-[9px] font-mono font-medium truncate cursor-pointer hover:border-primary border border-border bg-card border-l-[2px]',
                                config.borderAccent
                              )}
                            >
                              {post.title}
                            </div>
                          );
                        })}
                        {dayPosts.length > 2 && (
                          <span className="text-[8px] font-mono text-muted-foreground font-medium block text-center">
                            +{dayPosts.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {viewType === 'agenda' && (
          <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 no-scrollbar">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <h3 className="text-base font-semibold">Publishing Schedule Queue</h3>
                <span className="text-xs font-mono text-muted-foreground">{agendaPosts.length} total posts</span>
              </div>

              <div className="space-y-2.5">
                {agendaPosts.map((post) => {
                  const config = PLATFORM_CONFIG[post.platform];
                  const postDate = post.publishedAt || post.scheduledAt || post.updatedAt;

                  return (
                    <div
                      key={post.id}
                      onClick={() => setInspectingPost(post)}
                      className={cn(
                        'p-3.5 rounded-none border border-border bg-card hover:border-primary cursor-pointer transition-all border-l-4 flex items-center justify-between gap-4',
                        config.borderAccent
                      )}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn('text-xs font-mono font-semibold px-2 py-0.5 rounded-none border', config.pillClass)}>
                            {config.icon}
                            <span className="ml-1">{post.platform}</span>
                          </Badge>
                          <Badge className={cn('text-xs font-mono font-medium rounded-none border', STATUS_BADGES[post.status].className)} variant="outline">
                            {STATUS_BADGES[post.status].label}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3" />
                            {postDate && format(new Date(postDate), 'MMM d, yyyy • h:mm a')}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-sm truncate">{post.title}</h4>
                        <p className="text-xs text-muted-foreground truncate max-w-2xl">
                          {post.content?.caption || 'No caption'}
                        </p>
                      </div>

                      <Button variant="outline" size="sm" className="shrink-0 text-xs gap-1 rounded-none border border-border">
                        Inspect
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Slide-Over Event Inspector Drawer */}
        <SlideOver
          open={!!inspectingPost}
          onClose={() => setInspectingPost(null)}
          title={
            inspectingPost ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs font-semibold rounded-none border', PLATFORM_CONFIG[inspectingPost.platform].pillClass)}>
                  {PLATFORM_CONFIG[inspectingPost.platform].icon}
                  <span className="ml-1">{inspectingPost.platform}</span>
                </Badge>
                <Badge className={cn('text-xs rounded-none border', STATUS_BADGES[inspectingPost.status].className)} variant="outline">
                  {STATUS_BADGES[inspectingPost.status].label}
                </Badge>
              </div>
            ) : null
          }
          description={
            inspectingPost && (
              <span className="font-mono text-xs">
                {inspectingPost.publishedAt
                  ? `Published on ${format(new Date(inspectingPost.publishedAt), 'MMM d, yyyy • h:mm a')}`
                  : inspectingPost.scheduledAt
                  ? `Scheduled for ${format(new Date(inspectingPost.scheduledAt), 'MMM d, yyyy • h:mm a')}`
                  : `Updated on ${format(new Date(inspectingPost.updatedAt || new Date()), 'MMM d, yyyy')}`}
              </span>
            )
          }
          footer={
            inspectingPost && (
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const post = inspectingPost;
                    setInspectingPost(null);
                    onPostClick(post);
                  }}
                  className="gap-1.5 rounded-none border border-border text-xs font-mono"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Full Studio
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const post = inspectingPost;
                      setInspectingPost(null);
                      onPostClick(post);
                    }}
                    className="gap-1.5 rounded-none text-xs bg-primary text-primary-foreground font-mono font-bold border border-primary hover:opacity-90"
                  >
                    {inspectingPost.status === 'POSTED' ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        View in History
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Manage Post Actions
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          }
        >
          {inspectingPost && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground leading-snug">{inspectingPost.title}</h3>
              </div>

              {/* Slide Carousel Preview */}
              {inspectingPost.content?.slides && inspectingPost.content.slides.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    Carousel Slides ({inspectingPost.content.slides.length})
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {inspectingPost.content.slides.map((s, idx) => (
                      <div key={idx} className="relative aspect-[4/5] rounded-none overflow-hidden border border-border bg-surface">
                        {s.imageUrl ? (
                          <img src={s.imageUrl} alt={s.headline || `Slide ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="p-2 flex flex-col justify-between h-full text-[10px]">
                            <span className="font-semibold">{s.headline}</span>
                            <span className="text-muted-foreground">{idx + 1}</span>
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 bg-black/90 text-white text-[9px] font-mono px-1 rounded-none border border-white/20">
                          {idx + 1}/{inspectingPost.content.slides.length}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Caption Preview */}
              <div className="space-y-2">
                <Label className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">Post Caption</Label>
                <div className="p-3.5 rounded-none border border-border bg-surface text-xs leading-relaxed whitespace-pre-wrap text-foreground font-mono">
                  {inspectingPost.content?.caption || 'No caption text'}
                </div>
              </div>

              {/* Hashtags */}
              {inspectingPost.content?.hashtags && inspectingPost.content.hashtags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">Hashtags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectingPost.content.hashtags.map((tag, idx) => (
                      <span key={idx} className="text-xs font-mono font-medium text-foreground dark:text-primary bg-surface border border-border dark:border-primary/40 px-2 py-0.5 rounded-none">
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SlideOver>
      </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
