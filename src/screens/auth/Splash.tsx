import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, fonts } from '../../theme';

export function SplashView() {
  return (
    <View style={styles.root} accessibilityLabel="GIA Connect is loading">
      <View style={styles.logo}>
        <AppText style={styles.logoLetter} color={colors.primary}>
          G
        </AppText>
      </View>
      <AppText style={styles.title} color={colors.onPrimary}>
        GIA Connect
      </AppText>
      <AppText variant="body" color="#E0E7FF" center>
        Govindpura Industrial Association
      </AppText>
      <ActivityIndicator color={colors.onPrimary} style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoLetter: { fontFamily: fonts.bold, fontSize: 48, lineHeight: 56 },
  title: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 40 },
});
