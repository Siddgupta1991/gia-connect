import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { RoleTag } from '../../components/Badges';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Layout';
import { ConfirmDialog } from '../../components/Overlays';
import { useToast } from '../../components/Toast';
import { useAuth, useMe } from '../../state/AuthContext';
import { errorText } from '../../state/DataContext';
import { colors, layout } from '../../theme';
import { APP_VERSION, MADE_BY } from '../../utils/appInfo';

function Row({ icon, label, value }: { icon: ComponentProps<typeof Feather>['name']; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Feather name={icon} size={20} color={colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <AppText variant="label" color={colors.textSecondary}>
          {label}
        </AppText>
        <AppText>{value}</AppText>
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const me = useMe();
  const { signOut, resetDemo } = useAuth();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const doReset = async () => {
    setBusy(true);
    try {
      await resetDemo();
      toast('Demo data reset');
    } catch (e) {
      toast(errorText(e), 'error');
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <Avatar name={me.name} size={80} />
          <AppText variant="screenTitle" center>
            {me.name}
          </AppText>
          <RoleTag role={me.role} />
        </View>
        <Card style={{ gap: 4, paddingVertical: 8 }}>
          <Row icon="at-sign" label="Username" value={me.username} />
          <Row icon="phone" label="Mobile" value={me.mobile} />
          <Row icon="briefcase" label="Industry" value={me.industryName} />
          <Row icon="hash" label="Plot number" value={me.plotNo} />
        </Card>
        <Button title="Log out" variant="secondary" icon="log-out" onPress={signOut} />
        <Button title="Reset demo data" variant="text" icon="refresh-ccw" onPress={() => setConfirmReset(true)} />
        <View style={{ gap: 4, marginTop: 16 }}>
          <AppText variant="caption" color={colors.textHint} center>
            GIA Connect version {APP_VERSION}
          </AppText>
          <AppText variant="caption" color={colors.textHint} center>
            {MADE_BY}
          </AppText>
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={confirmReset}
        title="Reset demo data?"
        message="All complaints, chats, alerts and new accounts on this phone will be deleted and the sample data loaded again. You will be logged out."
        confirmLabel="Reset data"
        destructive
        loading={busy}
        onConfirm={doReset}
        onCancel={() => setConfirmReset(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: layout.screenPadding, gap: 16, paddingBottom: 32 },
  top: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
});
