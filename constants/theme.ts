/**
 * Yummy Tummy - Design System & Theme
 * 8pt spacing grid, warm appetizing coral/orange palette, editorial typography.
 */

export const COLORS = {
  // Primary Brand Accent
  primary: '#FF5A3C',
  primaryLight: '#FFF5F2',
  primaryDark: '#E0482B',
  primarySubtle: '#FFEBE5',

  // Neutrals & Surfaces
  background: '#FAF8F5',
  card: '#FFFFFF',
  surface: '#F7F4EE',
  surfaceHover: '#EFEAE0',

  // Typography
  textPrimary: '#171717',
  textSecondary: '#525252',
  textMuted: '#8A8A8A',
  textLight: '#A3A3A3',
  textInverted: '#FFFFFF',

  // Semantic
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#EF4444',
  errorLight: '#FEF2F2',

  // Borders & Dividers
  border: '#EAE5DC',
  borderSubtle: '#F2EFE9',
  borderFocus: '#FF5A3C',

  // Badges & Accents
  vegGreen: '#22C55E',
  nonVegRed: '#EF4444',
  eggYellow: '#F59E0B',
  veganPurple: '#8B5CF6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.55)',
  darkSurface: '#181818',
  darkCard: '#222222',
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const TYPOGRAPHY = {
  fontSerif: 'serif',
  fontSans: 'System',

  sizes: {
    hero: 34,
    h1: 26,
    h2: 20,
    h3: 16,
    body: 14,
    subtext: 12,
    caption: 11,
    tiny: 10,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const SHADOWS = {
  card: {
    boxShadow: '0px 2px 8px rgba(23, 23, 23, 0.05)',
    elevation: 2,
  },
  cardHover: {
    boxShadow: '0px 6px 16px rgba(23, 23, 23, 0.08)',
    elevation: 4,
  },
  accent: {
    boxShadow: '0px 4px 10px rgba(255, 90, 60, 0.25)',
    elevation: 4,
  },
};
