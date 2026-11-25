import Feather from '@expo/vector-icons/Feather';
import { useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { SeverityBadge, StatusBadge } from '../../components/Badges';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CategoryIcon } from '../../components/ComplaintCard';
import { IconButton, LoadingBlock, Screen } from '../../components/Layout';
import { MessageBubble, SystemMessage } from '../../components/Messages';
import { BottomSheet, ConfirmDialog } from '../../components/Overlays';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { repo } from '../../data';
import { getCategory } from '../../domain/categories';
import { complaintNo } from '../../domain/labels';
import { sheetStatusOptions } from '../../domain/lifecycle';
import type { Complaint, Message } from '../../domain/types';
import { LIMITS } from '../../domain/validation';
import { canAddPeople, canChat, threadMemberIds } from '../../domain/visibility';
import { useRootNav, type RootScreenProps } from '../../navigation/types';
import { useMe } from '../../state/AuthContext';
import { errorText, useComplaint, useData, useMessages } from '../../state/DataContext';
import { colors, fonts, layout, MAX_FONT_SCALE } from '../../theme';
import { formatDate, formatDateTime } from '../../utils/time';
import { AddPeopleSheet, SeverityStatusSheet } from './ThreadSheets';

type Action = 'severity' | 'status' | 'people' | 'resolve';

export function ComplaintThreadScreen({ navigation, route }: RootScreenProps<'ComplaintThread'>) {
  const { loading } = useData();
  const c = useComplaint(route.params.id);

  if (!c) {
    return (
      <Screen>
        <View style={styles.topBar}>
          <IconButton icon="arrow-left" label="Go back" onPress={() => navigation.goBack()} />
        </View>
        {loading ? (
          <LoadingBlock />
        ) : (
          <View style={{ padding: 24, gap: 8 }}>
            <AppText variant="sectionTitle">Complaint not available</AppText>
            <AppText color={colors.textSecondary}>It may have been removed, or you are not part of it.</AppText>
          </View>
        )}
      </Screen>
    );
  }
  return <Thread key={c.id} complaint={c} />;
}

