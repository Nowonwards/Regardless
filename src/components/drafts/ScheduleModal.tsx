'use client';

import { useState } from 'react';
import { format, addDays, setHours, setMinutes, isPast } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Sparkles, X, Check, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Platform } from '@/types';
import { cn } from '@/lib/utils';

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (scheduledDate: Date) => void;
  platform: Platform;
  postTitle: string;
  initialDate?: Date | string | null;
}

const TIME_PRESETS = [
  { label: '9:00 AM', hour: '9', minute: '00', period: 'AM' as const },
  { label: '12:00 PM', hour: '12', minute: '00', period: 'PM' as const },
  { label: '3:30 PM', hour: '3', minute: '30', period: 'PM' as const },
  { label: '6:00 PM', hour: '6', minute: '00', period: 'PM' as const },
  { label: '8:00 PM', hour: '8', minute: '00', period: 'PM' as const },
];

export function ScheduleModal({
  open,
  onClose,
  onConfirm,
  platform,
  postTitle,
  initialDate,
}: ScheduleModalProps) {
  const getDefaultDate = () => {
    if (initialDate) {
      const parsed = new Date(initialDate);
      if (!isNaN(parsed.getTime()) && !isPast(parsed)) return parsed;
    }
    // Default to tomorrow at 10:00 AM
    return setMinutes(setHours(addDays(new Date(), 1), 10), 0);
  };

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(getDefaultDate());
  const [selectedHour, setSelectedHour] = useState<string>(() => {
    const d = getDefaultDate();
    const h = d.getHours();
    return h === 0 ? '12' : h > 12 ? String(h - 12) : String(h);
  });
  const [selectedMinute, setSelectedMinute] = useState<string>(() => {
    const m = getDefaultDate().getMinutes();
    return m < 15 ? '00' : m < 30 ? '15' : m < 45 ? '30' : '45';
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(() => {
    return getDefaultDate().getHours() >= 12 ? 'PM' : 'AM';
  });

  if (!open) return null;

  const calculateTargetDate = (): Date => {
    const base = selectedDay || new Date();
    let hour = parseInt(selectedHour, 10) || 12;
    if (selectedPeriod === 'PM' && hour < 12) hour += 12;
    if (selectedPeriod === 'AM' && hour === 12) hour = 0;
    const minute = parseInt(selectedMinute, 10) || 0;
    return setMinutes(setHours(base, hour), minute);
  };

  const targetDate = calculateTargetDate();
  const isTargetInPast = isPast(targetDate);

  const applyQuickPreset = (daysFromNow: number, hour24: number, min: number) => {
    const target = setMinutes(setHours(addDays(new Date(), daysFromNow), hour24), min);
    setSelectedDay(target);
    const h = target.getHours();
    setSelectedHour(h === 0 ? '12' : h > 12 ? String(h - 12) : String(h));
    const m = target.getMinutes();
    setSelectedMinute(m < 10 ? `0${m}` : String(m));
    setSelectedPeriod(h >= 12 ? 'PM' : 'AM');
  };

  const handleConfirm = () => {
    if (isTargetInPast) return;
    onConfirm(targetDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl rounded-none border border-border bg-card p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-none border border-border bg-surface text-primary">
                <CalendarIcon className="h-4 w-4" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground">Schedule Post</h3>
              <Badge variant="outline" className="text-xs font-mono font-bold uppercase tracking-wider rounded-none border">
                {platform}
              </Badge>
            </div>
            <p className="text-xs font-mono text-muted-foreground line-clamp-1">{postTitle}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-none border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            Quick Scheduling Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyQuickPreset(1, 9, 0)}
              className="h-8 text-xs font-mono rounded-none border-border bg-surface hover:border-primary"
            >
              Tomorrow 9:00 AM
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyQuickPreset(1, 18, 0)}
              className="h-8 text-xs font-mono rounded-none border-border bg-surface hover:border-primary"
            >
              Tomorrow 6:00 PM
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyQuickPreset(2, 11, 30)}
              className="h-8 text-xs font-mono rounded-none border-border bg-surface hover:border-primary"
            >
              In 2 Days (11:30 AM)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyQuickPreset(3, 15, 0)}
              className="h-8 text-xs font-mono rounded-none border-border bg-surface hover:border-primary"
            >
              In 3 Days (3:00 PM)
            </Button>
          </div>
        </div>

        {/* Date & Time Picker Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
          {/* Calendar Day Picker */}
          <div className="rounded-none border border-border bg-surface p-1 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={(day) => day && setSelectedDay(day)}
              disabled={{ before: new Date() }}
            />
          </div>

          {/* Time Configuration & Preview Column */}
          <div className="space-y-5">
            {/* Time Selectors */}
            <div className="space-y-2.5">
              <label className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Select Publishing Time
              </label>

              <div className="flex items-center gap-2">
                {/* Hour Select */}
                <div className="flex-1">
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(e.target.value)}
                    className="w-full h-10 px-3 rounded-none border border-border bg-background text-xs font-mono font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                      <option key={h} value={h}>
                        {h.padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="font-bold text-muted-foreground text-base">:</span>

                {/* Minute Select */}
                <div className="flex-1">
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    className="w-full h-10 px-3 rounded-none border border-border bg-background text-xs font-mono font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {['00', '15', '30', '45'].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AM / PM Segmented Switch */}
                <div className="flex rounded-none border border-border bg-surface p-1 h-10">
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod('AM')}
                    className={cn(
                      'px-3 py-1 text-xs font-mono font-bold rounded-none transition-all',
                      selectedPeriod === 'AM'
                        ? 'bg-primary text-primary-foreground border border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod('PM')}
                    className={cn(
                      'px-3 py-1 text-xs font-mono font-bold rounded-none transition-all',
                      selectedPeriod === 'PM'
                        ? 'bg-primary text-primary-foreground border border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Time Quick Chips */}
              <div className="flex items-center flex-wrap gap-1.5 pt-1">
                {TIME_PRESETS.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedHour(t.hour);
                      setSelectedMinute(t.minute);
                      setSelectedPeriod(t.period);
                    }}
                    className={cn(
                      'text-[10px] font-mono px-2 py-0.5 rounded-none border transition-colors',
                      selectedHour === t.hour && selectedMinute === t.minute && selectedPeriod === t.period
                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                        : 'bg-surface border-border text-muted-foreground hover:text-foreground hover:border-primary'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheduled Output Confirmation Card */}
            <div
              className={cn(
                'p-4 rounded-none border text-xs leading-relaxed space-y-1.5 transition-colors font-mono',
                isTargetInPast
                  ? 'bg-surface border-destructive text-destructive'
                  : 'bg-surface border-border text-foreground'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                  Target Auto-Publish Date
                </span>
                {!isTargetInPast && (
                  <Badge variant="outline" className="text-[10px] font-mono h-5 bg-primary text-primary-foreground border-primary font-bold rounded-none gap-1">
                    <Check className="h-2.5 w-2.5" /> Ready
                  </Badge>
                )}
              </div>

              <p className="font-display font-bold text-sm text-foreground">
                {format(targetDate, 'EEEE, MMMM d, yyyy • h:mm a')}
              </p>

              {isTargetInPast && (
                <div className="flex items-center gap-1.5 text-xs text-destructive font-mono pt-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>The selected time is in the past. Please select a future time.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs font-mono text-muted-foreground">
            The background worker will automatically publish this post at the exact time.
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-none border border-border text-xs font-mono h-9 px-4">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isTargetInPast}
              className="rounded-none text-xs font-mono font-bold uppercase tracking-wider gap-1.5 bg-primary hover:opacity-90 text-primary-foreground border border-primary h-9 px-5 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Confirm Schedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
