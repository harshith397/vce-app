/**
 * Apple-Inspired Design Tokens
 * Conforming strictly to the Apple UI/UX Design Brief
 */

export const colors = {
  // Surfaces
  background: '#F5F5F7',
  card: '#FFFFFF',
  cardAlt: '#FAFAFA',

  // Interactive & Accents
  primary: '#007AFF', // iOS Blue
  primaryPressed: '#0062CC',

  // Typography
  primaryText: '#1C1C1E',
  secondaryText: '#6E6E73',
  tertiaryText: '#8E8E93',

  // Borders & Separators
  border: '#E5E5EA',
  borderStrong: '#D1D1D6',

  // Status & Feedback
  success: '#34C759', // iOS Green
  successBg: '#E8F8ED',
  successText: '#1E7E34',

  warning: '#FF9500', // iOS Amber
  warningBg: '#FFF6E5',
  warningText: '#9A5B00',

  destructive: '#FF3B30', // iOS Red
  destructiveBg: '#FFF2F2',
  destructiveText: '#D70015',

  // Button Backgrounds
  neutralButton: '#F2F2F7',
  neutralButtonText: '#007AFF',
  destructiveButton: '#FFF2F2',
  destructiveButtonText: '#FF3B30',
  disabledButton: '#F2F2F7',
  disabledButtonText: '#8E8E93',

  // Table Headers
  tableHeaderBg: '#F2F2F7',
  tableHeaderText: '#3A3A3C',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 10,
  base: 12,
  lg: 18,
  xl: 22,
  full: 9999,
};

export const typography = {
  largeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primaryText,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.primaryText,
  },
  secondaryBody: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.secondaryText,
  },
  metadata: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.secondaryText,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.tertiaryText,
  },
  heroNumber: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.primaryText,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
};
