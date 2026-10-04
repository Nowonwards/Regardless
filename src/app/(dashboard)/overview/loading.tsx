import React from 'react';
import styles from './overview.module.css';

export default function OverviewLoading() {
  return (
    <div className={styles.overview}>
      <div
        style={{
          height: '42px',
          width: '380px',
          maxWidth: '100%',
          border: '2px solid var(--bd)',
          background: 'var(--card)',
          marginBottom: '8px',
        }}
      />
      <div
        style={{
          height: '22px',
          width: '520px',
          maxWidth: '100%',
          border: '2px solid var(--bd)',
          background: 'var(--card)',
          marginBottom: '26px',
        }}
      />
      <div className={styles.bento}>
        <div className={`${styles.box} ${styles.c7}`} style={{ minHeight: '260px' }} />
        <div className={`${styles.box} ${styles.c5}`} style={{ minHeight: '260px' }} />
        <div className={`${styles.box} ${styles.c12}`} style={{ minHeight: '180px' }} />
        <div className={`${styles.box} ${styles.c5}`} style={{ minHeight: '160px' }} />
        <div className={`${styles.box} ${styles.c7}`} style={{ minHeight: '160px' }} />
      </div>
    </div>
  );
}
