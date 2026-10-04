'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { format, addDays, isSameDay, formatDistanceToNow } from 'date-fns';
import { publishNowAction, retryPostAction } from './actions';
import styles from './overview.module.css';

export interface OverviewSlide {
  headline?: string;
  text?: string;
  imageUrl?: string;
}

export interface OverviewPost {
  id: string;
  title: string;
  status: 'IDEA' | 'SELECTED' | 'DRAFTED' | 'IN_REVISION' | 'APPROVED' | 'SCHEDULED' | 'POSTED' | 'FAILED';
  platform: 'INSTAGRAM' | 'LINKEDIN' | 'PINTEREST';
  scheduledAt: string | null;
  errorMessage?: string | null;
  slidesCount: number;
  firstSlide?: OverviewSlide | null;
}

interface OverviewClientProps {
  headlineCount: number;
  needsApprovalCount: number;
  failedCount: number;
  nextPost: OverviewPost | null;
  pipelineCounts: {
    ideas: number;
    drafted: number;
    revision: number;
    approved: number;
    scheduled: number;
    posted: number;
  };
  weekPosts: OverviewPost[];
  failedPost: OverviewPost | null;
  queuePosts: OverviewPost[];
}

const PLATFORM_SHORT: Record<string, string> = {
  INSTAGRAM: 'IG',
  LINKEDIN: 'LinkedIn',
  PINTEREST: 'Pinterest',
};

const PLATFORM_NAME: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  PINTEREST: 'Pinterest',
};

