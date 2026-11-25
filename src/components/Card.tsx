import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, layout, shadow } from '../theme';
import { AppText } from './AppText';

export function Card({ children, style, onPress, accessibilityLabel }: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.card, pressed && { backgroundColor: '#F7F7F5' }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StatCard({ label, value, color, onPress }: { label: string; value: number; color: string; onPress?: () => void }) {
  return (
    <Card style={styles.stat} onPress={onPress} accessibilityLabel={`${value} ${label}`}>
      <View style={[styles.statBar, { backgroundColor: color }]} />
      <AppText style={styles.statValue}>{value}</AppText>
      <AppText variant="label" color={colors.textSecondary} numberOfLines={1}>
        {label}
      </AppText>
    </Card>
  );
}

export function EmptyState({ icon, title, text }: { icon: ComponentProps<typeof Feather>['name']; title: string; text?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Feather name={icon} size={28} color={colors.primary} />
      </View>
      <AppText variant="sectionTitle" center>
        {title}
      </AppText>
      {text ? (
        <AppText color={colors.textSecondary} center>
          {text}
        </AppText>
      ) : null}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <AppText variant="sectionTitle" accessibilityRole="header" style={{ flex: 1 }}>
        {children}
      </AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadow,
  },
  stat: { flex: 1, minWidth: 0, paddingVertical: 12, paddingHorizontal: 12, gap: 2, overflow: 'hidden' },
  statBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 30 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
