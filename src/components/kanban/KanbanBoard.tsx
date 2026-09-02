'use client';

import { useState } from 'react';
import { format, isPast } from 'date-fns';
import {
  Plus,
  Search,
  Calendar,
  Camera,
  Pin,
  Briefcase,
  MoreHorizontal,
  Layers,
  Clock,
  ExternalLink,
  Send,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  KeyboardSensor,
  DndContext,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SlideOver } from '@/components/ui/slide-over';
import { cn } from '@/lib/utils';
import { Platform, PostWithRelations, PostStatus, KanbanColumn } from '@/types';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

const KANBAN_STATUSES: PostStatus[] = [
  'IDEA',
  'SELECTED',
  'DRAFTED',
  'IN_REVISION',
  'APPROVED',
  'SCHEDULED',
  'POSTED',
  'FAILED',
];

const STATUS_CONFIG: Record<PostStatus, { title: string; dot: string; pill: string }> = {
  IDEA: { title: 'Ideas', dot: 'bg-muted-foreground/40', pill: 'badge-idea' },
  SELECTED: { title: 'Selected', dot: 'bg-primary/50', pill: 'badge-selected' },
  DRAFTED: { title: 'Drafted', dot: 'bg-primary/70', pill: 'badge-drafted' },
  IN_REVISION: { title: 'In Revision', dot: 'bg-primary/80', pill: 'badge-in_revision' },
  APPROVED: { title: 'Approved', dot: 'bg-blue-500', pill: 'badge-approved' },
  SCHEDULED: { title: 'Scheduled', dot: 'bg-primary', pill: 'badge-scheduled' },
  POSTED: { title: 'Published', dot: 'bg-emerald-500', pill: 'badge-posted' },
  FAILED: { title: 'Failed', dot: 'bg-rose-500', pill: 'badge-failed' },
};

const PLATFORM_CONFIG: Record<Platform, { name: string; pill: string; icon: React.ReactNode }> = {
  INSTAGRAM: {
    name: 'Instagram',
    pill: 'badge-instagram',
    icon: <Camera className="h-3 w-3" />,
  },
  PINTEREST: {
    name: 'Pinterest',
    pill: 'badge-pinterest',
    icon: <Pin className="h-3 w-3" />,
  },
  LINKEDIN: {
    name: 'LinkedIn',
    pill: 'badge-linkedin',
    icon: <Briefcase className="h-3 w-3" />,
  },
};

interface KanbanCardProps {
  post: PostWithRelations;
  onClick: (post: PostWithRelations) => void;
}

function KanbanCard({ post, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isOverdue = post.scheduledAt && isPast(new Date(post.scheduledAt)) && post.status !== 'POSTED';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-card border border-border rounded-none p-3 hover:border-primary transition-all duration-150 cursor-grab active:cursor-grabbing text-left space-y-2',
        isDragging && 'scale-102 ring-1 ring-primary z-50'
      )}
      {...attributes}
      {...listeners}
      onClick={() => onClick(post)}
    >
      <div className="flex items-start justify-between gap-1.5">
        <h4 className="font-display font-bold text-xs text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h4>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick(post);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-none text-muted-foreground hover:text-foreground hover:bg-surface transition-all shrink-0"
          aria-label="Inspect card"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center flex-wrap gap-1.5">
        <Badge variant="outline" className={cn('text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0 h-4.5 flex items-center gap-1 rounded-none border', PLATFORM_CONFIG[post.platform].pill)}>
          {PLATFORM_CONFIG[post.platform].icon}
          {PLATFORM_CONFIG[post.platform].name}
        </Badge>

        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-surface px-1.5 py-0.5 rounded-none border border-border">
          <Layers className="h-3 w-3" />
          <span>{post.content?.slides?.length || 1}</span>
        </div>

        {post.scheduledAt && (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-mono font-medium px-1.5 py-0 h-4.5 flex items-center gap-1 rounded-none border',
              isOverdue
                ? 'bg-destructive/10 text-destructive border-destructive'
                : 'bg-surface text-muted-foreground border-border'
            )}
          >
            <Clock className="h-2.5 w-2.5" />
            {format(new Date(post.scheduledAt), 'MMM d')}
          </Badge>
        )}
      </div>

      {post.status === 'FAILED' && post.errorMessage && (
        <p className="text-[10px] font-mono text-destructive bg-surface p-1.5 rounded-none border border-destructive line-clamp-2">
          {post.errorMessage}
        </p>
      )}
    </div>
  );
}

interface KanbanColumnProps {
  column: KanbanColumn;
  onPostClick: (post: PostWithRelations) => void;
  onMovePost: (postId: string, newStatus: PostStatus) => void;
  onCreatePost?: (status: PostStatus) => void;
}

