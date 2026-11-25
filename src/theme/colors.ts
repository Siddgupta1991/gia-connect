import type { Severity, Status } from '../domain/types';

export const colors = {
  background: '#FAFAF7',
  surface: '#FFFFFF',
  border: '#E7E5E4',
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  // textMuted fails AA on white for body text, so hints/timestamps use this darker tone
  textHint: '#78716C',
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primarySoft: '#EEF2FF',
  onPrimary: '#FFFFFF',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#15803D',
  successSoft: '#DCFCE7',
  amber: '#B45309',
  amberSoft: '#FEF3C7',
  overlay: 'rgba(28,25,23,0.45)',
} as const;

export const statusColors: Record<Status, { text: string; bg: string }> = {
  open: { text: '#B45309', bg: '#FEF3C7' },
  in_progress: { text: '#1D4ED8', bg: '#DBEAFE' },
  fixed: { text: '#6D28D9', bg: '#EDE9FE' },
  resolved: { text: '#15803D', bg: '#DCFCE7' },
};

export const severityColors: Record<Severity | 'none', string> = {
  low: '#65A30D',
  medium: '#D97706',
  high: '#EA580C',
  critical: '#DC2626',
  none: '#A8A29E',
};
