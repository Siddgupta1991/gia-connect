import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/Layout';
import { ConfirmDialog } from '../../components/Overlays';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { repo } from '../../data';
import { complaintNo } from '../../domain/labels';
import { LIMITS } from '../../domain/validation';
import type { RootScreenProps } from '../../navigation/types';
import { useMe } from '../../state/AuthContext';
import { errorText, useComplaint } from '../../state/DataContext';
import { colors, layout } from '../../theme';

export function ConfirmFixScreen({ navigation, route }: RootScreenProps<'ConfirmFix'>) {
  const me = useMe();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const c = useComplaint(route.params.id);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'confirm' | 'reopen' | null>(null);

  const close = () => navigation.goBack();
  const openThread = () => navigation.replace('ComplaintThread', { id: route.params.id });

  if (!c || c.status !== 'fixed' || c.createdBy !== me.id) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
        <AppText variant="sectionTitle" center>
          Nothing to confirm
        </AppText>
        <Button title="Open the complaint" variant="secondary" onPress={openThread} />
        <Button title="Close" variant="text" onPress={close} />
      </View>
    );
  }

  const confirm = async () => {
    setBusy('confirm');
    try {
      await repo.resolveComplaint(me.id, c.id);
      toast(`${complaintNo(c.number)} is resolved. Thank you!`);
      openThread();
    } catch (e) {
      toast(errorText(e), 'error');
      setBusy(null);
    }
  };

  const reopen = async () => {
    setBusy('reopen');
    try {
      await repo.reopenComplaint(me.id, c.id, reason);
      setReopenOpen(false);
      toast(`${complaintNo(c.number)} was reopened`);
      openThread();
    } catch (e) {
      toast(errorText(e), 'error');
      setBusy(null);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <View style={{ alignItems: 'flex-end' }}>
        <IconButton icon="x" label="Close" onPress={close} />
      </View>
      <ScrollView contentContainerStyle={styles.center}>
        <View style={styles.circle}>
          <Feather name="check" size={64} color={colors.success} />
        </View>
        <AppText variant="label" color={colors.textSecondary}>
          {complaintNo(c.number)} · {c.subCategory} at {c.location}
        </AppText>
        <AppText variant="screenTitle" center>
          The team says this is fixed. Is it?
        </AppText>
        <AppText color={colors.textSecondary} center>
          If you confirm, the complaint closes and its chat is deleted for everyone.
        </AppText>
      </ScrollView>
      <View style={{ gap: 12 }}>
        <Button title="Yes, it is fixed" onPress={confirm} loading={busy === 'confirm'} disabled={!!busy} />
        <Button title="No, reopen" variant="secondary" onPress={() => setReopenOpen(true)} disabled={!!busy} />
        <Button title="See the chat first" variant="text" onPress={openThread} disabled={!!busy} />
      </View>

      <ConfirmDialog
        visible={reopenOpen}
        title="Reopen this complaint?"
        message="Tell the team what is still wrong."
        confirmLabel="Reopen"
        loading={busy === 'reopen'}
        onConfirm={reopen}
        onCancel={() => setReopenOpen(false)}
      >
        <TextField
          label="Reason"
          value={reason}
          onChangeText={setReason}
          multiline
          placeholder="Example, the pothole is back after rain"
          error={reason.length > 0 && reason.trim().length < LIMITS.reasonMin ? 'Add a few more words' : null}
        />
      </ConfirmDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: layout.screenPadding, gap: 12 },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 24 },
  circle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
});
