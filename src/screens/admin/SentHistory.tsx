import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card, EmptyState } from '../../components/Card';
import { LoadingBlock, Screen, ScreenHeader } from '../../components/Layout';
import { repo } from '../../data';
import { AUDIENCE_LABEL } from '../../domain/labels';
import type { Broadcast } from '../../domain/types';
import type { RootScreenProps } from '../../navigation/types';
import { useMe } from '../../state/AuthContext';
import { useData } from '../../state/DataContext';
import { colors, layout } from '../../theme';
import { timeAgo } from '../../utils/time';

/** Read counts per broadcast, refreshed whenever data changes. */
export function useReadCounts(broadcasts: Broadcast[]) {
  const me = useMe();
  const [reads, setReads] = useState<Record<string, string[]>>({});
  useEffect(() => {
    let alive = true;
    Promise.all(broadcasts.map(async (b) => [b.id, await repo.broadcastReaders(me.id, b.id)] as const)).then((pairs) => {
      if (alive) setReads(Object.fromEntries(pairs));
    });
    return () => {
      alive = false;
    };
  }, [broadcasts, me.id]);
  return reads;
}

export function SentHistoryScreen({ navigation }: RootScreenProps<'SentHistory'>) {
  const { broadcasts, loading } = useData();
  const reads = useReadCounts(broadcasts);

  return (
    <Screen>
      <ScreenHeader
        title="Sent notifications"
        back
        right={<Button title="New" icon="edit-3" variant="text" compact onPress={() => navigation.navigate('Compose')} />}
      />
      <FlatList
        data={broadcasts}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingHorizontal: layout.screenPadding, paddingBottom: 24, gap: 12 }}
        ListEmptyComponent={loading ? <LoadingBlock /> : <EmptyState icon="send" title="Nothing sent yet" text="Notifications you send will show here." />}
        renderItem={({ item }) => {
          const read = reads[item.id]?.length ?? 0;
          return (
            <Card style={{ gap: 6 }} onPress={() => navigation.navigate('BroadcastDetail', { id: item.id })} accessibilityLabel={`${item.title}, read by ${read} of ${item.recipientIds.length}`}>
              <View style={styles.top}>
                <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={2}>
                  {item.title}
                </AppText>
                <AppText variant="caption" color={colors.textHint}>
                  {timeAgo(item.createdAt)}
                </AppText>
              </View>
              <AppText color={colors.textSecondary} numberOfLines={2}>
                {item.body}
              </AppText>
              <View style={styles.meta}>
                <Feather name="users" size={14} color={colors.textSecondary} />
                <AppText variant="label" color={colors.textSecondary}>
                  {AUDIENCE_LABEL[item.audience]} · {item.recipientIds.length} sent
                </AppText>
                <Feather name="eye" size={14} color={colors.primary} style={{ marginLeft: 8 }} />
                <AppText variant="label" color={colors.primaryDark}>
                  {read} read
                </AppText>
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
});
