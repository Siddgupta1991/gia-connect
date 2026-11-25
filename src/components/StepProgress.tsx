import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { AppText } from './AppText';

export function StepProgress({ step, of }: { step: number; of: number }) {
  return (
    <View style={{ gap: 8 }} accessibilityLabel={`Step ${step} of ${of}`}>
      <AppText variant="label" color={colors.primary}>
        Step {step} of {of}
      </AppText>
      <View style={styles.track}>
        {Array.from({ length: of }, (_, i) => (
          <View key={i} style={[styles.seg, { backgroundColor: i < step ? colors.primary : colors.border }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
});