export function OverviewClient({
  headlineCount,
  needsApprovalCount,
  failedCount,
  nextPost,
  pipelineCounts,
  weekPosts,
  failedPost,
  queuePosts,
}: OverviewClientProps) {
  const [isPending, startTransition] = useTransition();

  const handlePublishNow = (postId: string) => {
    startTransition(async () => {
      try {
        await publishNowAction(postId);
      } catch (err) {
        console.error('Failed to publish now:', err);
      }
    });
  };

  const handleRetry = (postId: string) => {
    startTransition(async () => {
      try {
        await retryPostAction(postId);
      } catch (err) {
        console.error('Failed to retry post:', err);
      }
    });
  };

  // Headline
  const headline =
    headlineCount === 0
      ? 'Nothing is scheduled this week.'
      : headlineCount === 1
      ? 'One post goes out this week.'
      : `${headlineCount} posts go out this week.`;

  // Subtitle
  const subClauses: string[] = [];
  if (needsApprovalCount > 0) {
    subClauses.push(
      needsApprovalCount === 1 ? 'One needs approval' : `${needsApprovalCount} need approval`
    );
  }
  if (failedCount > 0) {
    subClauses.push(
      failedCount === 1 ? 'one failed to publish' : `${failedCount} failed to publish`
    );
  }
  if (nextPost && nextPost.scheduledAt) {
    try {
      const relTime = formatDistanceToNow(new Date(nextPost.scheduledAt), { addSuffix: true });
      subClauses.push(`the next goes out ${relTime}`);
    } catch {
      // fallback
    }
  }

  let subText = 'All drafts are up to date.';
  if (subClauses.length === 1) {
    subText = `${subClauses[0]}.`;
  } else if (subClauses.length === 2) {
    subText = `${subClauses[0]}, and ${subClauses[1]}.`;
  } else if (subClauses.length >= 3) {
    subText = `${subClauses[0]}, ${subClauses[1]}, and ${subClauses[2]}.`;
  }

  // Pipeline total & array
  const pipeItems = [
    { label: 'Ideas', count: pipelineCounts.ideas, color: 'var(--bg)' },
    { label: 'Drafted', count: pipelineCounts.drafted, color: 'var(--mut)' },
    { label: 'Revision', count: pipelineCounts.revision, color: 'var(--hi)' },
    { label: 'Approved', count: pipelineCounts.approved, color: 'var(--acc)' },
    { label: 'Scheduled', count: pipelineCounts.scheduled, color: 'var(--pri)' },
    { label: 'Posted', count: pipelineCounts.posted, color: 'var(--fg)' },
  ];
  const totalPosts = pipeItems.reduce((acc, curr) => acc + curr.count, 0);

  // 7 Days
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const weekRangeText = `${format(today, 'MMM d')} to ${format(days[6], 'MMM d')}`;

  // Next Post date formatting
  let nextDateLine = '';
  let nextTimeLine = '';
  if (nextPost?.scheduledAt) {
    const d = new Date(nextPost.scheduledAt);
    nextDateLine = format(d, 'EEE d MMM');
    nextTimeLine = format(d, 'HH:mm');
  }

  return (
    <div className={styles.overview}>
      <h1 className={styles.h1}>{headline}</h1>
      <p className={styles.sub}>{subText}</p>

      <div className={styles.bento}>
        {/* 1. Next to Publish */}
        {nextPost ? (
          <section className={`${styles.box} ${styles.next} ${styles.c7}`}>
            <div className={styles.box2}>
              <div>
                <p className={styles.lbl}>Next to publish</p>
                <div className={styles.big}>
                  {nextDateLine}
                  <br />
                  {nextTimeLine}
                </div>
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '20px', lineHeight: 1.2 }}>
                  {nextPost.title}
                </h3>
                <p className={styles.m} style={{ margin: '0 0 14px', fontSize: '12px' }}>
                  {PLATFORM_NAME[nextPost.platform] || nextPost.platform} carousel ·{' '}
                  {nextPost.slidesCount} slides
                </p>
                <div className={styles.act} style={{ margin: 0 }}>
                  <Link
                    className={`${styles.btn} ${styles.btnAlt}`}
                    href={`/drafts?post=${nextPost.id}`}
                  >
                    Edit draft
                  </Link>
                  <button
                    className={`${styles.btn} ${styles.btnAlt}`}
                    onClick={() => handlePublishNow(nextPost.id)}
                    disabled={isPending}
                    type="button"
                  >
                    {isPending ? 'Publishing...' : 'Publish now'}
                  </button>
                </div>
              </div>
            </div>
            {nextPost.firstSlide?.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={nextPost.firstSlide.imageUrl}
                alt={nextPost.title}
                className={styles.slideImg}
              />
            ) : (
              <div className={styles.slide}>
                <u>1/{nextPost.slidesCount || 1}</u>
                <div>
                  <i />
                  <b>{nextPost.firstSlide?.headline || nextPost.firstSlide?.text || nextPost.title}</b>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className={`${styles.box} ${styles.next} ${styles.c7}`}>
            <div className={styles.box2}>
              <div>
                <p className={styles.lbl}>Next to publish</p>
                <div className={styles.big}>
                  Nothing
                  <br />
                  scheduled
                </div>
              </div>
              <div>
                <p className={styles.m} style={{ margin: '0 0 14px', fontSize: '12px' }}>
                  No posts are scheduled right now.
                </p>
                <div className={styles.act} style={{ margin: 0 }}>
                  <Link className={styles.btn} href="/chat">
                    Open ideation
                  </Link>
                </div>
              </div>
            </div>
            <div className={styles.slide}>
              <u>0/0</u>
              <div>
                <i />
                <b>Turn ideas into your next carousel</b>
              </div>
            </div>
          </section>
        )}

        {/* 2. Pipeline */}
        <section className={`${styles.box} ${styles.c5}`}>
          <p className={styles.lbl}>
            <span>Pipeline</span>
            <span>{totalPosts} posts</span>
          </p>
          <div className={styles.pipe}>
            {totalPosts > 0 ? (
              pipeItems
                .filter((p) => p.count > 0)
                .map((p) => (
                  <div
                    key={p.label}
                    style={{ flex: p.count, background: p.color }}
                  />
                ))
            ) : (
              <div style={{ flex: 1, background: 'var(--mut)', opacity: 0.4 }} />
            )}
          </div>
          <div className={styles.leg}>
            {pipeItems.map((p) => (
              <div key={p.label}>
                <b>{p.count}</b>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Next 7 Days */}
        <section className={`${styles.box} ${styles.c12}`}>
          <p className={styles.lbl}>
            <span>Next 7 days</span>
            <span>{weekRangeText}</span>
          </p>
          <div className={styles.week}>
            {days.map((day, i) => {
              const isToday = i === 0;
              const dayMatches = weekPosts.filter(
                (p) => p.scheduledAt && isSameDay(new Date(p.scheduledAt), day)
              );

              return (
                <div
                  key={day.toISOString()}
                  className={`${styles.day} ${isToday ? styles.dayToday : ''}`}
                >
                  <h4>
                    {format(day, 'EEE d')}
                    {isToday ? ' · today' : ''}
                  </h4>
                  {dayMatches.map((p) => {
                    const time = p.scheduledAt ? format(new Date(p.scheduledAt), 'HH:mm') : '';
                    const statusClass =
                      p.status === 'SCHEDULED'
                        ? styles.sS
                        : p.status === 'APPROVED'
                        ? styles.sA
                        : styles.sD;

                    return (
                      <Link
                        key={p.id}
                        className={`${styles.ev} ${statusClass}`}
                        href={`/drafts?post=${p.id}`}
                      >
                        {p.title}
                        <small>
                          {time} · {PLATFORM_SHORT[p.platform] || p.platform}
                        </small>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Needs Attention */}
        {failedPost ? (
          <section className={`${styles.box} ${styles.err} ${styles.c5}`}>
            <p className={styles.lbl} style={{ color: 'var(--bad)' }}>
              <span>Needs attention</span>
              <span>{failedCount}</span>
            </p>
            <h3 style={{ margin: '0 0 6px', fontSize: '20px' }}>
              {failedPost.title} failed to publish.
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '14px' }}>
              {failedPost.errorMessage ||
                `The ${PLATFORM_NAME[failedPost.platform] || failedPost.platform} connection expired. Reconnect it, then retry.`}
            </p>
            <div className={styles.act} style={{ margin: 0 }}>
              <Link className={`${styles.btn} ${styles.btnSm} ${styles.btnBlue}`} href="/settings">
                Reconnect {PLATFORM_NAME[failedPost.platform] || failedPost.platform}
              </Link>
              <button
                className={`${styles.btn} ${styles.btnSm} ${styles.btnAlt}`}
                onClick={() => handleRetry(failedPost.id)}
                disabled={isPending}
                type="button"
              >
                {isPending ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </section>
        ) : (
          <section className={`${styles.box} ${styles.c5}`}>
            <p className={styles.lbl}>
              <span>Needs attention</span>
              <span>0</span>
            </p>
            <h3 style={{ margin: '0 0 6px', fontSize: '20px' }}>Nothing needs attention</h3>
            <p style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--dim)' }}>
              All platforms connected and publishing normally.
            </p>
          </section>
        )}

        {/* 5. Queue */}
        <section className={`${styles.box} ${styles.c7}`}>
          <p className={styles.lbl}>
            <span>Queue</span>
            <span>Soonest first</span>
          </p>
          {queuePosts.length > 0 ? (
            queuePosts.map((p) => {
              const dateStr = p.scheduledAt ? format(new Date(p.scheduledAt), 'EEE d MMM') : 'Unscheduled';
              const statusTag = p.status === 'SCHEDULED' ? styles.sS : styles.sA;
              const statusLabel = p.status === 'SCHEDULED' ? 'Scheduled' : 'Approved';

              return (
                <div key={p.id} className={styles.row}>
                  <span className={styles.m}>{dateStr}</span>
                  <Link
                    href={`/drafts?post=${p.id}`}
                    style={{ color: 'inherit', fontWeight: 700, textDecoration: 'none' }}
                  >
                    {p.title}
                  </Link>
                  <span className={`${styles.tag} ${statusTag}`}>{statusLabel}</span>
                </div>
              );
            })
          ) : (
            <p className={styles.m} style={{ color: 'var(--dim)', margin: '14px 0 0', fontSize: '13px' }}>
              No posts in the queue.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
