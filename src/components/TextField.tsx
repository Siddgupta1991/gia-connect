import Feather from '@expo/vector-icons/Feather';
import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, layout, MAX_FONT_SCALE } from '../theme';
import { AppText } from './AppText';

interface Props extends TextInputProps {
  label: string;
  helper?: string;
  error?: string | null;
  counter?: { value: number; max: number };
  secureToggle?: boolean;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export function TextField({ label, helper, error, counter, secureToggle, multiline, style, secureTextEntry, ref, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const secure = secureToggle ? hidden : secureTextEntry;
  const over = counter ? counter.value > counter.max : false;

  return (
    <View style={styles.wrap}>
      <AppText variant="label" color={colors.textSecondary}>
        {label}
      </AppText>
      <View
        style={[
          styles.box,
          multiline && styles.multiline,
          focused && { borderColor: colors.primary, borderWidth: 1.5 },
          !!error && { borderColor: colors.danger, borderWidth: 1.5 },
        ]}
      >
        <TextInput
          {...rest}
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.textHint}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          multiline={multiline}
          secureTextEntry={secure}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, multiline && { minHeight: 112 }, style]}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={8}
            style={styles.eye}
          >
            <Feather name={hidden ? 'eye' : 'eye-off'} size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          {error ? (
            <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : helper ? (
            <AppText variant="caption" color={colors.textHint}>
              {helper}
            </AppText>
          ) : null}
        </View>
        {counter ? (
          <AppText variant="caption" color={over ? colors.danger : colors.textHint}>
            {counter.value}/{counter.max}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.buttonHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.buttonRadius,
    backgroundColor: colors.surface,
  },
  multiline: { alignItems: 'flex-start' },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eye: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', gap: 8, minHeight: 18 },
});
