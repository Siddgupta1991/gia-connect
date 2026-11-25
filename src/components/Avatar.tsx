import { StyleSheet, View } from 'react-native';
import { colors, fonts } from '../theme';
import { AppText } from './AppText';

const PALETTE = [
  { bg: '#EEF2FF', fg: '#4338CA' },
  { bg: '#FEF3C7', fg: '#92400E' },
  { bg: '#DCFCE7', fg: '#166534' },
  { bg: '#FCE7F3', fg: '#9D174D' },
  { bg: '#E0F2FE', fg: '#075985' },
  { bg: '#EDE9FE', fg: '#5B21B6' },
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? '?';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
}

function pick(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({ name, size = 40, ring }: { name: string; size?: number; ring?: boolean }) {
  const c = pick(name);
  return (
    <View
      accessibilityLabel={name}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: c.bg },
        ring && { borderWidth: 2, borderColor: colors.surface },
      ]}
    >
      <AppText style={{ fontFamily: fonts.semibold, fontSize: Math.max(13, size * 0.38) }} color={c.fg} maxFontSizeMultiplier={1}>
        {initials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