function Thread({ complaint: c }: { complaint: Complaint }) {
  const me = useMe();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const navigation = useRootNav();
  const { userById } = useData();
  const { messages, loading } = useMessages(c.id);
  const listRef = useRef<FlatList<Message>>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [sheet, setSheet] = useState<Action | null>(null);
  const [resolving, setResolving] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reopening, setReopening] = useState(false);

  const isAdmin = me.role === 'admin';
  const isComplainant = c.createdBy === me.id;
  const resolved = c.status === 'resolved';
  const people = threadMemberIds(c);

  const actions = useMemo(() => {
    const list: { key: Action; label: string; icon: 'alert-octagon' | 'activity' | 'user-plus' | 'check-circle'; danger?: boolean }[] = [];
    if (resolved) return list;
    if (isAdmin) list.push({ key: 'severity', label: 'Set severity', icon: 'alert-octagon' });
    if (isAdmin || (me.role === 'moderator' && sheetStatusOptions(me, c).length > 0))
      list.push({ key: 'status', label: 'Change status', icon: 'activity' });
    if (canAddPeople(me, c)) list.push({ key: 'people', label: 'Add people', icon: 'user-plus' });
    if (isAdmin) list.push({ key: 'resolve', label: 'Resolve now', icon: 'check-circle', danger: true });
    return list;
  }, [c, me, isAdmin, resolved]);

  const runAction = (a: Action) => {
    setMenuOpen(false);
    // Wait for the menu sheet to finish closing. iOS cannot present a modal while another is dismissing.
    setTimeout(() => {
      if (a === 'resolve') setResolving(true);
      else setSheet(a === 'severity' ? 'status' : a);
    }, 350);
  };

  const [busyResolve, setBusyResolve] = useState(false);
  const resolveNow = async () => {
    setBusyResolve(true);
    try {
      await repo.resolveComplaint(me.id, c.id);
      toast(`${complaintNo(c.number)} resolved. Chat deleted.`);
      setResolving(false);
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusyResolve(false);
    }
  };

  const reopen = async () => {
    setReopening(true);
    try {
      await repo.reopenComplaint(me.id, c.id, reason);
      toast(`${complaintNo(c.number)} was reopened`);
      setReopenOpen(false);
      setReason('');
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setReopening(false);
    }
  };

  const cat = getCategory(c.category);
  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.catRow}>
        <CategoryIcon category={c.category} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="label" color={colors.textSecondary}>
            {cat.name} · raised {formatDate(c.createdAt)} by {userById(c.createdBy)?.name ?? 'a member'}
          </AppText>
          <AppText variant="sectionTitle">{c.subCategory}</AppText>
          <View style={styles.locRow}>
            <Feather name="map-pin" size={14} color={colors.textSecondary} />
            <AppText variant="label" color={colors.textSecondary} style={{ flex: 1 }}>
              {c.location}
            </AppText>
          </View>
        </View>
      </View>
      <Card style={{ padding: 14 }}>
        <AppText>{c.description}</AppText>
      </Card>
      <View style={{ gap: 8 }}>
        <AppText variant="label" color={colors.textSecondary}>
          People in this issue
        </AppText>
        <View style={styles.avatars}>
          {people.slice(0, 8).map((id, i) => {
            const u = userById(id);
            return (
              <View key={id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                <Avatar name={u?.name ?? '?'} size={36} ring />
              </View>
            );
          })}
          <AppText variant="label" color={colors.textSecondary} style={{ marginLeft: 8, flex: 1 }} numberOfLines={2}>
            {people.map((id) => userById(id)?.name.split(' ')[0] ?? '?').join(', ')}
          </AppText>
        </View>
        {c.joinedByIds.length > 0 ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {c.joinedByIds.length} more {c.joinedByIds.length === 1 ? 'member' : 'members'} reported the same problem
          </AppText>
        ) : null}
      </View>
      {!resolved ? (
        <AppText variant="label" color={colors.textHint} center style={{ marginTop: 8 }}>
          Chat is private to the people in this issue and the admin
        </AppText>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" label="Go back" onPress={() => navigation.goBack()} />
        <AppText variant="sectionTitle" style={{ marginRight: 4 }}>
          {complaintNo(c.number)}
        </AppText>
        <View style={styles.badges}>
          <StatusBadge status={c.status} />
          <SeverityBadge severity={c.severity} />
        </View>
        {actions.length > 0 ? <IconButton icon="more-vertical" label="Complaint actions" onPress={() => setMenuOpen(true)} /> : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        {resolved ? (
          <FlatList
            data={[] as Message[]}
            renderItem={() => null}
            ListHeaderComponent={
              <View>
                {header}
                <View style={{ paddingHorizontal: layout.screenPadding, gap: 12, paddingBottom: insets.bottom + 24 }}>
                  <View style={styles.deleted}>
                    <Feather name="trash-2" size={18} color={colors.textSecondary} />
                    <AppText color={colors.textSecondary} style={{ flex: 1 }}>
                      This conversation was deleted because the issue was resolved.
                    </AppText>
                  </View>
                  <Card style={{ gap: 6 }}>
                    <View style={styles.locRow}>
                      <Feather name="check-circle" size={18} color={colors.success} />
                      <AppText variant="bodyStrong">Resolved</AppText>
                    </View>
                    <AppText color={colors.textSecondary}>
                      By {userById(c.resolvedBy)?.name ?? 'the team'}
                      {c.resolvedAt ? ` on ${formatDateTime(c.resolvedAt)}` : ''}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      If the problem comes back, please raise a new complaint.
                    </AppText>
                  </Card>
                </View>
              </View>
            }
          />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            ListHeaderComponent={header}
            contentContainerStyle={{ paddingBottom: 12 }}
            onContentSizeChange={() => {
              if (messages.length > 0) listRef.current?.scrollToEnd({ animated: false });
            }}
            ListEmptyComponent={loading ? <LoadingBlock /> : <SystemMessage text="No messages yet. Say hello." />}
            renderItem={({ item }) =>
              item.kind === 'system' ? (
                <SystemMessage text={item.text} />
              ) : (
                <MessageBubble
                  text={item.text}
                  mine={item.senderId === me.id}
                  senderName={userById(item.senderId)?.name ?? 'Unknown'}
                  createdAt={item.createdAt}
                />
              )
            }
          />
        )}

        {c.status === 'fixed' && isComplainant ? (
          <View style={styles.fixedBar}>
            <AppText variant="bodyStrong" color="#5B21B6">
              The team marked this as fixed
            </AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Confirm fix" style={{ flex: 1 }} compact onPress={() => navigation.navigate('ConfirmFix', { id: c.id })} />
              <Button title="Reopen" variant="secondary" style={{ flex: 1 }} compact onPress={() => setReopenOpen(true)} />
            </View>
          </View>
        ) : null}

        {canChat(me, c) ? <Composer complaintId={c.id} bottomInset={insets.bottom} /> : null}
      </KeyboardAvoidingView>

      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)} title={`${complaintNo(c.number)} actions`}>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            onPress={() => runAction(a.key)}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: '#F5F5F4' }]}
          >
            <Feather name={a.icon} size={22} color={a.danger ? colors.danger : colors.primary} />
            <AppText variant="bodyStrong" color={a.danger ? colors.danger : colors.textPrimary}>
              {a.label}
            </AppText>
          </Pressable>
        ))}
      </BottomSheet>

      {/* Mounted only while open so each opening starts fresh. */}
      {sheet === 'people' ? <AddPeopleSheet complaint={c} visible onClose={() => setSheet(null)} /> : null}
      {sheet === 'status' ? <SeverityStatusSheet complaint={c} visible onClose={() => setSheet(null)} /> : null}

      <ConfirmDialog
        visible={resolving}
        title="Resolve this complaint?"
        message="The whole chat will be deleted forever. This cannot be undone."
        confirmLabel="Resolve and delete chat"
        destructive
        loading={busyResolve}
        onConfirm={resolveNow}
        onCancel={() => setResolving(false)}
      />

      <ConfirmDialog
        visible={reopenOpen}
        title="Reopen this complaint?"
        message="Tell the team what is still wrong."
        confirmLabel="Reopen"
        loading={reopening}
        onConfirm={reopen}
        onCancel={() => setReopenOpen(false)}
      >
        <TextField
          label="Reason"
          value={reason}
          onChangeText={setReason}
          multiline
          placeholder="Example, the leak started again"
          error={reason.length > 0 && reason.trim().length < LIMITS.reasonMin ? 'Add a few more words' : null}
        />
      </ConfirmDialog>
    </Screen>
  );
}

