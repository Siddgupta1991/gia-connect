import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/Card';
import { Fab, LoadingBlock, Screen, ScreenHeader } from '../../components/Layout';
import { useToast } from '../../components/Toast';
import { repo } from '../../data';
import type { AppNotification } from '../../domain/types';
import { useRootNav } from '../../navigation/types';
import { useMe } from '../../state/AuthContext';
import { useData } from '../../state/DataContext';
import { colors, layout } from '../../theme';
import { timeAgo } from '../../utils/time';

const ICON: Record<AppNotification['kind'], ComponentProps<typeof Feather>['name']> = {
  complaint_raised: 'file-plus',
  added_to_complaint: 'user-plus',
  status_changed: 'activity',
  new_message: 'message-circle',
  custom: 'volume-2',
};

export function AlertsScreen() {
  const me = useMe();
  const nav = useRootNav();
  const toast = useToast();
  const { notifications, unreadCount, loading, complaints } = useData();
  const isAdmin = me.role === 'admin';

  const open = async (n: AppNotification) => {
    if (!n.readAt) await repo.markRead(me.id, n.id);
    if (!n.complaintId) return;
    const c = complaints.find((x) => x.id === n.complaintId);
    if (!c) {
      toast('This complaint is no longer available to you', 'info');
      return;
    }
    if (c.status === 'fixed' && c.createdBy === me.id) nav.navigate('ConfirmFix', { id: c.id });
    else nav.navigate('ComplaintThread', { id: c.id });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Alerts"
        subtitle={unreadCount ? `${unreadCount} unread` : 'You are all caught up'}
        right={
          <View style={{ flexDirection: 'row' }}>
            {isAdmin ? <Button title="Sent" variant="text" compact icon="send" onPress={() => nav.navigate('SentHistory')} /> : null}
            {unreadCount > 0 ? <Button title="Mark all read" variant="text" compact onPress={() => repo.markAllRead(me.id)} /> : null}
          </View>
        }
      />
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingBottom: isAdmin ? 100 : 24 }}
        ListEmptyComponent={loading ? <LoadingBlock /> : <EmptyState icon="bell" title="No alerts yet" text="Updates about your complaints will show here." />}
        renderItem={({ item }) => {
          const unread = !item.readAt;
          return (
            <Pressable
              onPress={() => open(item)}
              accessibilityRole="button"
              accessibilityLabel={`${unread ? 'Unread. ' : ''}${item.title}. ${item.body}`}
              style={({ pressed }) => [styles.row, unread && { backgroundColor: colors.primarySoft }, pressed && { opacity: 0.8 }]}
            >
              <View style={[styles.icon, item.kind === 'custom' && { backgroundColor: colors.primary }]}>
                <Feather name={ICON[item.kind]} size={20} color={item.kind === 'custom' ? colors.onPrimary : colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">{item.title}</AppText>
                <AppText color={colors.textSecondary} numberOfLines={3}>
                  {item.body}
                </AppText>
                <AppText variant="caption" color={colors.textHint}>
                  {timeAgo(item.createdAt)}
                </AppText>
              </View>
              {unread ? <View style={styles.dot} accessibilityElementsHidden /> : null}
            </Pressable>
          );
        }}
      />
      {isAdmin ? <Fab icon="edit-3" label="Compose a notification" onPress={() => nav.navigate('Compose')} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6 },
});
