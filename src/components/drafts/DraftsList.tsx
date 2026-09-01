'use client';

import { useState, useMemo } from 'react';
import { Filter, Search, Plus, LayoutGrid, List, X, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
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
  IDEA: { label: 'Idea', className: 'bg-muted text-muted-foreground border-border' },
  SELECTED: { label: 'Selected', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  DRAFTED: { label: 'Drafted', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  IN_REVISION: { label: 'In Revision', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  APPROVED: { label: 'Approved', className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  SCHEDULED: { label: 'Scheduled', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  POSTED: { label: 'Published', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  FAILED: { label: 'Failed', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
};

const platformBadgeConfig: Record<Platform, { label: string; className: string }> = {
  INSTAGRAM: {
    label: 'Instagram',
    className: 'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  },
  PINTEREST: {
    label: 'Pinterest',
    className: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
  },
  LINKEDIN: {
    label: 'LinkedIn',
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
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

          <div className="flex items-center rounded-md bg-muted p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2.5"
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
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border rounded-xl bg-card/50">
            <Filter className="h-10 w-10 mb-3 opacity-30" />
            <h3 className="text-lg font-semibold mb-1">
              {searchQuery || statusFilter !== 'all' || platformFilter !== 'all'
                ? 'No drafts match your filters'
                : 'No drafts yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
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
                  className="cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-card hover:border-primary/50 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between"
                  elevation="low"
                >
                  <CardContent className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Top Badges Bar */}
                      <div className="flex items-center justify-between gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border', platform.className)}
                        >
                          {platform.label}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', status.className)}
                          >
                            {status.label}
                          </Badge>
                          {post.currentVersion > 1 && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
                              v{post.currentVersion}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Slide Thumbnail with Multi-Slide Carousel Stack Effect */}
                      <div className="relative pt-1 pb-1 px-1">
                        {slideCount > 1 && (
                          <div className="absolute inset-x-3 bottom-0 h-4 bg-muted-foreground/15 rounded-xl border border-border/40 -z-0 transform translate-y-1 scale-[0.96]" />
                        )}
                        <div className="relative z-10 w-full aspect-[4/3] rounded-xl overflow-hidden bg-zinc-950 border border-border/70 shadow-sm group-hover:shadow-md transition-shadow">
                          {firstSlide?.imageUrl ? (
                            <img
                              src={firstSlide.imageUrl}
                              alt={firstSlide.headline || post.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-zinc-400 bg-gradient-to-br from-zinc-900 to-zinc-950">
                              <span className="text-xs font-semibold text-zinc-200 line-clamp-2">{post.title}</span>
                            </div>
                          )}

                          {/* Gradient Vignette */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity" />

                          {/* Slide Count Overlay Pill */}
                          <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md border border-white/10 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                            <span>{slideCount} slide{slideCount > 1 ? 's' : ''}</span>
                            {slideCount > 1 && <span className="text-white/60">• Carousel</span>}
                          </div>
                        </div>
                      </div>

                      {/* Post Title */}
                      <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>

                      {/* Caption Preview */}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                        {post.content?.caption || <span className="italic opacity-60">No caption provided</span>}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 mt-1">
                      {post.scheduledAt ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {format(new Date(post.scheduledAt), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {format(new Date(post.updatedAt || new Date()), 'MMM d, yyyy')}
                        </span>
                      )}

                      <span className="text-[11px] font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Open Editor →
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
                  className="cursor-pointer rounded-xl border border-border/70 bg-card hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                  elevation="low"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0', platform.className)}
                      >
                        {platform.label}
                      </Badge>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate max-w-xl">
                          {post.content?.caption || 'No caption'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span className="font-medium text-[11px] bg-muted/50 px-2 py-0.5 rounded-md hidden sm:inline">
                        {slideCount} slide{slideCount > 1 ? 's' : ''}
                      </span>
                      <Badge className={cn('font-semibold text-[10px] px-2 py-0.5 rounded-full border', status.className)} variant="outline">
                        {status.label}
                      </Badge>
                      {post.scheduledAt && (
                        <span className="flex items-center gap-1 hidden md:inline-flex text-[11px] text-purple-600 dark:text-purple-400 font-medium">
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