function Composer({ complaintId, bottomInset }: { complaintId: string; bottomInset: number }) {
  const me = useMe();
  const toast = useToast();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await repo.sendMessage(me.id, complaintId, t);
      setText('');
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setSending(false);
    }
  };

  const canSend = text.trim().length > 0 && !sending;
  return (
    <View style={[styles.composer, { paddingBottom: keyboardOpen ? 8 : Math.max(bottomInset, 8) }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write a message"
        placeholderTextColor={colors.textHint}
        accessibilityLabel="Message"
        multiline
        maxLength={LIMITS.messageMax}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        onFocus={() => setKeyboardOpen(true)}
        onBlur={() => setKeyboardOpen(false)}
        style={styles.input}
      />
      <Pressable
        onPress={send}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        style={({ pressed }) => [
          styles.send,
          { backgroundColor: canSend ? (pressed ? colors.primaryDark : colors.primary) : colors.border },
        ]}
      >
        <Feather name="send" size={20} color={canSend ? colors.onPrimary : colors.textHint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 4, gap: 4, minHeight: 56 },
  badges: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  headerBlock: { paddingHorizontal: layout.screenPadding, paddingTop: 4, paddingBottom: 12, gap: 14 },
  catRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatars: { flexDirection: 'row', alignItems: 'center' },
  deleted: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: '#F0EFEC',
    borderRadius: 12,
    padding: 14,
  },
  fixedBar: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#DDD6FE',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingHorizontal: 8, borderRadius: 12 },
});
