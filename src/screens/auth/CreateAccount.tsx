import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { ScreenHeader } from '../../components/Layout';
import { TextField } from '../../components/TextField';
import { DomainError } from '../../domain/engine';
import { validateRegister, type RegisterErrors, type RegisterInput } from '../../domain/validation';
import { useAuth } from '../../state/AuthContext';
import { errorText } from '../../state/DataContext';
import { colors, layout } from '../../theme';

const EMPTY: RegisterInput = { name: '', mobile: '', industryName: '', plotNo: '', username: '', password: '' };

export function CreateAccountScreen() {
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<RegisterInput>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterInput, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<RegisterErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const errors = { ...validateRegister(form), ...serverErrors };
  const show = (k: keyof RegisterInput) => ((submitted || touched[k]) && errors[k]) || null;

  const set = (k: keyof RegisterInput) => (v: string) => {
    setForm((f) => ({ ...f, [k]: k === 'mobile' ? v.replace(/\D/g, '').slice(0, 10) : v }));
    setServerErrors((s) => ({ ...s, [k]: undefined }));
    setFormError(null);
  };
  const blur = (k: keyof RegisterInput) => () => setTouched((t) => ({ ...t, [k]: true }));

  const submit = async () => {
    setSubmitted(true);
    if (Object.keys(validateRegister(form)).length > 0) return;
    setLoading(true);
    try {
      await signUp(form);
    } catch (e) {
      if (e instanceof DomainError && e.field) setServerErrors({ [e.field]: e.message });
      else setFormError(errorText(e));
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Create account" back />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.info}>
          <Feather name="info" size={18} color={colors.primary} />
          <AppText variant="label" color={colors.primaryDark} style={{ flex: 1 }}>
            New accounts are always Members
          </AppText>
        </View>
        <TextField label="Full name" value={form.name} onChangeText={set('name')} onBlur={blur('name')} error={show('name')} autoComplete="name" />
        <TextField
          label="Mobile number"
          value={form.mobile}
          onChangeText={set('mobile')}
          onBlur={blur('mobile')}
          error={show('mobile')}
          keyboardType="number-pad"
          helper="10 digits"
          maxLength={10}
        />
        <TextField label="Industry name" value={form.industryName} onChangeText={set('industryName')} onBlur={blur('industryName')} error={show('industryName')} />
        <TextField label="Plot number" value={form.plotNo} onChangeText={set('plotNo')} onBlur={blur('plotNo')} error={show('plotNo')} />
        <TextField
          label="Username"
          value={form.username}
          onChangeText={set('username')}
          onBlur={blur('username')}
          error={show('username')}
          autoCapitalize="none"
          autoCorrect={false}
          helper="You will use this to sign in"
        />
        <TextField
          label="Password"
          value={form.password}
          onChangeText={set('password')}
          onBlur={blur('password')}
          error={show('password')}
          secureToggle
          autoCapitalize="none"
          helper="At least 6 characters"
        />
        {formError ? (
          <AppText variant="label" color={colors.danger}>
            {formError}
          </AppText>
        ) : null}
        <Button title="Create account" onPress={submit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, gap: 8 },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
});