function KanbanColumnComponent({ column, onPostClick, onCreatePost }: KanbanColumnProps) {
  const statusConfig = STATUS_CONFIG[column.id as PostStatus];

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px] rounded-none border border-border bg-surface overflow-hidden">
      {/* Column Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border px-3.5 py-2.5 bg-surface">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-none', statusConfig.dot)} />
          <h3 className="font-display font-bold text-xs text-foreground uppercase tracking-wider">{statusConfig.title}</h3>
          <span className="text-[11px] font-mono text-muted-foreground bg-card px-1.5 py-0.5 rounded-none border border-border">
            {column.posts.length}
          </span>
        </div>

        {onCreatePost && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCreatePost(column.id as PostStatus)}
            className="h-6 w-6 rounded-none border border-border text-muted-foreground hover:text-foreground"
            aria-label={`Add card to ${statusConfig.title}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Cards Container */}
      <div className="p-2 flex-1 overflow-y-auto">
        <SortableContext
          items={column.posts.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[160px]">
            {column.posts.length === 0 ? (
              <div className="h-24 border border-dashed border-border rounded-none flex flex-col items-center justify-center text-muted-foreground text-[11px] font-mono">
                <span>Empty stage</span>
              </div>
            ) : (
              column.posts.map((post) => (
                <KanbanCard key={post.id} post={post} onClick={onPostClick} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({
  posts,
  onPostClick,
  onMovePost,
  onCreatePost,
}: {
  posts: PostWithRelations[];
  onPostClick: (post: PostWithRelations) => void;
  onMovePost: (postId: string, newStatus: PostStatus) => void;
  onCreatePost?: (status: PostStatus) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'title'>('priority');
  const [inspectingPost, setInspectingPost] = useState<PostWithRelations | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.caption?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const columns: KanbanColumn[] = KANBAN_STATUSES.map((status) => ({
    id: status,
    title: STATUS_CONFIG[status].title,
    posts: filteredPosts.filter((p) => p.status === status),
  }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      // Check if dropped onto a column or another card
      const targetPost = posts.find((p) => p.id === over.id);
      const newStatus = targetPost ? targetPost.status : (over.id as PostStatus);

      if (KANBAN_STATUSES.includes(newStatus)) {
        onMovePost(active.id as string, newStatus);
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col space-y-3">
        {/* Top Filter & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-border pb-3 bg-surface p-3 rounded-none">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold tracking-tight">Kanban Board</h2>
            <Badge variant="outline" className="text-xs font-mono">
              {filteredPosts.length} posts
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full pl-8 sm:w-56 text-xs rounded-none font-mono border-border"
              />
            </div>

            <Select value={platformFilter} onValueChange={(val) => setPlatformFilter(val as Platform | 'all')}>
              <SelectTrigger className="w-[130px] h-8 text-xs font-mono rounded-none border-border">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-mono">All Platforms</SelectItem>
                <SelectItem value="INSTAGRAM" className="text-xs font-mono">Instagram</SelectItem>
                <SelectItem value="PINTEREST" className="text-xs font-mono">Pinterest</SelectItem>
                <SelectItem value="LINKEDIN" className="text-xs font-mono">LinkedIn</SelectItem>
              </SelectContent>
            </Select>

            {onCreatePost && (
              <Button onClick={() => onCreatePost('DRAFTED')} size="sm" className="h-8 text-xs font-mono font-bold gap-1 rounded-none bg-primary text-primary-foreground border border-primary hover:opacity-90">
                <Plus className="h-3.5 w-3.5" />
                Add Post
              </Button>
            )}
          </div>
        </div>

        {/* Board Horizontal Scroll Area */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto pb-4">
            <DragOverlay>
              {activeId ? (() => {
                const activePost = posts.find((p) => p.id === activeId);
                if (!activePost) return null;
                return (
                  <div className="w-[280px] bg-card border border-primary rounded-none p-3 scale-102">
                    <h4 className="font-display font-bold text-xs truncate">{activePost.title}</h4>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge variant="outline" className={cn('text-[10px] font-mono px-1.5 py-0 h-4.5 rounded-none border', PLATFORM_CONFIG[activePost.platform].pill)}>
                        {PLATFORM_CONFIG[activePost.platform].icon}
                        <span className="ml-1">{activePost.platform}</span>
                      </Badge>
                    </div>
                  </div>
                );
              })() : null}
            </DragOverlay>

            <div className="flex gap-3 min-w-max h-full items-start">
              {columns.map((column) => (
                <KanbanColumnComponent
                  key={column.id}
                  column={column}
                  onPostClick={(post) => setInspectingPost(post)}
                  onMovePost={onMovePost}
                  onCreatePost={onCreatePost}
                />
              ))}
            </div>
          </div>
        </DndContext>

        {/* Slide-Over Detail Inspector */}
        <SlideOver
          open={!!inspectingPost}
          onClose={() => setInspectingPost(null)}
          title={
            inspectingPost ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs font-semibold', PLATFORM_CONFIG[inspectingPost.platform].pill)}>
                  {PLATFORM_CONFIG[inspectingPost.platform].icon}
                  <span className="ml-1">{inspectingPost.platform}</span>
                </Badge>
                <Badge className={cn('text-xs', STATUS_CONFIG[inspectingPost.status].pill)} variant="outline">
                  {STATUS_CONFIG[inspectingPost.status].title}
                </Badge>
              </div>
            ) : null
          }
          description={
            inspectingPost && (
              <span>
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
                  <Select
                    value={inspectingPost.status}
                    onValueChange={(newStatus) => {
                      onMovePost(inspectingPost.id, newStatus as PostStatus);
                      setInspectingPost({ ...inspectingPost, status: newStatus as PostStatus });
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs font-mono rounded-none border-border w-[140px]">
                      <SelectValue placeholder="Move Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {KANBAN_STATUSES.map((status) => (
                        <SelectItem key={status} value={status} className="text-xs font-mono">
                          {STATUS_CONFIG[status].title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
                        View History
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Publish Actions
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

              {/* Carousel Slides */}
              {inspectingPost.content?.slides && inspectingPost.content.slides.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    Carousel Slides ({inspectingPost.content.slides.length})
                  </div>
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

              {/* Caption */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">Post Caption</div>
                <div className="p-3.5 rounded-none border border-border bg-surface text-xs leading-relaxed whitespace-pre-wrap text-foreground font-mono">
                  {inspectingPost.content?.caption || 'No caption text'}
                </div>
              </div>

              {/* Hashtags */}
              {inspectingPost.content?.hashtags && inspectingPost.content.hashtags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">Hashtags</div>
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
    </TooltipProvider>
  );
}
