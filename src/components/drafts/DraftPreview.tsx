'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Hash,
  MessageSquare,
  Copy,
  Check,
  Image as ImageIcon,
  Eye,
  FileText,
  Clock,
  RotateCcw,
  Trash2,
  Calendar,
  RefreshCw,
  Sparkles,
  Edit3,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Flame,
  Zap,
  Target,
  TrendingDown,
  Camera,
  Pin,
  Briefcase,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Platform, PostContent, Slide, PostStatus } from '@/types';
import { ScheduleModal } from './ScheduleModal';

interface DraftPreviewProps {
  post: {
    id: string;
    platform: Platform;
    title: string;
    status: PostStatus;
    content: PostContent;
    scheduledAt?: Date | string | null;
    currentVersion: number;
    versions: Array<{ version: number; content: PostContent; feedback?: string | null; createdAt: Date | string }>;
    ideaTitle?: string;
  };
  onRevise: (postId: string, feedback: string) => void;
  onApprove: (postId: string) => void;
  onSchedule: (postId: string, date: Date) => void;
  onPublish?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

const PLATFORM_COLORS: Record<Platform, string> = {
  INSTAGRAM: 'badge-instagram',
  PINTEREST: 'badge-pinterest',
  LINKEDIN: 'badge-linkedin',
};

const STATUS_CONFIG: Record<PostStatus, { label: string; className: string }> = {
  IDEA: { label: 'Idea', className: 'badge-idea' },
  SELECTED: { label: 'Selected', className: 'badge-selected' },
  DRAFTED: { label: 'Drafted', className: 'badge-drafted' },
  IN_REVISION: { label: 'In Revision', className: 'badge-in_revision' },
  APPROVED: { label: 'Approved', className: 'badge-approved' },
  SCHEDULED: { label: 'Scheduled', className: 'badge-scheduled' },
  POSTED: { label: 'Published', className: 'badge-posted' },
  FAILED: { label: 'Failed', className: 'badge-failed' },
};

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  INSTAGRAM: <Camera className="h-3 w-3 mr-1 inline" />,
  PINTEREST: <Pin className="h-3 w-3 mr-1 inline" />,
  LINKEDIN: <Briefcase className="h-3 w-3 mr-1 inline" />,
};

