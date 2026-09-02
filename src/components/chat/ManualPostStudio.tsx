'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Camera,
  Briefcase,
  Pin,
  Plus,
  Trash2,
  Upload,
  Clock,
  Check,
  Calendar as CalendarIcon,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Platform } from '@/types';
import { cn } from '@/lib/utils';

interface SlideDraft {
  id: string;
  headline: string;
  body: string;
  imageUrl?: string;
  imageFileName?: string;
}

const PLATFORM_CONFIG: Record<Platform, { name: string; icon: React.ReactNode; formatLabel: string }> = {
  INSTAGRAM: { name: 'Instagram', icon: <Camera className="h-4 w-4" />, formatLabel: 'Carousel Deck / Post' },
  LINKEDIN: { name: 'LinkedIn', icon: <Briefcase className="h-4 w-4" />, formatLabel: 'Article / Image Post' },
  PINTEREST: { name: 'Pinterest', icon: <Pin className="h-4 w-4" />, formatLabel: 'Idea Pin / Visual Card' },
};

export function ManualPostStudio() {
  const router = useRouter();

  const [platform, setPlatform] = useState<Platform>('INSTAGRAM');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>(['#tech', '#buildinpublic']);

  const [slides, setSlides] = useState<SlideDraft[]>([
    {
      id: 'slide-1',
      headline: '',
      body: '',
    },
  ]);

  // Mode: 'APPROVED' (Save to approved queue), 'SCHEDULED' (Pick date/time), 'PUBLISH_NOW'
  const [publishMode, setPublishMode] = useState<'APPROVED' | 'SCHEDULED' | 'PUBLISH_NOW'>('APPROVED');

  // Scheduling state
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  });
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Slide management
  const addSlide = () => {
    setSlides((prev) => [
      ...prev,
      {
        id: `slide-${Date.now()}`,
        headline: '',
        body: '',
      },
    ]);
  };

  const removeSlide = (id: string) => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlide = (id: string, field: keyof SlideDraft, value: string) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    setSlides((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Image upload handling
  const handleImageFileChange = async (slideId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlideId(slideId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        updateSlide(slideId, 'imageUrl', data.dataUrl || data.url);
        updateSlide(slideId, 'imageFileName', file.name);
      } else {
        // Fallback to local FileReader base64
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            updateSlide(slideId, 'imageUrl', event.target.result as string);
            updateSlide(slideId, 'imageFileName', file.name);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Upload API failed, reading as data URL:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateSlide(slideId, 'imageUrl', event.target.result as string);
          updateSlide(slideId, 'imageFileName', file.name);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingSlideId(null);
    }
  };

  // Hashtags
  const handleAddHashtag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const raw = hashtagInput.trim().replace(/^#/, '');
      if (raw && !hashtags.includes(`#${raw}`)) {
        setHashtags((prev) => [...prev, `#${raw}`]);
        setHashtagInput('');
      }
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  };

  // Quick preset dates
  const applyQuickPreset = (daysFromNow: number, hour: number, minute: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    target.setHours(hour, minute, 0, 0);

    setSelectedDay(target);
    const period: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    setSelectedHour(String(displayHour).padStart(2, '0'));
    setSelectedMinute(String(minute).padStart(2, '0'));
    setSelectedPeriod(period);
  };

  // Compute scheduled target date
  const computeTargetDate = (): Date => {
    const date = new Date(selectedDay);
    let hour = parseInt(selectedHour, 10);
    if (selectedPeriod === 'PM' && hour !== 12) hour += 12;
    if (selectedPeriod === 'AM' && hour === 12) hour = 0;
    date.setHours(hour, parseInt(selectedMinute, 10), 0, 0);
    return date;
  };

  // Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a title for this post.');
      return;
    }

    setIsSubmitting(true);

    try {
      let scheduledAt: string | undefined = undefined;
      if (publishMode === 'SCHEDULED') {
        const targetDate = computeTargetDate();
        if (targetDate <= new Date()) {
          setErrorMessage('Scheduled time must be in the future.');
          setIsSubmitting(false);
          return;
        }
        scheduledAt = targetDate.toISOString();
      }

      const payload = {
        title: title.trim(),
        platform,
        slides: slides.map((s, idx) => ({
          id: s.id,
          type: s.imageUrl ? 'mixed' : 'text',
          imageUrl: s.imageUrl,
          headline: s.headline.trim() || `Slide ${idx + 1}`,
          body: s.body.trim(),
          text: s.body.trim(),
          order: idx + 1,
        })),
        caption: caption.trim() || title.trim(),
        hashtags,
        scheduledAt,
        publishImmediately: publishMode === 'PUBLISH_NOW',
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create post');
      }

      const data = await res.json();
      const createdStatus = data.post?.status;

      setSuccessMessage(
        createdStatus === 'SCHEDULED'
          ? 'Post scheduled successfully! Appears in Kanban "Scheduled".'
          : createdStatus === 'POSTED'
          ? 'Post published live successfully!'
          : 'Post saved as Approved! Appears in Kanban "Approved".'
      );

      setTimeout(() => {
        router.push('/kanban');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-none border border-border bg-surface text-xs font-mono text-muted-foreground mb-1">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Manual Production Studio</span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Create Post from Scratch</h2>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Craft custom carousels or single posts with images, captions, and direct scheduling.
          </p>
        </div>

        <Badge variant="outline" className="text-xs font-mono h-7 px-3 rounded-none border border-primary text-primary font-bold self-start sm:self-auto">
          Skip Ideation Flow
        </Badge>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-surface border border-destructive text-destructive font-mono text-xs rounded-none flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-surface border border-emerald-500 text-emerald-400 font-mono text-xs rounded-none flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
            1. Target Platform
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['INSTAGRAM', 'LINKEDIN', 'PINTEREST'] as Platform[]).map((p) => {
              const cfg = PLATFORM_CONFIG[p];
              const isSelected = platform === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={cn(
                    'p-3.5 rounded-none border text-left flex items-center justify-between transition-all',
                    isSelected
                      ? 'bg-surface border-primary ring-1 ring-primary'
                      : 'bg-card border-border hover:border-primary/60 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn('p-2 rounded-none border border-border bg-background', isSelected && 'text-primary border-primary')}>
                      {cfg.icon}
                    </div>
                    <div>
                      <p className="font-display font-bold text-sm text-foreground">{cfg.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{cfg.formatLabel}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Post Title */}
        <div className="space-y-2">
          <Label htmlFor="post-title" className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
            2. Post Title / Internal Identifier
          </Label>
          <Input
            id="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 5 Docker Optimization Tricks for Next.js Developers"
            className="h-10 text-sm font-mono rounded-none border-border"
            required
          />
        </div>

        {/* Slides & Media Manager */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              3. Visual Slides & Images ({slides.length})
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSlide}
              className="h-8 text-xs font-mono font-bold rounded-none border-border bg-surface hover:border-primary gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Slide
            </Button>
          </div>

          <div className="space-y-4">
            {slides.map((slide, index) => (
              <Card key={slide.id} className="rounded-none border border-border bg-card" elevation="none">
                <CardHeader className="p-3 border-b border-border bg-surface flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono font-bold rounded-none border-border bg-background">
                      SLIDE {String(index + 1).padStart(2, '0')}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground truncate">
                      {slide.headline || `Slide ${index + 1}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none border border-border"
                      disabled={index === 0}
                      onClick={() => moveSlide(index, 'up')}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none border border-border"
                      disabled={index === slides.length - 1}
                      onClick={() => moveSlide(index, 'down')}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    {slides.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-none border border-destructive text-destructive hover:bg-surface"
                        onClick={() => removeSlide(slide.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 items-start">
                  {/* Image Upload Column */}
                  <div className="space-y-2">
                    <div className="relative aspect-[4/5] bg-surface rounded-none border border-border flex flex-col items-center justify-center overflow-hidden group">
                      {slide.imageUrl ? (
                        <>
                          <Image
                            src={slide.imageUrl}
                            alt={slide.headline || `Slide ${index + 1}`}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 text-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-7 text-[10px] font-mono rounded-none"
                              onClick={() => fileInputRefs.current[slide.id]?.click()}
                            >
                              Replace Image
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-7 text-[10px] font-mono rounded-none"
                              onClick={() => updateSlide(slide.id, 'imageUrl', '')}
                            >
                              Remove
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div
                          className="flex flex-col items-center justify-center p-3 text-center cursor-pointer h-full w-full hover:bg-muted/10 transition-colors"
                          onClick={() => fileInputRefs.current[slide.id]?.click()}
                        >
                          {uploadingSlideId === slide.id ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-muted-foreground mb-1.5" />
                              <span className="text-[11px] font-mono font-bold text-foreground">Upload Image</span>
                              <span className="text-[9px] font-mono text-muted-foreground mt-0.5">PNG, JPG, WebP</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={(el) => {
                        fileInputRefs.current[slide.id] = el;
                      }}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(slide.id, e)}
                    />

                    {slide.imageFileName && (
                      <p className="text-[10px] font-mono text-muted-foreground truncate">
                        {slide.imageFileName}
                      </p>
                    )}
                  </div>

                  {/* Text Details Column */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-mono font-semibold text-foreground">
                        Slide Headline / Hook
                      </Label>
                      <Input
                        value={slide.headline}
                        onChange={(e) => updateSlide(slide.id, 'headline', e.target.value)}
                        placeholder="e.g. 01. Build Multi-Stage Docker Images"
                        className="h-9 text-xs font-mono rounded-none border-border"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-mono font-semibold text-foreground">
                        Slide Body / Insight (Optional)
                      </Label>
                      <Textarea
                        rows={3}
                        value={slide.body}
                        onChange={(e) => updateSlide(slide.id, 'body', e.target.value)}
                        placeholder="Explain the technical detail, code snippet, or takeaway for this slide..."
                        className="text-xs font-mono rounded-none border-border resize-y bg-background"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Caption & Hashtags */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="post-caption" className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                4. Post Caption
              </Label>
              <span className="text-[11px] font-mono text-muted-foreground">
                {caption.length} characters
              </span>
            </div>
            <Textarea
              id="post-caption"
              rows={5}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write the full post caption here..."
              className="text-xs font-mono rounded-none border-border resize-y bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              5. Hashtags
            </Label>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-surface border border-border rounded-none">
              {hashtags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs font-mono rounded-none border flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeHashtag(tag)}
                    className="hover:text-destructive transition-colors ml-0.5"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleAddHashtag}
                placeholder="Type tag & press Enter..."
                className="bg-transparent text-xs font-mono outline-none px-1 py-0.5 text-foreground placeholder:text-muted-foreground flex-1 min-w-[140px]"
              />
            </div>
          </div>
        </div>

        {/* Scheduling & Publish Strategy */}
        <div className="space-y-3 pt-2 border-t border-border">
          <Label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
            6. Publishing & Scheduling Strategy
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPublishMode('APPROVED')}
              className={cn(
                'p-3.5 rounded-none border text-left transition-all',
                publishMode === 'APPROVED'
                  ? 'bg-surface border-blue-500 ring-1 ring-blue-500'
                  : 'bg-card border-border hover:border-border/80 text-muted-foreground'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-xs text-foreground">Save to Approved</span>
                <Badge className="badge-approved">Approved</Badge>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                Appears in Kanban &quot;Approved&quot; column ready for manual queueing.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPublishMode('SCHEDULED')}
              className={cn(
                'p-3.5 rounded-none border text-left transition-all',
                publishMode === 'SCHEDULED'
                  ? 'bg-surface border-primary ring-1 ring-primary'
                  : 'bg-card border-border hover:border-border/80 text-muted-foreground'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-xs text-foreground">Schedule Date & Time</span>
                <Badge className="badge-scheduled">Scheduled</Badge>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                Appears in Kanban &quot;Scheduled&quot; and publishes automatically via cron.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPublishMode('PUBLISH_NOW')}
              className={cn(
                'p-3.5 rounded-none border text-left transition-all',
                publishMode === 'PUBLISH_NOW'
                  ? 'bg-surface border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-card border-border hover:border-border/80 text-muted-foreground'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-xs text-foreground">Publish Immediately</span>
                <Badge className="badge-posted">Live Now</Badge>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                Directly pushes to live social profile via Composio right now.
              </p>
            </button>
          </div>

          {/* Date & Time Picker when Scheduled */}
          {publishMode === 'SCHEDULED' && (
            <div className="p-4 bg-surface border border-border rounded-none space-y-4 animate-in fade-in-50">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickPreset(1, 9, 0)}
                  className="h-8 text-xs font-mono rounded-none border-border bg-background hover:border-primary"
                >
                  Tomorrow 9:00 AM
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickPreset(1, 18, 0)}
                  className="h-8 text-xs font-mono rounded-none border-border bg-background hover:border-primary"
                >
                  Tomorrow 6:00 PM
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickPreset(2, 11, 30)}
                  className="h-8 text-xs font-mono rounded-none border-border bg-background hover:border-primary"
                >
                  In 2 Days (11:30 AM)
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
                <div className="rounded-none border border-border bg-background p-1 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDay}
                    onSelect={(d) => d && setSelectedDay(d)}
                    disabled={{ before: new Date() }}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Select Publishing Time
                  </Label>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedHour}
                      onChange={(e) => setSelectedHour(e.target.value)}
                      className="w-24 h-10 px-3 rounded-none border border-border bg-background text-xs font-mono font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>

                    <span className="font-mono font-bold text-muted-foreground">:</span>

                    <select
                      value={selectedMinute}
                      onChange={(e) => setSelectedMinute(e.target.value)}
                      className="w-24 h-10 px-3 rounded-none border border-border bg-background text-xs font-mono font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      {['00', '15', '30', '45'].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <div className="flex rounded-none border border-border bg-background p-0.5 h-10">
                      <button
                        type="button"
                        onClick={() => setSelectedPeriod('AM')}
                        className={cn(
                          'px-3 py-1 text-xs font-mono font-bold rounded-none',
                          selectedPeriod === 'AM' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                        )}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPeriod('PM')}
                        className={cn(
                          'px-3 py-1 text-xs font-mono font-bold rounded-none',
                          selectedPeriod === 'PM' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                        )}
                      >
                        PM
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-background border border-border rounded-none text-xs font-mono">
                    <span className="text-muted-foreground">Target Date: </span>
                    <span className="font-bold text-foreground">
                      {format(computeTargetDate(), 'EEEE, MMMM d, yyyy • h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'h-11 px-8 rounded-none font-mono font-bold uppercase tracking-wider text-xs transition-all border',
              publishMode === 'PUBLISH_NOW'
                ? 'bg-emerald-500 text-black border-emerald-500 hover:opacity-90'
                : publishMode === 'SCHEDULED'
                ? 'bg-primary text-primary-foreground border-primary hover:opacity-90'
                : 'bg-blue-600 text-white border-blue-600 hover:opacity-90'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Post...
              </>
            ) : publishMode === 'PUBLISH_NOW' ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publish Live to {PLATFORM_CONFIG[platform].name}
              </>
            ) : publishMode === 'SCHEDULED' ? (
              <>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule Post
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save as Approved Post
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
