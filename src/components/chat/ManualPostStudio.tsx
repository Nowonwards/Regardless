'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Instagram as InstagramIcon,
  Linkedin as LinkedinIcon,
  Plus,
  Trash2,
  Upload,
  ChevronUp,
  ChevronDown,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Platform } from '@/types';
import { cn } from '@/lib/utils';

interface SlideDraft {
  id: string;
  headline: string;
  body: string;
  imageUrl?: string;
  imageFileName?: string;
}

const PLATFORM_CONFIG: {
  id: Platform;
  name: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'INSTAGRAM',
    name: 'Instagram',
    desc: 'Carousels and posts',
    icon: <InstagramIcon className="h-5 w-5" />,
  },
  {
    id: 'LINKEDIN',
    name: 'LinkedIn',
    desc: 'Articles and image posts',
    icon: <LinkedinIcon className="h-5 w-5" />,
  },
  {
    id: 'PINTEREST',
    name: 'Pinterest',
    desc: 'Idea pins and visual cards',
    icon: <span className="font-mono font-bold text-sm">P</span>,
  },
];

export function ManualPostStudio() {
  const router = useRouter();

  const [platform, setPlatform] = useState<Platform>('INSTAGRAM');
  const [title, setTitle] = useState('');
  const [activeSlideId, setActiveSlideId] = useState<string>('slide-1');
  const [slides, setSlides] = useState<SlideDraft[]>([
    {
      id: 'slide-1',
      headline: '',
      body: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const activeIndex = Math.max(
    0,
    slides.findIndex((s) => s.id === activeSlideId)
  );
  const activeSlide = slides[activeIndex] || slides[0];

  const addSlide = () => {
    const newId = `slide-${Date.now()}`;
    setSlides((prev) => [
      ...prev,
      {
        id: newId,
        headline: '',
        body: '',
      },
    ]);
    setActiveSlideId(newId);
  };

  const removeSlide = (id: string) => {
    if (slides.length <= 1) return;
    setSlides((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (activeSlideId === id) {
        setActiveSlideId(filtered[0]?.id || '');
      }
      return filtered;
    });
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

  const handleImageFileChange = async (
    slideId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            updateSlide(slideId, 'imageUrl', event.target.result as string);
            updateSlide(slideId, 'imageFileName', file.name);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
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

  const handleSaveDraft = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a post title to name your draft.');
      return;
    }

    setIsSubmitting(true);
    try {
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
        caption: title.trim(),
        hashtags: ['#tech', '#software'],
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save draft');
      }

      setSuccessMessage('Draft saved successfully! Redirecting to drafts...');
      setTimeout(() => {
        router.push('/drafts');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a post title before scheduling.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(9, 0, 0, 0);

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
        caption: title.trim(),
        hashtags: ['#tech', '#software'],
        scheduledAt: targetDate.toISOString(),
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to schedule post');
      }

      setSuccessMessage('Post scheduled for tomorrow 9:00 AM! Redirecting...');
      setTimeout(() => {
        router.push('/calendar');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to schedule post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-[1080px]:flex-row items-start gap-8 w-full pb-12">
      {/* Editor on the Left */}
      <div className="flex-1 w-full space-y-8 min-w-0">
        {errorMessage && (
          <div className="p-3 bg-destructive text-white border-2 border-border font-sans text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-surface border-2 border-border text-foreground font-sans text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Step 1: Platform */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] font-bold border-2 border-border px-1.5 py-0.5 bg-muted text-foreground">
              01
            </span>
            <h2 className="font-sans font-bold text-lg text-foreground">Platform</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            This sets the slide format and caption limits.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {PLATFORM_CONFIG.map((plat) => {
              const isSelected = platform === plat.id;
              return (
                <button
                  key={plat.id}
                  type="button"
                  onClick={() => setPlatform(plat.id)}
                  className={cn(
                    'relative border-2 text-left p-4 flex flex-col justify-between min-h-[120px] transition-all bg-card cursor-pointer select-none',
                    isSelected
                      ? 'border-primary shadow-[5px_5px_0_0_#FF4B1F] -translate-x-[2px] -translate-y-[2px]'
                      : 'border-border hover:shadow-[3px_3px_0_0_var(--border)]'
                  )}
                >
                  {isSelected && (
                    <div
                      className="absolute top-2 right-2 w-[22px] h-[22px] bg-primary text-primary-foreground flex items-center justify-center select-none"
                      aria-hidden="true"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}

                  <div>
                    <div className="w-[30px] h-[30px] border-2 border-border bg-background flex items-center justify-center mb-2 text-foreground">
                      {plat.icon}
                    </div>
                    <h3 className="font-sans font-bold text-sm text-foreground">
                      {plat.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {plat.desc}
                    </p>
                  </div>

                  <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-3">
                    Connected
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Post title */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] font-bold border-2 border-border px-1.5 py-0.5 bg-muted text-foreground">
              02
            </span>
            <h2 className="font-sans font-bold text-lg text-foreground">Post title</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Only you see this. It names the draft.
          </p>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 5 Architecture Patterns for High-Throughput APIs"
            className="w-full h-11 px-3 border-2 border-border bg-card font-sans text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent"
          />
        </section>

        {/* Step 3: Slides */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] font-bold border-2 border-border px-1.5 py-0.5 bg-muted text-foreground">
                03
              </span>
              <h2 className="font-sans font-bold text-lg text-foreground">Slides</h2>
              <span className="font-mono text-xs text-muted-foreground ml-1">
                {String(slides.length).padStart(2, '0')} slides
              </span>
            </div>

            <button
              type="button"
              onClick={addSlide}
              className="border-2 border-border bg-card text-foreground shadow-[2px_2px_0_0_var(--border)] font-sans font-bold text-xs px-3 py-1.5 inline-flex items-center gap-1.5 hover:bg-muted active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add slide</span>
            </button>
          </div>

          {/* Slides List */}
          <div className="space-y-3">
            {slides.map((slide, index) => {
              const isExpanded = slide.id === activeSlideId;
              const slideNumber = String(index + 1).padStart(2, '0');

              return (
                <div
                  key={slide.id}
                  className={cn(
                    'border-2 transition-all bg-card',
                    isExpanded
                      ? 'border-[#1F3DFF] shadow-[5px_5px_0_0_#1F3DFF]'
                      : 'border-border'
                  )}
                >
                  {/* Collapsible Header */}
                  <div
                    onClick={() => setActiveSlideId(slide.id)}
                    className={cn(
                      'p-3 flex items-center justify-between gap-3 cursor-pointer select-none bg-card',
                      isExpanded && 'border-b-2 border-border'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-muted-foreground shrink-0">
                        {slideNumber}
                      </span>
                      <span className="font-sans font-bold text-sm text-foreground truncate">
                        {slide.headline.trim() || 'Untitled slide'}
                      </span>
                    </div>

                    {/* Action Icon Buttons */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveSlide(index, 'up')}
                        aria-label={`Move slide ${index + 1} up`}
                        className="w-[30px] h-[30px] border-2 border-border bg-background flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={index === slides.length - 1}
                        onClick={() => moveSlide(index, 'down')}
                        aria-label={`Move slide ${index + 1} down`}
                        className="w-[30px] h-[30px] border-2 border-border bg-background flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={slides.length <= 1}
                        onClick={() => removeSlide(slide.id)}
                        aria-label={`Delete slide ${index + 1}`}
                        className="w-[30px] h-[30px] border-2 border-border bg-background flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-4">
                      {/* Left: Dashed 4:5 Upload Zone */}
                      <div className="relative">
                        <input
                          type="file"
                          ref={(el) => {
                            fileInputRefs.current[slide.id] = el;
                          }}
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(slide.id, e)}
                        />

                        {slide.imageUrl ? (
                          <div className="relative w-full aspect-[4/5] border-2 border-border overflow-hidden bg-black group">
                            <Image
                              src={slide.imageUrl}
                              alt="Slide image"
                              fill
                              unoptimized
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center transition-opacity">
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[slide.id]?.click()}
                                className="border border-white bg-white/20 text-white font-mono text-[10px] px-2 py-1 mb-1"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSlide(slide.id, 'imageUrl', '')}
                                className="border border-white bg-destructive text-white font-mono text-[10px] px-2 py-1"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[slide.id]?.click()}
                            className="w-full aspect-[4/5] border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 flex flex-col items-center justify-center p-3 text-center transition-colors select-none"
                          >
                            {uploadingSlideId === slide.id ? (
                              <Loader2 className="h-5 w-5 animate-spin text-foreground mb-1" />
                            ) : (
                              <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                            )}
                            <span className="font-sans font-bold text-[13px] text-foreground">
                              Upload image
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground mt-0.5">
                              PNG, JPG or WebP
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Right: Headline & Body */}
                      <div className="space-y-3">
                        <div>
                          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Headline
                          </label>
                          <input
                            type="text"
                            value={slide.headline}
                            onChange={(e) => updateSlide(slide.id, 'headline', e.target.value)}
                            placeholder="e.g. Stop Using Microservices For Everything"
                            className="w-full h-10 px-3 border-2 border-border bg-card font-sans text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent"
                          />
                        </div>

                        <div>
                          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Body (optional)
                          </label>
                          <textarea
                            value={slide.body}
                            onChange={(e) => updateSlide(slide.id, 'body', e.target.value)}
                            placeholder="Explain the core takeaway, provide code snippets, or list bullet points..."
                            rows={3}
                            className="w-full min-h-[96px] p-2.5 border-2 border-border bg-card font-sans text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent resize-y"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Sticky Preview Column on Right (340px, top 20px) */}
      <div className="w-full min-[1080px]:w-[340px] shrink-0 min-[1080px]:sticky min-[1080px]:top-[20px]">
        <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0_0_var(--border)] h-auto">
          {/* Label row */}
          <div className="flex items-center justify-between pb-2 border-b-2 border-border">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Live preview
            </span>
            <span className="font-mono text-[11px] font-bold uppercase text-foreground">
              {platform}
            </span>
          </div>

          {/* Preview frame (max 280px wide, centered, 4:5 slide about 350px tall) */}
          <div className="max-w-[280px] w-full mx-auto border-2 border-border bg-[#0B0B0C] text-white mt-3 overflow-hidden shadow-[4px_4px_0_0_var(--border)]">
            {/* Header (26px orange square avatar, regardless.dev) */}
            <div className="h-9 px-3 border-b border-zinc-800 flex items-center gap-2 bg-[#0B0B0C]">
              <div className="w-[26px] h-[26px] bg-[#FF4B1F] flex items-center justify-center font-bold text-xs text-black shrink-0 font-sans">
                R
              </div>
              <span className="font-sans font-bold text-xs text-zinc-100 truncate">
                regardless.dev
              </span>
            </div>

            {/* The 4:5 Slide (~350px tall at 280px width) */}
            <div className="w-full aspect-[4/5] bg-[#12141C] p-4 flex flex-col justify-between relative select-none overflow-hidden text-left">
              {/* Top Accent & Counter */}
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-1 bg-[#FF4B1F]" />
                <span className="font-mono text-[10px] text-zinc-400 bg-white/10 px-1.5 py-0.5 border border-white/20">
                  {String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </span>
              </div>

              {/* Slide Content */}
              <div className="my-auto space-y-2">
                <h3 className="font-sans font-bold text-base leading-snug text-white">
                  {activeSlide.headline.trim() || 'Your headline appears here'}
                </h3>
                {activeSlide.body.trim() && (
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap line-clamp-6">
                    {activeSlide.body}
                  </p>
                )}
              </div>

              {/* Slide Footer */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5">
                  {slides.map((s, idx) => (
                    <span
                      key={s.id}
                      className={cn(
                        'w-2 h-2 border border-zinc-600 block',
                        idx === activeIndex
                          ? 'bg-[#1F3DFF] border-[#1F3DFF]'
                          : 'bg-transparent'
                      )}
                    />
                  ))}
                </div>
                <span>
                  {activeIndex + 1} of {slides.length}
                </span>
              </div>
            </div>
          </div>

          {/* 2-column button grid (gap 12px, max 280px, centered, padding 9px 8px, 4px right/bottom padding for hard shadows) */}
          <div className="grid grid-cols-2 gap-3 max-w-[280px] w-full mx-auto mt-4 pr-1 pb-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveDraft}
              className="min-w-0 whitespace-nowrap px-2 py-[9px] text-xs font-sans font-bold border-2 border-border bg-card text-foreground shadow-[3px_3px_0_0_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save draft
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSchedule}
              className="min-w-0 whitespace-nowrap px-2 py-[9px] text-xs font-sans font-bold border-2 border-border bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
