import Feather from '@expo/vector-icons/Feather';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Screen, ScreenHeader } from '../../components/Layout';
import { AUDIENCE_LABEL, complaintNo } from '../../domain/labels';
import type { RootScreenProps } from '../../navigation/types';
import { useData } from '../../state/DataContext';
import { colors, layout } from '../../theme';
import { formatDateTime } from '../../utils/time';
import { useReadCounts } from './SentHistory';

export function BroadcastDetailScreen({ route }: RootScreenProps<'BroadcastDetail'>) {
  const { broadcasts, userById, complaints } = useData();
  const b = broadcasts.find((x) => x.id === route.params.id);
  const list = useMemo(() => (b ? [b] : []), [b]);
  const reads = useReadCounts(list);

  if (!b) {
    return (
      <Screen>
        <ScreenHeader title="Notification" back />
        <EmptyState icon="send" title="Not found" text="This notification is no longer available." />
      </Screen>
    );
  }
  const readers = new Set(reads[b.id] ?? []);
  const complaint = complaints.find((c) => c.id === b.complaintId);

  return (
    <Screen>
      <ScreenHeader title="Notification" back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={{ gap: 8 }}>
          <AppText variant="sectionTitle">{b.title}</AppText>
          <AppText>{b.body}</AppText>
          <AppText variant="caption" color={colors.textHint}>
            Sent {formatDateTime(b.createdAt)} to {AUDIENCE_LABEL[b.audience].toLowerCase()}
            {complaint ? ` (${complaintNo(complaint.number)})` : ''}
          </AppText>
        </Card>
        <SectionTitle>{`Read by ${readers.size} of ${b.recipientIds.length}`}</SectionTitle>
        {b.recipientIds.map((id) => {
          const u = userById(id);
          const read = readers.has(id);
          return (
            <View key={id} style={styles.row}>
              <Avatar name={u?.name ?? '?'} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{u?.name ?? 'Removed user'}</AppText>
                <AppText variant="label" color={colors.textSecondary}>
                  {u?.industryName ?? ''}
                </AppText>
              </View>
              <Feather name={read ? 'check-circle' : 'circle'} size={20} color={read ? colors.success : colors.textMuted} />
              <AppText variant="label" color={read ? colors.success : colors.textHint}>
                {read ? 'Read' : 'Not yet'}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 32, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
});
