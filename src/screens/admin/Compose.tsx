import Feather from '@expo/vector-icons/Feather';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { RadioRow, Screen, ScreenHeader } from '../../components/Layout';
import { BottomSheet, ConfirmDialog } from '../../components/Overlays';
import { PeoplePicker } from '../../components/PeoplePicker';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { repo } from '../../data';
import { getCategory } from '../../domain/categories';
import { AUDIENCE_LABEL, complaintNo } from '../../domain/labels';
import type { Audience } from '../../domain/types';
import { LIMITS } from '../../domain/validation';
import type { RootScreenProps } from '../../navigation/types';
import { useMe } from '../../state/AuthContext';
import { errorText, useData } from '../../state/DataContext';
import { colors, layout, shadow } from '../../theme';

const AUDIENCES: Audience[] = ['everyone', 'members', 'moderators', 'selected', 'complaint'];

export function ComposeScreen({ navigation }: RootScreenProps<'Compose'>) {
  const me = useMe();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { users, complaints } = useData();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('everyone');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [picker, setPicker] = useState<'people' | 'complaint' | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [count, setCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let alive = true;
    repo.countRecipients(me.id, { title, body, audience, selectedIds, complaintId }).then((n) => alive && setCount(n));
    return () => {
      alive = false;
    };
  }, [me.id, title, body, audience, selectedIds, complaintId, users, complaints]);

  const people = useMemo(() => users.filter((u) => u.id !== me.id), [users, me.id]);
  const chosenComplaint = complaints.find((c) => c.id === complaintId);
  const activeComplaints = complaints.filter((c) => c.status !== 'resolved');

  const titleErr = !title.trim() ? 'Add a title' : title.length > LIMITS.broadcastTitleMax ? 'Title is too long' : null;
  const bodyErr = !body.trim() ? 'Add a message' : body.length > LIMITS.broadcastBodyMax ? 'Message is too long' : null;
  const ready = !titleErr && !bodyErr && count > 0;

  const send = async () => {
    setSending(true);
    try {
      await repo.sendBroadcast(me.id, { title, body, audience, selectedIds, complaintId });
      setConfirm(false);
      toast(`Sent to ${count} ${count === 1 ? 'person' : 'people'}`);
      navigation.replace('SentHistory');
    } catch (e) {
      toast(errorText(e), 'error');
      setSending(false);
    }
  };

  const hint = (a: Audience) => {
    if (a === 'selected') return selectedIds.length ? `${selectedIds.length} selected · tap to change` : 'Tap to pick people';
    if (a === 'complaint')
      return chosenComplaint ? `${complaintNo(chosenComplaint.number)} ${chosenComplaint.subCategory} · tap to change` : 'Tap to pick a complaint';
    return undefined;
  };

  return (
    <Screen>
      <ScreenHeader title="Send notification" back />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TextField
            label="Title"
            value={title}
            onChangeText={setTitle}
            maxLength={LIMITS.broadcastTitleMax}
            counter={{ value: title.length, max: LIMITS.broadcastTitleMax }}
            error={submitted ? titleErr : null}
            placeholder="Example, Water supply off on Sunday"
          />
          <TextField
            label="Message"
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={LIMITS.broadcastBodyMax}
            counter={{ value: body.length, max: LIMITS.broadcastBodyMax }}
            error={submitted ? bodyErr : null}
            placeholder="Keep it short and clear"
          />

          <AppText variant="sectionTitle">Who should get it?</AppText>
          {AUDIENCES.map((a) => (
            <RadioRow
              key={a}
              label={AUDIENCE_LABEL[a]}
              hint={hint(a)}
              selected={audience === a}
              onPress={() => {
                setAudience(a);
                if (a === 'selected') setPicker('people');
                if (a === 'complaint') setPicker('complaint');
              }}
            />
          ))}

          <AppText variant="sectionTitle">Preview</AppText>
          <View style={styles.preview}>
            <View style={styles.previewIcon}>
              <AppText color={colors.onPrimary} variant="bodyStrong">
                G
              </AppText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" color={colors.textHint}>
                GIA Connect · now
              </AppText>
              <AppText variant="bodyStrong">{title.trim() || 'Your title'}</AppText>
              <AppText color={colors.textSecondary}>{body.trim() || 'Your message will appear here.'}</AppText>
            </View>
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.countRow}>
            <Feather name="users" size={16} color={colors.textSecondary} />
            <AppText variant="label" color={count ? colors.textSecondary : colors.danger}>
              {count ? `${count} ${count === 1 ? 'person' : 'people'} will get this` : 'Nobody will get this yet'}
            </AppText>
          </View>
          <Button
            title="Send notification"
            icon="send"
            onPress={() => {
              setSubmitted(true);
              if (ready) setConfirm(true);
            }}
          />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={picker === 'people'}
        onClose={() => setPicker(null)}
        title="Pick people"
        scroll={false}
        tall
        footer={<Button title={`Done (${selectedIds.length})`} onPress={() => setPicker(null)} />}
      >
        <PeoplePicker people={people} selected={selectedIds} onChange={setSelectedIds} />
      </BottomSheet>

      <BottomSheet visible={picker === 'complaint'} onClose={() => setPicker(null)} title="Pick a complaint" scroll={false} tall>
        <FlatList
          data={activeComplaints}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: layout.screenPadding, gap: 8, paddingBottom: 8 }}
          ListEmptyComponent={
            <AppText color={colors.textSecondary} center>
              No open complaints.
            </AppText>
          }
          renderItem={({ item }) => {
            const on = item.id === complaintId;
            return (
              <Pressable
                onPress={() => {
                  setComplaintId(item.id);
                  setPicker(null);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={[styles.pickRow, on && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
              >
                <Feather name={getCategory(item.category).icon} size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">
                    {complaintNo(item.number)} {item.subCategory}
                  </AppText>
                  <AppText variant="label" color={colors.textSecondary}>
                    {item.location}
                  </AppText>
                </View>
                {on ? <Feather name="check" size={20} color={colors.primary} /> : null}
              </Pressable>
            );
          }}
        />
      </BottomSheet>

      <ConfirmDialog
        visible={confirm}
        title={`Send to ${count} ${count === 1 ? 'person' : 'people'}?`}
        message={`"${title.trim()}" will go to ${AUDIENCE_LABEL[audience].toLowerCase()}.`}
        confirmLabel="Send"
        loading={sending}
        onConfirm={send}
        onCancel={() => setConfirm(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 24, gap: 10 },
  preview: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  previewIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
