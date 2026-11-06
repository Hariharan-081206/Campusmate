import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

/**
 * The CampusMate design system — the single source for colour, spacing, radius,
 * shadow and type. Screens and shared components read from here; nothing else
 * hardcodes a colour or a margin.
 */

export const Colors = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  primary: '#4F46E5',
  primaryGradient: ['#6D5DF6', '#4F46E5', '#3B82F6'] as const,
  accent: '#FF6B45',
  success: '#22C55E',
  /** Hero cards: "Scan a note", exam "Next up". */
  dark: '#1E293B',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  /** Tinted backgrounds for badges, derived from the accents above. */
  accentSoft: '#FFEDE7',
  successSoft: '#DCFCE7',
  successText: '#15803D',
  primarySoft: '#EEF0FE',

  /** Text and fills that sit on a dark or gradient card. */
  onDark: '#FFFFFF',
  onDarkSoft: '#FFFFFFCC',
  onDarkFaint: '#FFFFFFAA',
  onDarkMuted: '#FFFFFF99',
  onDarkFill: '#FFFFFF22',

  /** The dark ramp behind the exam "Next up" hero. */
  darkGradient: ['#334155', '#1E293B', '#0F172A'] as const,

  /** Modal backdrop and the full-screen OCR scrim. */
  backdrop: '#0F172A66',
  scrim: '#0F172ACC',

  danger: '#B3261E',
  warningSoft: '#FFF4E5',
  warningText: '#8A5300',

  /** The "original scan" card, styled as a photographed page. */
  paper: '#FFFDF5',
  paperBorder: '#F1E9D2',
  paperInk: '#6B5F45',

  /** Stable per-name avatar tints on the Profile screen. */
  avatars: ['#4F46E5', '#FF6B45', '#22C55E', '#0EA5E9', '#A855F7'] as const,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const Radius = {
  card: 20,
  button: 14,
  /** Chips and badges — a large radius reads as a pill at any height. */
  pill: 999,
} as const;

/** Soft card lift: elevation on Android, the shadow* trio on iOS/web. */
export const Shadow: ViewStyle = {
  elevation: 2,
  shadowColor: '#0F172A',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
};

/**
 * Inter, loaded in src/app/_layout.tsx. The weight lives in the family name
 * rather than fontWeight because that is how @expo-google-fonts ships the
 * faces — setting fontWeight on top would make Android synthesise a second,
 * heavier weight.
 */
export const Font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const Type = StyleSheet.create({
  screenTitle: { fontFamily: Font.bold, fontSize: 28, color: Colors.textPrimary },
  greeting: { fontFamily: Font.bold, fontSize: 24, color: Colors.textPrimary },
  sectionLabel: {
    fontFamily: Font.semibold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  cardTitle: { fontFamily: Font.semibold, fontSize: 16, color: Colors.textPrimary },
  body: { fontFamily: Font.regular, fontSize: 14, color: Colors.textSecondary },
  small: { fontFamily: Font.regular, fontSize: 12, color: Colors.textMuted },
}) as Record<
  'screenTitle' | 'greeting' | 'sectionLabel' | 'cardTitle' | 'body' | 'small',
  TextStyle
>;
