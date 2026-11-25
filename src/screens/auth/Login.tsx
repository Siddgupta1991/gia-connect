import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import type { RootScreenProps } from '../../navigation/types';
import { useAuth } from '../../state/AuthContext';
import { errorText } from '../../state/DataContext';
import { colors, fonts, layout } from '../../theme';
import { APP_VERSION } from '../../utils/appInfo';

export function LoginScreen({ navigation }: RootScreenProps<'Login'>) {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const canSubmit = username.trim().length > 0 && password.length > 0;

  const submit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      await signIn(username, password);
    } catch (e) {
      // Keep the username, clear only the password.
      setPassword('');
      setError(errorText(e));
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <AppText style={{ fontFamily: fonts.bold, fontSize: 32, lineHeight: 40 }} color={colors.onPrimary}>
            G
          </AppText>
        </View>
        <AppText variant="screenTitle" accessibilityRole="header">
          Welcome to GIA Connect
        </AppText>
        <AppText color={colors.textSecondary} style={{ marginBottom: 24 }}>
          Sign in to raise and track complaints
        </AppText>

        <View style={styles.form}>
          <TextField
            label="Username"
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              setError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            placeholder="Your username"
          />
          <TextField
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError(null);
            }}
            secureToggle
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            placeholder="Your password"
          />
          {error ? (
            <View style={styles.error} accessibilityLiveRegion="assertive">
              <AppText variant="label" color={colors.danger}>
                {error}
              </AppText>
            </View>
          ) : null}
          <Button title="Sign in" onPress={submit} disabled={!canSubmit} loading={loading} />
          <Button title="Create a new account" variant="text" onPress={() => navigation.navigate('CreateAccount')} />
        </View>

        <View style={{ flex: 1 }} />
        <AppText variant="caption" color={colors.textHint} center style={{ marginTop: 32 }}>
          GIA Connect version {APP_VERSION}
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: layout.screenPadding },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  form: { gap: 12 },
  error: { backgroundColor: colors.dangerSoft, borderRadius: 10, padding: 12 },
});
