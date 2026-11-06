import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { Colors, Font, Radius, Shadow, Spacing, Type } from '@/theme';

/**
 * The shared building blocks every CampusMate screen is assembled from. They
 * exist so no screen reaches for a raw colour or margin — everything comes
 * from src/theme.ts through these.
 */

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

type ScreenProps = {
  children: ReactNode;
  /** Drop the horizontal padding when the screen owns a full-bleed list. */
  padded?: boolean;
  style?: ViewStyle;
};

/** Safe-area top + app background + the standard horizontal gutter. */
export function Screen({ children, padded = true, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + Spacing.sm },
        padded && { paddingHorizontal: Spacing.xl },
        style,
      ]}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---------------------------------------------------------------------------
// GradientCard
// ---------------------------------------------------------------------------

type GradientCardProps = {
  children: ReactNode;
  /** Defaults to the indigo brand ramp; pass a dark ramp for hero cards. */
  colors?: readonly string[];
  onPress?: () => void;
  style?: ViewStyle;
};

export function GradientCard({ children, colors, onPress, style }: GradientCardProps) {
  const gradient = (
    <LinearGradient
      colors={[...(colors ?? Colors.primaryGradient)] as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, styles.gradient, style]}>
      {children}
    </LinearGradient>
  );

  if (!onPress) return gradient;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {gradient}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export type BadgeVariant = 'now' | 'due' | 'ready' | 'count';

const BADGE_STYLES: Record<BadgeVariant, { bg: string; fg: string }> = {
  now: { bg: Colors.accent, fg: Colors.onDark },
  due: { bg: Colors.accentSoft, fg: Colors.accent },
  ready: { bg: Colors.successSoft, fg: Colors.successText },
  count: { bg: Colors.primarySoft, fg: Colors.primary },
};

export function Badge({ label, variant = 'count' }: { label: string; variant?: BadgeVariant }) {
  const { bg, fg } = BADGE_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chip
// ---------------------------------------------------------------------------

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

/** Filter chip. Selected reads as dark fill / white text, per the mockup. */
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// SectionLabel
// ---------------------------------------------------------------------------

type SectionLabelProps = {
  children: string;
  /** Optional right-hand link, e.g. "See all". */
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

export function SectionLabel({ children, action, onAction, style }: SectionLabelProps) {
  return (
    <View style={[styles.sectionLabel, style]}>
      <Text style={Type.sectionLabel}>{children}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.link}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// StatTile
// ---------------------------------------------------------------------------

export function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ListRow
// ---------------------------------------------------------------------------

type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Rendered before the text — a time, a checkbox, an avatar. */
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  strikethrough?: boolean;
  style?: ViewStyle;
};

export function ListRow({
  title,
  subtitle,
  left,
  right,
  onPress,
  strikethrough,
  style,
}: ListRowProps) {
  const body = (
    <>
      {left ? <View style={styles.rowLeft}>{left}</View> : null}
      <View style={styles.rowBody}>
        <Text style={[Type.cardTitle, strikethrough && styles.struck]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[Type.small, styles.rowSubtitle]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.rowRight}>{right}</View> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}>
        {body}
      </Pressable>
    );
  }
  return <View style={[styles.row, style]}>{body}</View>;
}

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    ...Shadow,
  },
  gradient: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.75 },

  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  badgeText: { fontFamily: Font.semibold, fontSize: 11 },

  chip: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  chipText: { fontFamily: Font.medium, fontSize: 13, color: Colors.textSecondary },
  chipTextSelected: { color: Colors.onDark },

  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  link: { fontFamily: Font.semibold, fontSize: 13, color: Colors.primary },

  statTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    ...Shadow,
  },
  statValue: { fontFamily: Font.bold, fontSize: 22, color: Colors.textPrimary },
  statLabel: {
    fontFamily: Font.regular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  rowLeft: { marginRight: Spacing.md },
  rowBody: { flex: 1 },
  rowRight: { marginLeft: Spacing.md },
  rowSubtitle: { marginTop: 2 },
  struck: { textDecorationLine: 'line-through', color: Colors.textMuted },
});
