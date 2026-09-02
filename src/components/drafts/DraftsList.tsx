'use client';

import { useState, useMemo } from 'react';
import { Filter, Search, Plus, LayoutGrid, List, X, Calendar as CalendarIcon, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DraftPreview } from './DraftPreview';
import { Platform, PostStatus, PostWithRelations } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PostWithRelationsExtended extends PostWithRelations {
  ideaTitle?: string;
}

interface DraftsListProps {
  posts: PostWithRelationsExtended[];
  onRevise: (postId: string, feedback: string) => void;
  onApprove: (postId: string) => void;
  onSchedule: (postId: string, date: Date) => void;
  onPublish?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onCreateNew?: () => void;
}

const STATUS_FILTERS: { value: PostStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Drafts' },
  { value: 'DRAFTED', label: 'Drafted' },
  { value: 'IN_REVISION', label: 'In Revision' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'FAILED', label: 'Failed' },
];

const PLATFORM_FILTERS: { value: Platform | 'all'; label: string }[] = [
  { value: 'all', label: 'All Platforms' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'PINTEREST', label: 'Pinterest' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'updated-desc', label: 'Recently Updated' },
  { value: 'updated-asc', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
];

const statusConfig: Record<PostStatus, { label: string; className: string; icon?: string }> = {
  IDEA: { label: 'Idea', className: 'badge-idea' },
  SELECTED: { label: 'Selected', className: 'badge-selected' },
  DRAFTED: { label: 'Drafted', className: 'badge-drafted' },
  IN_REVISION: { label: 'In Revision', className: 'badge-in_revision' },
  APPROVED: { label: 'Approved', className: 'badge-approved' },
  SCHEDULED: { label: 'Scheduled', className: 'badge-scheduled' },
  POSTED: { label: 'Published', className: 'badge-posted' },
  FAILED: { label: 'Failed', className: 'badge-failed' },
};

const platformBadgeConfig: Record<Platform, { label: string; className: string }> = {
  INSTAGRAM: {
    label: 'Instagram',
    className: 'badge-instagram',
  },
  PINTEREST: {
    label: 'Pinterest',
    className: 'badge-pinterest',
  },
  LINKEDIN: {
    label: 'LinkedIn',
    className: 'badge-linkedin',
  },
};

export function DraftsList({
  posts,
  onRevise,
  onApprove,
  onSchedule,
  onPublish,
  onDelete,
  onCreateNew,
}: DraftsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [sortBy, setSortBy] = useState('updated-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPost, setSelectedPost] = useState<PostWithRelationsExtended | null>(null);

  const filteredPosts = useMemo(() => {
    let result = posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.content?.caption && post.content.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.ideaTitle && post.ideaTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' ? post.status !== 'POSTED' : post.status === statusFilter;
      const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;

      return matchesSearch && matchesStatus && matchesPlatform;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'updated-desc':
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        case 'updated-asc':
          return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [posts, searchQuery, statusFilter, platformFilter, sortBy]);

  const filterCount = (statusFilter !== 'all' ? 1 : 0) + (platformFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  if (selectedPost) {
    const currentPost = posts.find((p) => p.id === selectedPost.id) || selectedPost;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedPost(null)}>
            ← Back to all drafts
          </Button>
        </div>
        <DraftPreview
          post={{
            id: currentPost.id,
            platform: currentPost.platform,
            title: currentPost.title,
            status: currentPost.status,
            content: currentPost.content,
            scheduledAt: currentPost.scheduledAt,
            currentVersion: currentPost.currentVersion,
            versions: currentPost.versions || [],
            ideaTitle: currentPost.ideaTitle,
          }}
          onRevise={onRevise}
          onApprove={onApprove}
          onSchedule={onSchedule}
          onPublish={onPublish}
          onDelete={(id) => {
            setSelectedPost(null);
            onDelete?.(id);
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Drafts</h2>
          <Badge variant="outline" className="text-sm gap-1">
            <span>{filteredPosts.length}</span>
            <span className="text-muted-foreground">of {posts.length}</span>
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drafts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pl-9 text-sm sm:w-64"
              onKeyDown={(e) => e.key === 'Escape' && setSearchQuery('')}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as PostStatus | 'all')}>
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={platformFilter} onValueChange={(val) => setPlatformFilter(val as Platform | 'all')}>
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_FILTERS.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-[150px] text-sm">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-none border border-border bg-surface p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2.5 rounded-none font-mono text-xs font-semibold',
                viewMode === 'grid' ? 'bg-primary text-primary-foreground border border-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2.5 rounded-none font-mono text-xs font-semibold',
                viewMode === 'list' ? 'bg-primary text-primary-foreground border border-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {filterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPlatformFilter('all');
              }}
              className="text-xs text-muted-foreground hover:text-foreground h-9"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}

          {onCreateNew && (
            <Button onClick={onCreateNew} size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1" />
              New Draft
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-border rounded-none bg-card">
            <Filter className="h-10 w-10 mb-3 text-muted-foreground" />
            <h3 className="font-display text-lg font-bold mb-1 text-foreground">
              {searchQuery || statusFilter !== 'all' || platformFilter !== 'all'
                ? 'No drafts match your filters'
                : 'No drafts yet'}
            </h3>
            <p className="text-xs font-mono text-muted-foreground max-w-sm mb-4">
              {searchQuery || statusFilter !== 'all' || platformFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Generate drafts from your ideation sessions to get started.'}
            </p>
            {filterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPlatformFilter('all');
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Clear all filters
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosts.map((post) => {
              const firstSlide = post.content?.slides?.[0];
              const slideCount = post.content?.slides?.length || 1;
              const status = statusConfig[post.status] || statusConfig.DRAFTED;
              const platform = platformBadgeConfig[post.platform] || platformBadgeConfig.INSTAGRAM;

              return (
                <Card
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="cursor-pointer overflow-hidden rounded-none border border-border bg-card hover:border-primary transition-all duration-150 group flex flex-col justify-between"
                  elevation="none"
                >
                  <CardContent className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Top Badges Bar */}
                      <div className="flex items-center justify-between gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-mono font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-none border', platform.className)}
                        >
                          {platform.label}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] font-mono font-medium px-2 py-0.5 rounded-none border', status.className)}
                          >
                            {status.label}
                          </Badge>
                          {post.currentVersion > 1 && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-surface border border-border px-1.5 py-0.5 rounded-none">
                              v{post.currentVersion}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Slide Thumbnail with Multi-Slide Carousel Stack Effect */}
                      <div className="relative pt-1 pb-1 px-1">
                        {slideCount > 1 && (
                          <div className="absolute inset-x-3 bottom-0 h-4 bg-surface rounded-none border border-border -z-0 transform translate-y-1 scale-[0.98]" />
                        )}
                        <div className="relative z-10 w-full aspect-[4/3] rounded-none overflow-hidden bg-zinc-950 border border-border">
                          {firstSlide?.imageUrl ? (
                            <img
                              src={firstSlide.imageUrl}
                              alt={firstSlide.headline || post.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground bg-surface">
                              <span className="text-xs font-semibold text-foreground line-clamp-2">{post.title}</span>
                            </div>
                          )}

                          {/* Slide Count Overlay Pill */}
                          <div className="absolute bottom-2 right-2 bg-black/90 border border-white/20 text-white text-[10px] font-mono font-medium px-2 py-0.5 rounded-none flex items-center gap-1">
                            <span>{slideCount} slide{slideCount > 1 ? 's' : ''}</span>
                            {slideCount > 1 && <span className="text-white/60 font-mono">• Carousel</span>}
                          </div>
                        </div>
                      </div>

                      {/* Post Title */}
                      <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>

                      {/* Caption Preview */}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                        {post.content?.caption || <span className="italic opacity-60">No caption provided</span>}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border mt-1 font-mono">
                      {post.scheduledAt ? (
                        <span className="flex items-center gap-1.5 text-foreground dark:text-primary font-medium text-[11px]">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(post.scheduledAt), 'MMM d, h:mm a')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3" />
                          {format(new Date(post.updatedAt || new Date()), 'MMM d, yyyy')}
                        </span>
                      )}
                      <span className="text-foreground dark:text-primary font-bold group-hover:underline text-[11px] uppercase tracking-wider">
                        Inspect →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const status = statusConfig[post.status] || statusConfig.DRAFTED;
              const platform = platformBadgeConfig[post.platform] || platformBadgeConfig.INSTAGRAM;
              const slideCount = post.content?.slides?.length || 1;

              return (
                <Card
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="cursor-pointer rounded-none border border-border bg-card hover:border-foreground/50 dark:hover:border-primary transition-all duration-150 group"
                  elevation="none"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-none border shrink-0', platform.className)}
                      >
                        {platform.label}
                      </Badge>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate max-w-xl">
                          {post.content?.caption || 'No caption'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span className="font-mono font-medium text-[11px] bg-surface border border-border px-2 py-0.5 rounded-none hidden sm:inline">
                        {slideCount} slide{slideCount > 1 ? 's' : ''}
                      </span>
                      <Badge className={cn('font-mono font-medium text-[10px] px-2 py-0.5 rounded-none border', status.className)} variant="outline">
                        {status.label}
                      </Badge>
                      {post.scheduledAt && (
                        <span className="flex items-center gap-1 hidden md:inline-flex text-[11px] font-mono text-foreground dark:text-primary font-medium">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(post.scheduledAt), 'MMM d, yyyy')}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
