import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { SeverityBadge } from '../../components/Badges';
import { EmptyState } from '../../components/Card';
import { LoadingBlock, Screen, ScreenHeader } from '../../components/Layout';
import { getCategory } from '../../domain/categories';
import { mixedHotspots, repeatedHotspots, type Hotspot, type HotspotKind } from '../../domain/hotspots';
import { useRootNav } from '../../navigation/types';
import { useData } from '../../state/DataContext';
import { colors, fonts, layout, shadow } from '../../theme';

export function HotspotsScreen() {
  const nav = useRootNav();
  const { complaints, loading } = useData();
  const [tab, setTab] = useState<HotspotKind>('repeated');
  const repeated = useMemo(() => repeatedHotspots(complaints), [complaints]);
  const mixed = useMemo(() => mixedHotspots(complaints), [complaints]);
  const list = tab === 'repeated' ? repeated : mixed;

  return (
    <Screen>
      <ScreenHeader title="Hotspots" subtitle="Places with many open complaints" />
      <View style={styles.segment} accessibilityRole="tablist">
        {(['repeated', 'mixed'] as const).map((k) => {
          const on = tab === k;
          return (
            <Pressable
              key={k}
              onPress={() => setTab(k)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[styles.segBtn, on && styles.segOn]}
            >
              <AppText style={{ fontFamily: on ? fonts.semibold : fonts.medium, fontSize: 15 }} color={on ? colors.primaryDark : colors.textSecondary}>
                {k === 'repeated' ? `Repeated (${repeated.length})` : `Mixed (${mixed.length})`}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText variant="caption" color={colors.textSecondary} style={{ paddingHorizontal: layout.screenPadding, marginBottom: 12 }}>
        {tab === 'repeated'
          ? 'Same problem reported two or more times at one place.'
          : 'Two or more different problems at one place.'}
      </AppText>
      <FlatList
        data={list}
        keyExtractor={(h) => h.key}
        contentContainerStyle={{ paddingHorizontal: layout.screenPadding, paddingBottom: 24, gap: 12 }}
        ListEmptyComponent={loading ? <LoadingBlock /> : <EmptyState icon="map-pin" title="No hotspots" text="No place has repeated open complaints right now." />}
        renderItem={({ item }) => (
          <HotspotRow h={item} onPress={() => nav.navigate('HotspotDetail', { locationKey: item.locationKey, category: item.category })} />
        )}
      />
    </Screen>
  );
}

function HotspotRow({ h, onPress }: { h: Hotspot; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${h.location}, ${h.count} complaints`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#F7F7F5' }]}
    >
      <View style={styles.count}>
        <AppText style={{ fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 }} color={colors.primaryDark}>
          {h.count}
        </AppText>
      </View>
      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {h.location}
        </AppText>
        <View style={styles.icons}>
          {h.categories.map((c) => {
            const cat = getCategory(c);
            return (
              <View key={c} style={styles.catPill}>
                <Feather name={cat.icon} size={14} color={colors.primary} />
                <AppText variant="caption" color={colors.textSecondary}>
                  {cat.name}
                </AppText>
              </View>
            );
          })}
        </View>
        <SeverityBadge severity={h.highestSeverity} />
      </View>
      <Feather name="chevron-right" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    marginHorizontal: layout.screenPadding,
    marginBottom: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F0EFEC',
  },
  segBtn: { flex: 1, minHeight: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.surface, ...shadow },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow,
  },
  count: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.primarySoft },
});