export function DraftPreview({
  post: initialPost,
  onRevise,
  onApprove,
  onSchedule,
  onPublish,
  onDelete,
}: DraftPreviewProps) {
  const [post, setPost] = useState(initialPost);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [generatingSlideId, setGeneratingSlideId] = useState<string | null>(null);
  const [showEditSlide, setShowEditSlide] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [customHeadline, setCustomHeadline] = useState('');
  const [customTake, setCustomTake] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Caption Editing & AI Regeneration States
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaptionText, setEditedCaptionText] = useState(post.content?.caption || '');
  const [editedHashtagsText, setEditedHashtagsText] = useState((post.content?.hashtags || []).join(' '));
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [showRegenerateCaptionPrompt, setShowRegenerateCaptionPrompt] = useState(false);
  const [captionAiComment, setCaptionAiComment] = useState('');
  const [isRegeneratingCaption, setIsRegeneratingCaption] = useState(false);

  const { slides, caption, hashtags, format, altTexts } = post.content;
  const platformConfig = PLATFORM_COLORS[post.platform];
  const statusConfig = STATUS_CONFIG[post.status];
  const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt) : null;

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  useEffect(() => {
    if (post.content?.caption) {
      setEditedCaptionText(post.content.caption);
    }
    if (post.content?.hashtags) {
      setEditedHashtagsText(post.content.hashtags.join(' '));
    }
  }, [post.content?.caption, post.content?.hashtags]);

  useEffect(() => {
    if (slides[activeSlide]) {
      setCustomHeadline(slides[activeSlide].headline || (activeSlide === 0 ? post.title : ''));
      setCustomTake(slides[activeSlide].body || slides[activeSlide].text || '');
    }
  }, [activeSlide, post, slides]);

  const handleSaveEditedCaption = async () => {
    setIsSavingCaption(true);
    try {
      const parsedHashtags = editedHashtagsText
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith('#') ? t : `#${t}`));

      const res = await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          action: 'update_caption',
          caption: editedCaptionText,
          hashtags: parsedHashtags,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.post) {
          setPost(data.post);
        }
        setIsEditingCaption(false);
      }
    } catch (err) {
      console.error('Failed to save caption:', err);
    } finally {
      setIsSavingCaption(false);
    }
  };

  const handleRegenerateCaption = async (commentOverride?: string) => {
    const userComment = commentOverride !== undefined ? commentOverride : captionAiComment;
    setIsRegeneratingCaption(true);
    try {
      const res = await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          action: 'regenerate_caption',
          comment: userComment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.post) {
          setPost(data.post);
          setEditedCaptionText(data.post.content.caption);
          setEditedHashtagsText((data.post.content.hashtags || []).join(' '));
        }
        setShowRegenerateCaptionPrompt(false);
        setCaptionAiComment('');
      }
    } catch (err) {
      console.error('Failed to regenerate caption:', err);
    } finally {
      setIsRegeneratingCaption(false);
    }
  };

  const handleApproveClick = () => {
    setPost((prev) => ({ ...prev, status: 'APPROVED' }));
    onApprove(post.id);
  };

  const handleScheduleClick = (date: Date) => {
    setPost((prev) => ({ ...prev, status: 'SCHEDULED', scheduledAt: date }));
    onSchedule(post.id, date);
  };

  const handleUnscheduleClick = async () => {
    try {
      const res = await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, action: 'unschedule' }),
      });
      if (res.ok) {
        setPost((prev) => ({ ...prev, status: 'APPROVED', scheduledAt: null }));
      }
    } catch (err) {
      console.error('Unschedule failed:', err);
    }
  };

  const handlePublishClick = async () => {
    if (!onPublish || isPublishing) return;
    setIsPublishing(true);
    try {
      await onPublish(post.id);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReviseClick = (feedback: string) => {
    setPost((prev) => ({ ...prev, status: 'IN_REVISION' }));
    onRevise(post.id, feedback);
    setShowRevisionInput(false);
    setRevisionFeedback('');
  };

  const handleImageLoad = (slideId: string) => {
    setImageLoading((prev) => ({ ...prev, [slideId]: false }));
  };

  const handleImageError = (slideId: string) => {
    setImageLoading((prev) => ({ ...prev, [slideId]: false }));
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateImage = async (
    slideId?: string,
    prompt?: string,
    generateAll?: boolean,
    mode: 'template' | 'ai' = 'template',
    headlineOverride?: string,
    takeOverride?: string
  ) => {
    setGeneratingSlideId(generateAll ? 'ALL' : (slideId || slides[activeSlide]?.id || 'SINGLE'));
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          slideId: slideId || slides[activeSlide]?.id,
          prompt,
          generateAll,
          mode,
          headline: headlineOverride,
          take: takeOverride,
        }),
      });
      const data = await res.json();
      if (data.post) {
        setPost(data.post);
        setShowEditSlide(false);
      }
    } catch (err) {
      console.error('Image generation failed:', err);
    } finally {
      setGeneratingSlideId(null);
    }
  };

  const isCurrentSlideGenerating = generatingSlideId === 'ALL' || generatingSlideId === slides[activeSlide]?.id;

  const renderInstagramCarousel = () => (
    <div className="w-full max-w-[380px] mx-auto bg-card text-card-foreground rounded-xl border border-border shadow-md overflow-hidden text-left">
      {/* 1. Post Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/40 bg-card">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px] flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-[10px] font-bold text-foreground">
              RG
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold leading-none tracking-tight">regardless.ai</span>
            <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">Original audio</span>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Media Area (4:5 Aspect Ratio Full Bleed) */}
      <div className="relative w-full aspect-[4/5] bg-[#12141C] overflow-hidden">
        {isCurrentSlideGenerating || imageLoading[slides[activeSlide]?.id || ''] ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#12141C]/95 text-white gap-2 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground animate-pulse">Rendering 1080x1350 card template...</p>
          </div>
        ) : slides[activeSlide]?.imageUrl ? (
          <Image
            src={slides[activeSlide].imageUrl!}
            alt={altTexts[activeSlide] || `Slide ${activeSlide + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 380px"
            className="object-cover"
            onLoad={() => handleImageLoad(slides[activeSlide].id)}
            onError={() => handleImageError(slides[activeSlide].id)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#12141C] text-muted-foreground p-6 text-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-xs font-medium text-muted-foreground mb-3">No slide card generated yet</p>
            <Button
              size="sm"
              onClick={() => handleGenerateImage(slides[activeSlide]?.id)}
              disabled={generatingSlideId !== null}
              className="gap-1.5 text-xs bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 shadow-sm"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Render Slide Card PNG
            </Button>
          </div>
        )}

        {/* Carousel Navigation Arrows Overlayed inside Media */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-md transition-colors z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-md transition-colors z-20"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Carousel Dot Indicators centered near bottom inside media */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-full">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={cn(
                  'rounded-full transition-all',
                  idx === activeSlide ? 'w-2 h-2 bg-[#3897f0]' : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'
                )}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Action Row */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2 bg-card">
        <div className="flex items-center gap-3.5">
          <button className="text-foreground hover:text-red-500 transition-colors p-0.5">
            <Heart className="h-5 w-5 stroke-[1.8]" />
          </button>
          <button className="text-foreground hover:text-primary transition-colors p-0.5">
            <MessageCircle className="h-5 w-5 stroke-[1.8]" />
          </button>
          <button className="text-foreground hover:text-primary transition-colors p-0.5">
            <Send className="h-5 w-5 stroke-[1.8]" />
          </button>
        </div>
        <button className="text-foreground hover:text-primary transition-colors p-0.5">
          <Bookmark className="h-5 w-5 stroke-[1.8]" />
        </button>
      </div>

      {/* 4. Caption Area (Handle inline with caption text) */}
      <div className="px-3.5 pb-3.5 space-y-1.5 bg-card">
        <div className="text-[13px] leading-relaxed text-foreground">
          <span className="font-bold mr-1.5 text-foreground">regardless.ai</span>
          <span className="text-foreground/90 whitespace-pre-line">{caption}</span>
        </div>

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {hashtags.map((tag, idx) => (
              <span key={idx} className="text-xs text-[#00376b] dark:text-[#3897f0] hover:underline cursor-pointer">
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground uppercase pt-1 tracking-wider">
          {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : 'Just now'}
        </p>
      </div>
    </div>
  );

  const renderPinterestPin = () => (
    <div className="relative max-w-xs mx-auto bg-white rounded-xl overflow-hidden shadow-lg">
      {imageLoading[slides[0]?.id || ''] ? (
        <div className="aspect-[2/3] flex items-center justify-center bg-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : slides[0]?.imageUrl ? (
        <div className="relative w-full aspect-[2/3]">
          <Image
            src={slides[0].imageUrl!}
            alt={altTexts[0] || 'Pinterest Pin'}
            fill
            className="object-cover"
            onLoad={() => handleImageLoad(slides[0].id)}
            onError={() => handleImageError(slides[0].id)}
          />
        </div>
      ) : (
        <div className="aspect-[2/3] flex items-center justify-center bg-gray-100 text-muted-foreground">
          <ImageIcon className="h-12 w-12" />
          <p>No image generated</p>
        </div>
      )}

      {(slides[0]?.headline || slides[0]?.text) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
          {slides[0].headline && <h3 className="font-bold text-lg mb-1">{slides[0].headline}</h3>}
          {slides[0].text && <p className="text-sm opacity-90">{slides[0].text}</p>}
        </div>
      )}
    </div>
  );

  const renderLinkedInPost = () => (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-medium">U</span>
        </div>
        <div>
          <p className="font-medium">Your Name</p>
          <p className="text-xs text-muted-foreground">Just now</p>
        </div>
      </div>

      <div className="p-4">
        <p className="whitespace-pre-wrap mb-4">{caption}</p>

        {slides[0]?.imageUrl && (
          <div className="rounded-lg overflow-hidden mb-4">
            {imageLoading[slides[0].id] ? (
              <div className="aspect-video flex items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="relative aspect-video">
                <Image
                  src={slides[0].imageUrl!}
                  alt={altTexts[0] || 'LinkedIn Post Image'}
                  fill
                  className="object-cover"
                  onLoad={() => handleImageLoad(slides[0].id)}
                  onError={() => handleImageError(slides[0].id)}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {hashtags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full cursor-pointer hover:bg-blue-100"
              onClick={() => copyToClipboard(tag, `hashtag-${idx}`)}
            >
              {copiedField === `hashtag-${idx}` ? <Check className="inline h-3 w-3 ml-1" /> : tag}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
        <span>{format === 'text' ? 'Text Post' : 'Image Post'}</span>
        <div className="flex gap-4">
          <button className="flex items-center gap-1 hover:text-primary">Like</button>
          <button className="flex items-center gap-1 hover:text-primary">Comment</button>
          <button className="flex items-center gap-1 hover:text-primary">Share</button>
        </div>
      </div>
    </div>
  );

  const renderPreview = () => {
    return (
      <div className="flex flex-col items-center">
        {post.platform === 'INSTAGRAM' && renderInstagramCarousel()}
        {post.platform === 'PINTEREST' && renderPinterestPin()}
        {post.platform === 'LINKEDIN' && renderLinkedInPost()}

        {/* Action Controls to Regenerate Slide Image */}
        <div className="mt-4 w-full max-w-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateImage(slides[activeSlide]?.id, undefined, false, 'template')}
              disabled={generatingSlideId !== null}
              className="text-xs gap-1.5 flex-1 bg-muted/40 hover:bg-muted"
            >
              {generatingSlideId === slides[activeSlide]?.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Regenerate Card
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateImage(slides[activeSlide]?.id, undefined, false, 'ai')}
              disabled={generatingSlideId !== null}
              className="text-xs gap-1.5 flex-1 border-primary/30 text-primary hover:bg-primary/10"
            >
              {generatingSlideId === slides[activeSlide]?.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI Graphic (Gemini)
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowEditSlide(!showEditSlide)}
              className="text-xs gap-1 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Text
            </Button>
          </div>

          {showEditSlide && (
            <div className="p-3 bg-muted/50 border border-border/80 rounded-xl space-y-2.5 text-left animate-in fade-in-50">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">Slide {activeSlide + 1} Headline</label>
                <input
                  type="text"
                  value={customHeadline}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Headline..."
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">Slide {activeSlide + 1} Take / Insight</label>
                <textarea
                  value={customTake}
                  onChange={(e) => setCustomTake(e.target.value)}
                  rows={2}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs bg-background border border-input rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Insight..."
                />
              </div>
              <Button
                size="sm"
                onClick={() => handleGenerateImage(slides[activeSlide]?.id, undefined, false, 'template', customHeadline, customTake)}
                disabled={generatingSlideId !== null}
                className="w-full text-xs gap-1.5 bg-primary"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Update Copy & Re-render Image
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Card className="h-full flex flex-col" elevation="raised">
        <CardHeader className="pb-3" padding="comfortable">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <CardTitle className="text-lg truncate">{post.title}</CardTitle>
                <Badge variant="outline" className={cn('font-mono text-[10px] font-medium', STATUS_CONFIG[post.status].className)}>
                  {STATUS_CONFIG[post.status].label}
                </Badge>
                <Badge variant="outline" className={cn('font-mono text-[10px] font-semibold uppercase tracking-wider', PLATFORM_COLORS[post.platform])}>
                  {PLATFORM_ICONS[post.platform]}
                  {post.platform}
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px] font-medium text-muted-foreground">
                  v{post.currentVersion}
                </Badge>
              </div>
              <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground">
                {post.ideaTitle && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    From: {post.ideaTitle}
                  </span>
                )}
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <FileText className="h-3 w-3" />
                  {slides.length} slide{slides.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <span className="capitalize">{format}</span>
                </span>
              </div>
              {post.status === 'SCHEDULED' && scheduledDate ? (
                <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/30 text-primary">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <span>Auto-publishing scheduled for <strong className="font-mono">{scheduledDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setShowScheduleModal(true)} className="h-7 text-xs font-medium border-primary/40 hover:bg-primary/10">
                      Change Time
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleUnscheduleClick} className="h-7 text-xs text-muted-foreground hover:text-destructive">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : scheduledDate ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="shrink-0 gap-1 mt-2">
                      <Calendar className="h-3 w-3" />
                      <span>{scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end">Scheduled</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <Tabs defaultValue="preview" className="h-full" onValueChange={(v) => { setActiveSlide(0); }}>
            <TabsList className="border-b p-1 bg-muted/30 grid grid-cols-4">
              <TabsTrigger value="preview" className="flex items-center gap-2 px-3 py-2 text-sm font-medium" data-orientation="horizontal">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="slides" className="flex items-center gap-2 px-3 py-2 text-sm font-medium" data-orientation="horizontal">
                <FileText className="h-4 w-4" />
                Slides ({slides.length})
              </TabsTrigger>
              <TabsTrigger value="caption" className="flex items-center gap-2 px-3 py-2 text-sm font-medium" data-orientation="horizontal">
                <Hash className="h-4 w-4" />
                Caption
              </TabsTrigger>
              <TabsTrigger value="versions" className="flex items-center gap-2 px-3 py-2 text-sm font-medium" data-orientation="horizontal">
                <Clock className="h-4 w-4" />
                History ({post.versions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 p-4 overflow-auto">
              <div className="max-w-3xl mx-auto">{renderPreview()}</div>
            </TabsContent>

            <TabsContent value="slides" className="flex-1 p-4 overflow-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">Post Slides ({slides.length})</h3>
                    <p className="text-xs text-muted-foreground">Manage slide visuals and text copy</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateImage(undefined, undefined, true, 'template')}
                      disabled={generatingSlideId !== null}
                      className="gap-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                    >
                      {generatingSlideId === 'ALL' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Re-render All Cards
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateImage(undefined, undefined, true, 'ai')}
                      disabled={generatingSlideId !== null}
                      className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Graphics (Gemini)
                    </Button>
                  </div>
                </div>

                {slides.map((slide, idx) => (
                  <Card key={slide.id} className={cn(activeSlide === idx && 'ring-2 ring-primary')}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">Slide {idx + 1}</span>
                          <Badge variant="outline" className="text-xs capitalize">{slide.type}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateImage(slide.id, undefined, false, 'template')}
                            disabled={generatingSlideId !== null}
                            className="text-xs gap-1 h-7"
                          >
                            {generatingSlideId === slide.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Re-render Card
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateImage(slide.id, slide.imagePrompt, false, 'ai')}
                            disabled={generatingSlideId !== null}
                            className="text-xs gap-1 h-7 border-primary/30 text-primary hover:bg-primary/10"
                          >
                            <Sparkles className="h-3 w-3" />
                            AI Visual
                          </Button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveSlide(idx)}
                                className={cn(
                                  'text-xs h-7 px-2',
                                  activeSlide === idx && 'bg-primary/10 text-primary'
                                )}
                              >
                                {activeSlide === idx ? 'Viewing' : 'Select'}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Show in preview</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {slide.imageUrl && (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 mb-3 border">
                          {imageLoading[slide.id] ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="relative w-full h-full">
                              <Image
                                src={slide.imageUrl}
                                alt={altTexts[idx] || `Slide ${idx + 1}`}
                                fill
                                className="object-cover"
                                onLoad={() => handleImageLoad(slide.id)}
                                onError={() => handleImageError(slide.id)}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-3">
                        {slide.headline && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Headline</p>
                            <p className="font-medium">{slide.headline}</p>
                          </div>
                        )}
                        {slide.body && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Body</p>
                            <p>{slide.body}</p>
                          </div>
                        )}
                        {slide.text && !slide.headline && !slide.body && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Text Overlay</p>
                            <p>{slide.text}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="caption" className="flex-1 p-4 overflow-auto">
              <div className="space-y-5 max-w-2xl mx-auto">
                {/* Caption Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Caption & Hashtags
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {caption ? `${caption.split(/\s+/).filter(Boolean).length} words • ${caption.length} chars` : 'No caption'}
                    </p>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    <Button
                      variant={isEditingCaption ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsEditingCaption(!isEditingCaption);
                        if (showRegenerateCaptionPrompt) setShowRegenerateCaptionPrompt(false);
                      }}
                      className="gap-1.5 text-xs font-medium h-8"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-primary" />
                      {isEditingCaption ? 'Cancel Edit' : 'Edit Caption'}
                    </Button>

                    <Button
                      variant={showRegenerateCaptionPrompt ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => {
                        setShowRegenerateCaptionPrompt(!showRegenerateCaptionPrompt);
                        if (isEditingCaption) setIsEditingCaption(false);
                      }}
                      disabled={isRegeneratingCaption}
                      className="gap-1.5 text-xs font-medium h-8 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      {isRegeneratingCaption ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      )}
                      Regenerate with AI
                    </Button>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(caption, 'caption')}
                          className="gap-1 text-xs h-8 px-2.5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedField === 'caption' ? 'Copied!' : 'Copy'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">{copiedField === 'caption' ? 'Copied!' : 'Copy caption'}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* AI Regenerate Prompt Bar */}
                {showRegenerateCaptionPrompt && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">AI Caption Copilot</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Add specific guidance or comment</span>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Make it punchier, emphasize Meta vs Google chips, add strong call to action..."
                        value={captionAiComment}
                        onChange={(e) => setCaptionAiComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isRegeneratingCaption) {
                            e.preventDefault();
                            handleRegenerateCaption();
                          }
                        }}
                        disabled={isRegeneratingCaption}
                        className="h-9 text-xs bg-background"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleRegenerateCaption()}
                        disabled={isRegeneratingCaption}
                        className="h-9 text-xs font-semibold shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 px-3.5"
                      >
                        {isRegeneratingCaption ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                      <span className="text-[11px] text-muted-foreground mr-1">Presets:</span>
                      {[
                        { label: 'Punchier & bolder', icon: Flame, comment: 'Make it punchier, bolder, and more provocative' },
                        { label: 'More sarcastic tone', icon: Zap, comment: 'Enhance the sarcastic and opinionated brand voice' },
                        { label: 'Strong call to action', icon: Target, comment: 'End with an irresistible question and strong call to action' },
                        { label: 'Shorter (under 3 lines)', icon: TrendingDown, comment: 'Keep it super concise, under 3 lines with high impact' },
                      ].map((preset, idx) => {
                        const Icon = preset.icon;
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={isRegeneratingCaption}
                            onClick={() => {
                              setCaptionAiComment(preset.comment);
                              handleRegenerateCaption(preset.comment);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-medium bg-background hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border/80 hover:border-primary/30 px-2 py-0.5 rounded-md transition-colors"
                          >
                            <Icon className="h-3 w-3" />
                            <span>{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Manual Edit Mode */}
                {isEditingCaption ? (
                  <div className="rounded-xl border bg-card p-4 space-y-4 shadow-sm">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground">Edit Caption Text</label>
                        <span className="text-[11px] text-muted-foreground">
                          {editedCaptionText.length} characters • {editedCaptionText.split(/\s+/).filter(Boolean).length} words
                        </span>
                      </div>
                      <Textarea
                        rows={9}
                        value={editedCaptionText}
                        onChange={(e) => setEditedCaptionText(e.target.value)}
                        placeholder="Write your custom caption..."
                        className="text-sm font-sans leading-relaxed resize-y bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Edit Hashtags</label>
                      <Input
                        value={editedHashtagsText}
                        onChange={(e) => setEditedHashtagsText(e.target.value)}
                        placeholder="#tech #ai #programming #nvidia #coding"
                        className="text-xs bg-background"
                      />
                      <p className="text-[10px] text-muted-foreground">Separate hashtags with spaces or commas</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditedCaptionText(caption);
                          setEditedHashtagsText(hashtags.join(' '));
                          setIsEditingCaption(false);
                        }}
                        disabled={isSavingCaption}
                        className="text-xs h-8"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEditedCaption}
                        disabled={isSavingCaption}
                        className="text-xs font-semibold h-8 bg-primary text-primary-foreground gap-1.5"
                      >
                        {isSavingCaption ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Save Caption
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Standard Display Mode */
                  <>
                    <div>
                      <div className="p-4 bg-muted/40 rounded-xl border whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground/90 select-text">
                        {caption || <span className="text-muted-foreground italic">No caption generated yet. Click 'Regenerate with AI' or 'Edit Caption'.</span>}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground">Hashtags ({hashtags.length})</p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(hashtags.join(' '), 'hashtags')}
                              className="gap-1 text-xs h-7 px-2"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {copiedField === 'hashtags' ? 'Copied!' : 'Copy all'}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">{copiedField === 'hashtags' ? 'Copied!' : 'Copy all hashtags'}</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex flex-wrap gap-1.5 p-3 bg-muted/40 rounded-xl border">
                        {hashtags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80 text-xs py-0.5 font-normal"
                            onClick={() => copyToClipboard(tag, `tag-${idx}`)}
                          >
                            {tag}
                            {copiedField === `tag-${idx}` && <Check className="h-3 w-3 ml-1 text-green-600" />}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {altTexts.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Alt Text for Screen Readers</p>
                    <div className="space-y-1.5">
                      {altTexts.map((alt, idx) => (
                        <div key={idx} className="p-2.5 bg-muted/40 rounded-lg border text-xs">
                          <span className="font-semibold text-muted-foreground">Slide {idx + 1}:</span> {alt}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="versions" className="flex-1 p-4 overflow-auto">
              <div className="space-y-3">
                {post.versions
                  .slice()
                  .sort((a, b) => b.version - a.version)
                  .map((version) => (
                    <Card key={version.version}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">Version {version.version}</span>
                              {version.version === post.currentVersion && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(version.createdAt).toLocaleString()}
                            </p>
                            {version.feedback && (
                              <p className="text-sm text-blue-600 mt-1 bg-blue-50 dark:bg-blue-950/40 p-2 rounded">
                                Feedback: {version.feedback}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <Separator />
        <CardContent className="p-4 space-y-3">
          {showRevisionInput ? (
            <div className="space-y-3">
              <label htmlFor="revision-feedback" className="block text-sm font-medium mb-1">Revision Feedback</label>
              <textarea
                id="revision-feedback"
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="Describe what you'd like to change (e.g., 'make slide 3 punchier', 'different angle for the hook')..."
                className="w-full min-h-[80px] p-3 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring bg-background text-foreground"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowRevisionInput(false); setRevisionFeedback(''); }}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReviseClick(revisionFeedback)}
                  disabled={!revisionFeedback.trim()}
                >
                  Submit Revision
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {post.status === 'DRAFTED' || post.status === 'IN_REVISION' ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={() => setShowRevisionInput(true)} className="flex-1 sm:flex-initial gap-1">
                        <MessageSquare className="h-4 w-4" />
                        Request Revision
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Request a revision</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleApproveClick} className="flex-1 sm:flex-initial gap-1">
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Approve this draft</TooltipContent>
                  </Tooltip>
                </>
              ) : post.status === 'APPROVED' ? (
                <>
                  {onPublish && (
                    <Button
                      onClick={handlePublishClick}
                      disabled={isPublishing}
                      className="flex-1 sm:flex-initial gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Publishing to {post.platform}...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Publish to {post.platform}
                        </>
                      )}
                    </Button>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 sm:flex-initial gap-1"
                        disabled={isPublishing}
                        onClick={() => setShowScheduleModal(true)}
                      >
                        <Calendar className="h-4 w-4" />
                        Schedule Post
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Choose date & time to auto-publish</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" disabled={isPublishing} onClick={() => setShowRevisionInput(true)} className="gap-1">
                        <RotateCcw className="h-4 w-4" />
                        Revise
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Request revision</TooltipContent>
                  </Tooltip>
                </>
              ) : post.status === 'SCHEDULED' ? (
                <>
                  <Button
                    onClick={() => setShowScheduleModal(true)}
                    disabled={isPublishing}
                    className="flex-1 sm:flex-initial gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
                  >
                    <Calendar className="h-4 w-4" />
                    Reschedule
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleUnscheduleClick}
                    disabled={isPublishing}
                    className="flex-1 sm:flex-initial gap-1 text-muted-foreground hover:text-foreground"
                  >
                    Cancel Schedule
                  </Button>

                  {onPublish && (
                    <Button
                      variant="ghost"
                      onClick={handlePublishClick}
                      disabled={isPublishing}
                      className="flex-1 sm:flex-initial gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Publish Immediately Instead
                        </>
                      )}
                    </Button>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" disabled={isPublishing} onClick={() => setShowRevisionInput(true)} className="gap-1">
                        <RotateCcw className="h-4 w-4" />
                        Revise
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Request revision</TooltipContent>
                  </Tooltip>
                </>
              ) : post.status === 'POSTED' ? (
                <Badge variant="outline" className="text-sm gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950">
                  <Check className="h-3 w-3" />
                  Published
                </Badge>
              ) : post.status === 'FAILED' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" disabled={isPublishing} onClick={handlePublishClick} className="gap-1">
                      {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      Retry Publish
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Retry publishing</TooltipContent>
                </Tooltip>
              ) : (
                <Button disabled={isPublishing} onClick={handleApproveClick}>Approve</Button>
              )}

              {onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 ml-auto"
                      onClick={() => onDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Delete draft</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </CardContent>

        <ScheduleModal
          open={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onConfirm={(date) => handleScheduleClick(date)}
          platform={post.platform}
          postTitle={post.title}
          initialDate={post.scheduledAt}
        />
      </Card>
    </TooltipProvider>
  );
}
