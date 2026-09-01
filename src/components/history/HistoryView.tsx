'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  Target,
  Hash,
  Type,
  RefreshCw,
  Copy,
  Check,
  Eye,
  Filter,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Platform, PostWithRelations, PostStatus } from '@/types';

const PLATFORM_COLORS: Record<Platform, { badge: string; border: string }> = {
  INSTAGRAM: { badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  PINTEREST: { badge: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  LINKEDIN: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
};

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  INSTAGRAM: <Target className="h-3.5 w-3.5" />,
  PINTEREST: <Hash className="h-3.5 w-3.5" />,
  LINKEDIN: <Type className="h-3.5 w-3.5" />,
};

const STATUS_COLORS: Record<PostStatus, string> = {
  IDEA: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  SELECTED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  DRAFTED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  IN_REVISION: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  SCHEDULED: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  POSTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

interface HistoryViewProps {
  posts: PostWithRelations[];
  onPostClick?: (post: PostWithRelations) => void;
  onRetryPublish: (postId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function HistoryView({
  posts,
  onRetryPublish,
  onLoadMore,
  hasMore,
  isLoading,
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedPost, setSelectedPost] = useState<PostWithRelations | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.content?.caption && post.content.caption.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl bg-card">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Published Posts</h2>
          <Badge variant="outline" className="text-sm">
            {posts.length} total
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search published posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-60 h-9 text-sm"
            />
          </div>

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as Platform | 'all')}
            className="border rounded-md px-3 py-1.5 text-sm bg-background text-foreground h-9"
          >
            <option value="all">All Platforms</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="PINTEREST">Pinterest</option>
            <option value="LINKEDIN">LinkedIn</option>
          </select>

          <div className="flex items-center bg-muted rounded-md p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Posts Content */}
      <div className="flex-1 overflow-auto">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border rounded-xl bg-card/50">
            <Calendar className="h-12 w-12 mb-3 opacity-30" />
            <h3 className="text-lg font-semibold mb-1">No published posts found</h3>
            <p className="text-sm max-w-sm">
              {searchQuery || platformFilter !== 'all'
                ? 'Try adjusting your search filters'
                : 'Posts you publish to Instagram, LinkedIn, or Pinterest will appear here.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                onClick={() => {
                  setSelectedPost(post);
                  setActiveSlide(0);
                }}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group overflow-hidden"
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <Badge variant="secondary" className={cn('text-xs gap-1', PLATFORM_COLORS[post.platform]?.badge)}>
                    {PLATFORM_ICONS[post.platform]}
                    {post.platform}
                  </Badge>
                  <Badge className={cn('text-xs font-normal', STATUS_COLORS[post.status])} variant="outline">
                    {post.status}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-2">
                  <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.content?.caption || 'No caption available'}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t">
                    <span>{post.content?.slides?.length || 1} slide(s)</span>
                    {post.publishedAt && (
                      <span>{format(new Date(post.publishedAt), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                onClick={() => {
                  setSelectedPost(post);
                  setActiveSlide(0);
                }}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="secondary" className={cn('text-xs gap-1 shrink-0', PLATFORM_COLORS[post.platform]?.badge)}>
                      {PLATFORM_ICONS[post.platform]}
                      {post.platform}
                    </Badge>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{post.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {post.content?.caption || 'No caption'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <Badge className={cn('font-normal', STATUS_COLORS[post.status])} variant="outline">
                      {post.status}
                    </Badge>
                    {post.publishedAt && (
                      <span className="flex items-center gap-1 hidden sm:inline-flex">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                      </span>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="p-4 text-center">
            <Button variant="outline" onClick={onLoadMore} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      {/* Full Preview Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] bg-background border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn('text-xs gap-1', PLATFORM_COLORS[selectedPost.platform]?.badge)}>
                  {PLATFORM_ICONS[selectedPost.platform]}
                  {selectedPost.platform}
                </Badge>
                <h3 className="font-bold text-base truncate">{selectedPost.title}</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPost(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Slides / Media Preview */}
                {selectedPost.content?.slides && selectedPost.content.slides.length > 0 && (
                  <div className="space-y-3">
                    <div className="relative aspect-square max-w-sm mx-auto bg-muted rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                      {selectedPost.content.slides[activeSlide]?.imageUrl ? (
                        <Image
                          src={selectedPost.content.slides[activeSlide].imageUrl!}
                          alt={selectedPost.content.slides[activeSlide].altText || `Slide ${activeSlide + 1}`}
                          fill
                          sizes="384px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="p-6 text-center text-muted-foreground flex flex-col items-center">
                          <ImageIcon className="h-10 w-10 mb-2 opacity-40" />
                          <p className="text-xs">{selectedPost.content.slides[activeSlide]?.text || 'Text-only slide'}</p>
                        </div>
                      )}

                      {/* Carousel controls */}
                      {selectedPost.content.slides.length > 1 && (
                        <>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full shadow-md opacity-80 hover:opacity-100"
                            onClick={() =>
                              setActiveSlide((prev) => (prev === 0 ? selectedPost.content.slides.length - 1 : prev - 1))
                            }
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full shadow-md opacity-80 hover:opacity-100"
                            onClick={() =>
                              setActiveSlide((prev) => (prev === selectedPost.content.slides.length - 1 ? 0 : prev + 1))
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Slide Dots */}
                    {selectedPost.content.slides.length > 1 && (
                      <div className="flex justify-center gap-1.5">
                        {selectedPost.content.slides.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSlide(idx)}
                            className={cn(
                              'h-2 rounded-full transition-all',
                              idx === activeSlide ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Caption Section */}
                {selectedPost.content?.caption && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caption</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleCopyCaption(selectedPost.content.caption)}
                      >
                        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <div className="p-3.5 bg-muted/40 rounded-xl text-sm leading-relaxed whitespace-pre-wrap border">
                      {selectedPost.content.caption}
                    </div>
                  </div>
                )}

                {/* Hashtags Section */}
                {selectedPost.content?.hashtags && selectedPost.content.hashtags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hashtags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPost.content.hashtags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-normal">
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Publishing Info */}
                <div className="p-4 bg-muted/20 border rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={cn('font-normal text-xs', STATUS_COLORS[selectedPost.status])} variant="outline">
                      {selectedPost.status}
                    </Badge>
                  </div>
                  {selectedPost.publishedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Published At</span>
                      <span className="font-medium">{format(new Date(selectedPost.publishedAt), 'PPP p')}</span>
                    </div>
                  )}
                  {selectedPost.scheduledAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scheduled For</span>
                      <span className="font-medium">{format(new Date(selectedPost.scheduledAt), 'PPP p')}</span>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end gap-2 bg-muted/10">
              {selectedPost.status === 'FAILED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onRetryPublish(selectedPost.id);
                    setSelectedPost(null);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Publishing
                </Button>
              )}
              <Button size="sm" onClick={() => setSelectedPost(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}