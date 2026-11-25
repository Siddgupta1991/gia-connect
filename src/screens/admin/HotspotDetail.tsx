import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { EmptyState } from '../../components/Card';
import { ComplaintCard } from '../../components/ComplaintCard';
import { Screen, ScreenHeader } from '../../components/Layout';
import { getCategory } from '../../domain/categories';
import { complaintsAtLocation } from '../../domain/hotspots';
import type { RootScreenProps } from '../../navigation/types';
import { useData } from '../../state/DataContext';
import { colors, layout } from '../../theme';
import { formatDate } from '../../utils/time';

export function HotspotDetailScreen({ navigation, route }: RootScreenProps<'HotspotDetail'>) {
  const { locationKey, category } = route.params;
  const { complaints } = useData();
  const list = useMemo(() => complaintsAtLocation(complaints, locationKey, category), [complaints, locationKey, category]);
  const cats = new Set(list.map((c) => c.category)).size;
  const open = list.filter((c) => c.status !== 'resolved').length;
  const title = list[0]?.location ?? locationKey;

  return (
    <Screen>
      <ScreenHeader
        title={title}
        subtitle={`${list.length} ${list.length === 1 ? 'complaint' : 'complaints'}, ${cats} ${cats === 1 ? 'category' : 'categories'}${category ? ` (${getCategory(category).name})` : ''} · ${open} open`}
        back
      />
      <FlatList
        data={list}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: layout.screenPadding, paddingBottom: 24 }}
        ListEmptyComponent={<EmptyState icon="map-pin" title="Nothing here now" text="These complaints were moved or removed." />}
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            <View style={styles.rail}>
              <View style={styles.dot} />
              {index < list.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={{ flex: 1, gap: 6, paddingBottom: 16 }}>
              <AppText variant="label" color={colors.textSecondary}>
                {formatDate(item.createdAt)}
              </AppText>
              <ComplaintCard complaint={item} showSeverityHint onPress={() => navigation.navigate('ComplaintThread', { id: item.id })} />
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12 },
  rail: { width: 14, alignItems: 'center', paddingTop: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },
});
