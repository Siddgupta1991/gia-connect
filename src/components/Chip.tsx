import Feather from '@expo/vector-icons/Feather';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, fonts } from '../theme';
import { AppText } from './AppText';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  dotColor?: string;
  icon?: 'map-pin' | 'check';
}

export function Chip({ label, selected, onPress, dotColor, icon }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !selected && { backgroundColor: '#F5F5F4' },
      ]}
    >
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      {icon ? <Feather name={icon} size={14} color={selected ? colors.primary : colors.textSecondary} /> : null}
      <AppText
        variant="label"
        style={{ fontFamily: selected ? fonts.semibold : fonts.medium, fontSize: 14 }}
        color={selected ? colors.primaryDark : colors.textSecondary}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

interface ChipRowProps<T extends string> {
  options: { value: T; label: string; dotColor?: string }[];
  value: T | null;
  onChange: (v: T) => void;
  scroll?: boolean;
}

export function ChipRow<T extends string>({ options, value, onChange, scroll = true }: ChipRowProps<T>) {
  const chips = options.map((o) => (
    <Chip key={o.value} label={o.label} dotColor={o.dotColor} selected={o.value === value} onPress={() => onChange(o.value)} />
  ));
  if (!scroll) return <View style={styles.wrap}>{chips}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  dot: { width: 10, height: 10, borderRadius: 5 },
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
