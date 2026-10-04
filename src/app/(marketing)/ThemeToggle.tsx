'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import styles from './landing.module.css';

export function ThemeToggle() {
  const { isDark, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      className={styles.ib}
      id="theme"
      aria-label="Toggle theme"
      onClick={handleClick}
      type="button"
    >
      {mounted && isDark ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          aria-hidden="true"
        >
          <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v3M12 20v3M1 12h3M20 12h3" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          aria-hidden="true"
        >
          <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z" />
        </svg>
      )}
    </button>
  );
}
