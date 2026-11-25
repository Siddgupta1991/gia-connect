import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, shadow } from '../theme';
import { AppText } from './AppText';

type IconName = ComponentProps<typeof Feather>['name'];

export function IconButton({ icon, label, onPress, color = colors.textPrimary, badge }: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  badge?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: '#EFEEEA' }]}
    >
      <Feather name={icon} size={22} color={color} />
      {badge ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

/** Screen with safe area padding on top. Tab screens leave the bottom to the tab bar. */
export function Screen({ children, style, edges = ['top'] }: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom')[];
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        edges.includes('top') && { paddingTop: insets.top },
        edges.includes('bottom') && { paddingBottom: insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ScreenHeader({ title, subtitle, back, right }: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const nav = useNavigation();
  return (
    <View style={[styles.header, back && { paddingLeft: 4 }]}>
      {back ? <IconButton icon="arrow-left" label="Go back" onPress={() => nav.goBack()} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant={back ? 'sectionTitle' : 'screenTitle'} accessibilityRole="header" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="label" color={colors.textSecondary} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Fab({ icon = 'plus', label, onPress }: { icon?: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.fab, { backgroundColor: pressed ? colors.primaryDark : colors.primary }]}
    >
      <Feather name={icon} size={28} color={colors.onPrimary} />
    </Pressable>
  );
}

export function RadioRow({ label, hint, selected, disabled, onPress }: {
  label: string;
  hint?: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.radio,
        selected && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
        pressed && !selected && { backgroundColor: '#F7F7F5' },
        disabled && { opacity: 0.45 },
      ]}
    >
      <View style={[styles.radioOuter, selected && { borderColor: colors.primary }]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{label}</AppText>
        {hint ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {hint}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

export function LoadingBlock() {
  return (
    <View style={{ padding: 32, alignItems: 'center' }}>
      <AppText color={colors.textHint}>Loading...</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 8,
    paddingBottom: 12,
    minHeight: 60,
  },
  iconBtn: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: layout.touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { position: 'absolute', top: 10, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowOpacity: 0.2,
    elevation: 5,
  },
  radio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.buttonRadius,
    backgroundColor: colors.surface,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
});
