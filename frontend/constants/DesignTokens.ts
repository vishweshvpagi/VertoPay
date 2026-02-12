/**
 * Design tokens for consistent UI/UX (8pt grid, Fitts's Law touch targets).
 * Use these across screens for spacing, sizing, and hierarchy.
 */

// 8pt grid – use multiples for consistent spacing
export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Minimum touch target (44pt) – Fitts's Law / accessibility
export const MIN_TOUCH_TARGET = 44;

// Border radius scale
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// Typography scale (optional – screens can keep local sizes; use for consistency)
export const FONT_SIZE = {
  caption: 12,
  body: 14,
  bodyLarge: 16,
  subtitle: 18,
  title: 20,
  titleLarge: 24,
  display: 28,
} as const;
