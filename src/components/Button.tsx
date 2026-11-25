import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, layout, MAX_FONT_SCALE } from '../theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'danger' | 'text';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ComponentProps<typeof Feather>['name'];
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  compact?: boolean;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, icon, style, accessibilityHint, compact }: Props) {
  const inactive = disabled || loading;
  const fg =
    variant === 'primary' || variant === 'danger'
      ? colors.onPrimary
      : variant === 'secondary'
        ? colors.primary
        : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        variant === 'primary' && { backgroundColor: pressed ? colors.primaryDark : colors.primary },
        variant === 'danger' && { backgroundColor: pressed ? '#B91C1C' : colors.danger },
        variant === 'secondary' && {
          borderWidth: 1.5,
          borderColor: colors.primary,
          backgroundColor: pressed ? colors.primarySoft : colors.surface,
        },
        variant === 'text' && { backgroundColor: pressed ? colors.primarySoft : 'transparent', minHeight: layout.touchTarget },
        inactive && variant !== 'text' && styles.disabled,
        inactive && variant === 'text' && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Feather name={icon} size={20} color={fg} /> : null}
          <AppText
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={{ fontFamily: variant === 'text' ? fonts.semibold : fonts.bold, fontSize: 16 }}
            color={fg}
            numberOfLines={2}
            center
          >
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.buttonHeight,
    borderRadius: layout.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  compact: { minHeight: layout.touchTarget },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disabled: { opacity: 0.45 },
});
