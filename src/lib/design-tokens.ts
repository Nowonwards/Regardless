/**
 * Regardless Design Tokens (Linear/Notion-inspired)
 * High-clarity, content-first token system for light and dark modes.
 */

export const DESIGN_TOKENS = {
  colors: {
    light: {
      bgBase: '#FFFFFF',
      bgSurface: '#F7F8FA',
      bgElevated: '#FFFFFF',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      textDisabled: '#9CA3AF',
      borderSubtle: '#E5E7EB',
      borderStrong: '#D1D5DB',
      accent: '#4F46E5', // Indigo
      accentHover: '#4338CA',
      accentLight: '#EEF2FF',
      semantic: {
        success: '#16A34A',
        successLight: '#DCFCE7',
        warning: '#D97706',
        warningLight: '#FEF3C7',
        danger: '#DC2626',
        dangerLight: '#FEE2E2',
        info: '#2563EB',
        infoLight: '#DBEAFE',
      },
    },
    dark: {
      bgBase: '#0B0D10', // Never pure black
      bgSurface: '#14171C',
      bgElevated: '#1B1F26',
      textPrimary: '#F3F4F6',
      textSecondary: '#9CA3AF',
      textDisabled: '#6B7280',
      borderSubtle: '#2A2F38',
      borderStrong: '#3B4250',
      accent: '#6366F1', // Lifted for AA contrast
      accentHover: '#818CF8',
      accentLight: '#1E1B4B',
      semantic: {
        success: '#22C55E',
        successLight: '#052E16',
        warning: '#F59E0B',
        warningLight: '#451A03',
        danger: '#EF4444',
        dangerLight: '#450A0A',
        info: '#3B82F6',
        infoLight: '#172554',
      },
    },
    // Fixed Category / Tag Palette (8-10 balanced colors)
    categories: [
      { id: 'purple', light: { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' }, dark: { bg: '#3B0764', text: '#D8B4FE', border: '#581C87' } },
      { id: 'blue', light: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' }, dark: { bg: '#172554', text: '#93C5FD', border: '#1E3A8A' } },
      { id: 'cyan', light: { bg: '#CFFAFE', text: '#0E7490', border: '#A5F3FC' }, dark: { bg: '#083344', text: '#67E8F9', border: '#155E75' } },
      { id: 'emerald', light: { bg: '#D1FAE5', text: '#047857', border: '#A7F3D0' }, dark: { bg: '#022C22', text: '#6EE7B7', border: '#064E3B' } },
      { id: 'amber', light: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' }, dark: { bg: '#451A03', text: '#FCD34D', border: '#78350F' } },
      { id: 'rose', light: { bg: '#FFE4E6', text: '#BE123C', border: '#FECDD3' }, dark: { bg: '#4C0519', text: '#FDA4AF', border: '#881337' } },
      { id: 'indigo', light: { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' }, dark: { bg: '#1E1B4B', text: '#A5B4FC', border: '#312E81' } },
      { id: 'slate', light: { bg: '#F1F5F9', text: '#334155', border: '#E2E8F0' }, dark: { bg: '#0F172A', text: '#CBD5E1', border: '#1E293B' } },
    ],
  },
  radii: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    full: '9999px',
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
    normal: '200ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
