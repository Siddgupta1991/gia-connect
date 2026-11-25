import { Text, type TextProps } from 'react-native';
import { colors, MAX_FONT_SCALE, type, type TypeVariant } from '../theme';

interface Props extends TextProps {
  variant?: TypeVariant;
  color?: string;
  center?: boolean;
}

export function AppText({ variant = 'body', color = colors.textPrimary, center, style, ...rest }: Props) {
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[type[variant], { color }, center && { textAlign: 'center' }, style]}
      {...rest}
    />
  );
}
