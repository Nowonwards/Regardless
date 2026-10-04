import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        'border-subtle': 'var(--border)',
        'border-strong': 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        surface: 'var(--surface)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        highlight: {
          DEFAULT: 'var(--highlight)',
          foreground: 'var(--highlight-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        approved: 'var(--accent)',
        posted: 'var(--foreground)',
        status: {
          drafted: 'var(--status-drafted)',
          'drafted-fg': 'var(--status-drafted-fg)',
          revision: 'var(--status-revision)',
          'revision-fg': 'var(--status-revision-fg)',
          approved: 'var(--status-approved)',
          'approved-fg': 'var(--status-approved-fg)',
          scheduled: 'var(--status-scheduled)',
          'scheduled-fg': 'var(--status-scheduled-fg)',
          posted: 'var(--status-posted)',
          'posted-fg': 'var(--status-posted-fg)',
          failed: 'var(--status-failed)',
          'failed-fg': 'var(--status-failed-fg)',
        },
        platform: {
          instagram: {
            DEFAULT: 'var(--foreground)',
            foreground: 'var(--background)',
          },
          pinterest: {
            DEFAULT: 'var(--foreground)',
            foreground: 'var(--background)',
          },
          linkedin: {
            DEFAULT: 'var(--foreground)',
            foreground: 'var(--background)',
          },
        },
      },
      borderRadius: {
        none: '0px',
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
        DEFAULT: '4px 4px 0 0 var(--border)',
        hard: '4px 4px 0 0 var(--border)',
        'hard-sm': '2px 2px 0 0 var(--border)',
        'hard-lg': '6px 6px 0 0 var(--border)',
        'hard-active': '0 0 0 0 var(--border)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.1s ease-out',
        'accordion-up': 'accordion-up 0.1s ease-out',
        'fade-in': 'fade-in 0.1s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.1s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.1s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
