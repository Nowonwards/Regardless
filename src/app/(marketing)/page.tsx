import React from 'react';
import Link from 'next/link';
import { getAuthUser } from '@/lib/auth';
import { ThemeToggle } from './ThemeToggle';
import styles from './landing.module.css';

export const metadata = {
  title: "Regardless: turn tech news into carousels",
  description: "Regardless finds what's breaking in tech, drafts multi-slide posts, and keeps every one in a review queue until you approve it.",
  openGraph: {
    title: "Regardless: turn tech news into carousels",
    description: "Regardless finds what's breaking in tech, drafts multi-slide posts, and keeps every one in a review queue until you approve it.",
  },
};

export default async function LandingPage() {
  const user = await getAuthUser();
  const appHref = user ? '/overview' : '/sign-in';

  return (
    <div className={styles.landing}>
      <nav className={styles.nav}>
        <div className={styles.w}>
          <a className={styles.brand} href="#top">
            <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <rect x="1" y="1" width="30" height="30" fill="#0B0B0C" stroke="#F4F1EA" strokeWidth="2" />
              <g fill="#F4F1EA">
                <rect x="9" y="9" width="4" height="16" />
                <rect x="9" y="9" width="11" height="4" />
                <rect x="17" y="9" width="4" height="10" />
                <rect x="9" y="15" width="12" height="4" />
                <polygon points="14,19 19,19 24,25 19,25" />
              </g>
              <rect x="25" y="0" width="9" height="9" fill="#FF4B1F" />
            </svg>
            REGARDLESS
          </a>
          <a className={styles.navLink} href="#how">How it works</a>
          <a className={styles.navLink} href="#features">Features</a>
          <a className={styles.navLink} href="#faq">FAQ</a>
          <ThemeToggle />
          <Link className={`${styles.btn} ${styles.btnSm}`} href={appHref}>
            Open app
          </Link>
        </div>
      </nav>

      <header className={styles.hero} id="top">
        <div className={styles.w}>
          <div>
            <span className={styles.tag}>Content studio for tech accounts</span>
            <h1 className={styles.h1}>Turn today&apos;s tech news into <em>tomorrow&apos;s carousel.</em></h1>
            <p className={styles.lead}>
              Regardless finds what is breaking, drafts opinionated multi-slide posts, and holds every one in a review queue until you approve it. Instagram, LinkedIn and Pinterest, one workflow.
            </p>
            <div className={styles.cta}>
              <Link className={styles.btn} href={appHref}>
                Open Regardless
              </Link>
              <a className={`${styles.btn} ${styles.btnAlt}`} href="#how">
                See how it works
              </a>
            </div>
          </div>
          <div className={styles.stack} aria-hidden="true">
            <div className={`${styles.slide} ${styles.s1}`}>
              <u>1/6</u>
              <div>
                <i />
                <b>Your AI pair programmer is a junior with root access</b>
              </div>
            </div>
            <div className={`${styles.slide} ${styles.s2}`}>
              <u>2/6</u>
              <div>
                <i />
                <b>Who reviews the code it writes?</b>
              </div>
            </div>
            <div className={`${styles.slide} ${styles.s3}`}>
              <u>3/6</u>
              <div>
                <i />
                <b>Read the diff. Every time.</b>
              </div>
            </div>
            <span className={`${styles.chip} ${styles.c1}`}>Tue 6 Oct · 09:00</span>
            <span className={`${styles.chip} ${styles.c2}`}>Approved</span>
            <span className={`${styles.chip} ${styles.c3}`}>Scheduled</span>
          </div>
        </div>
      </header>

      <div className={styles.facts}>
        <div className={styles.w}>
          <div className={styles.factCell}>
            <b>3</b>
            <span>Platforms: Instagram, LinkedIn, Pinterest</span>
          </div>
          <div className={styles.factCell}>
            <b>Live</b>
            <span>News search through Tavily</span>
          </div>
          <div className={styles.factCell}>
            <b>7</b>
            <span>Stages from idea to posted</span>
          </div>
          <div className={styles.factCell}>
            <b>1080×1350</b>
            <span>Slides rendered from a template</span>
          </div>
        </div>
      </div>

      <section className={styles.section} id="how">
        <div className={styles.w}>
          <span className={styles.tag}>How it works</span>
          <h2 className={styles.h2} style={{ marginTop: '14px' }}>From a blank page to a scheduled post.</h2>
          <p className={styles.sub}>Four steps, and a human decision at the one that matters.</p>
          <div className={styles.steps}>
            <div className={styles.st}>
              <div className={styles.n}>01</div>
              <h3>Ask or configure</h3>
              <p>Chat with the ideation studio, or fill in the news form: pick platforms, an industry focus, and how many ideas you want.</p>
            </div>
            <div className={styles.st}>
              <div className={styles.n}>02</div>
              <h3>Pick the ideas</h3>
              <p>Each idea arrives with a hook, an angle and key points, backed by live news search. Select the ones worth drafting.</p>
            </div>
            <div className={styles.st}>
              <div className={styles.n}>03</div>
              <h3>Edit and approve</h3>
              <p>Drafts become multi-slide carousels. Edit any slide, ask for a revision in plain language, regenerate a graphic, then approve.</p>
            </div>
            <div className={styles.st}>
              <div className={styles.n}>04</div>
              <h3>Schedule or publish</h3>
              <p>Put it on the calendar or publish now. Published posts are archived with their live link and a snapshot of every slide.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="features" style={{ paddingTop: 0 }}>
        <div className={styles.w}>
          <span className={styles.tag}>Features</span>
          <h2 className={styles.h2} style={{ marginTop: '14px' }}>Everything between the idea and the post.</h2>
          <p className={styles.sub}>One place for ideation, design, review and publishing, so nothing lives in a dozen tabs.</p>
          <div className={styles.bento}>
            <article className={`${styles.bx} ${styles.y} ${styles.c7}`}>
              <span className={styles.tag}>Ideation studio</span>
              <h3>News-backed ideas, not guesses.</h3>
              <p>Ask in chat (&quot;regenerate idea 2 with a punchier hook&quot;) or use the news form. Live search checks current headlines before any idea is written, and you choose between 3 and 6 ideas per run.</p>
            </article>
            <article className={`${styles.bx} ${styles.c5}`}>
              <span className={styles.tag}>Slides</span>
              <h3>Text that is never misspelled.</h3>
              <p>Slide text is rendered from a code template at 1080×1350, not drawn by an image model, so headlines come out exactly as written.</p>
            </article>
            <article className={`${styles.bx} ${styles.c12}`}>
              <span className={styles.tag}>Review queue</span>
              <h3>Every post has a status.</h3>
              <p>A kanban board tracks each post from idea to published, so you always know what is waiting on you.</p>
              <div className={styles.pipe}>
                <div style={{ background: 'var(--card)', color: 'var(--fg)' }}>Ideas</div>
                <div style={{ background: 'var(--mut)', color: 'var(--fg)' }}>Selected</div>
                <div style={{ background: 'var(--mut)', color: 'var(--fg)' }}>Drafted</div>
                <div style={{ background: 'var(--hi)' }}>In revision</div>
                <div style={{ background: 'var(--acc)', color: '#fff' }}>Approved</div>
                <div style={{ background: 'var(--pri)' }}>Scheduled</div>
                <div style={{ background: 'var(--fg)', color: 'var(--bg)' }}>Posted</div>
              </div>
            </article>
            <article className={`${styles.bx} ${styles.c4}`}>
              <span className={styles.tag}>Calendar</span>
              <h3>See the whole month.</h3>
              <p>Day, 4-day, week and month views show scheduled and published posts. Click an empty day to start an ideation session aimed at it.</p>
            </article>
            <article className={`${styles.bx} ${styles.ink} ${styles.c4}`}>
              <span className={styles.tag}>Manual studio</span>
              <h3>Or skip the AI.</h3>
              <p>Build a post from scratch with your own images, headlines and captions, then schedule it like any other draft.</p>
            </article>
            <article className={`${styles.bx} ${styles.c4}`}>
              <span className={styles.tag}>Connections</span>
              <h3>Your accounts, your login.</h3>
              <p>Connect per user with OAuth: Instagram Business or Creator accounts, LinkedIn profiles or company pages, and Pinterest boards.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.section} id="faq" style={{ paddingTop: 0 }}>
        <div className={styles.w}>
          <span className={styles.tag}>FAQ</span>
          <h2 className={styles.h2} style={{ marginTop: '14px' }}>Questions, answered.</h2>
          <div className={styles.faq} style={{ marginTop: '34px' }}>
            <details className={styles.q}>
              <summary>Does anything post without my approval?</summary>
              <p>Every post starts as a draft. You approve it, then you either schedule it or publish it yourself.</p>
            </details>
            <details className={styles.q}>
              <summary>Which platforms does it support?</summary>
              <p>Instagram, LinkedIn and Pinterest. Instagram needs a Business or Creator account, LinkedIn works with a personal profile or a company page, and Pinterest posts go to your boards.</p>
            </details>
            <details className={styles.q}>
              <summary>Where does the news come from?</summary>
              <p>Live search through Tavily, so ideas are checked against current headlines rather than only what a model remembers.</p>
            </details>
            <details className={styles.q}>
              <summary>Can I make a post without AI?</summary>
              <p>Yes. The manual post studio lets you upload images, write the headline and body for each slide, and schedule the result.</p>
            </details>
            <details className={styles.q}>
              <summary>Can I edit what the AI wrote?</summary>
              <p>Yes. Edit each slide&apos;s text directly and re-render it, or describe the change you want and ask for a revision.</p>
            </details>
          </div>
        </div>
      </section>

      <div className={styles.band}>
        <div className={styles.w}>
          <h2 className={styles.h2}>Stop staring at a blank caption box.</h2>
          <p style={{ maxWidth: '50ch', margin: '0 0 26px', fontSize: '19px' }}>
            Open Regardless, ask for ideas, and have a reviewed carousel in the queue.
          </p>
          <Link className={styles.btn} href={appHref}>
            Open Regardless
          </Link>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.w}>
          <a className={styles.brand} href="#top" style={{ fontSize: '15px' }}>
            REGARDLESS
          </a>
          <a className={styles.m} href="https://github.com/Nowonwards/Regardless">
            GitHub
          </a>
          <span className={styles.m} style={{ marginLeft: 'auto' }}>
            © 2026 Regardless
          </span>
        </div>
      </footer>
    </div>
  );
}
