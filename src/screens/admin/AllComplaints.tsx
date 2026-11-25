import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { EmptyState } from '../../components/Card';
import { ChipRow } from '../../components/Chip';
import { ComplaintCard } from '../../components/ComplaintCard';
import { LoadingBlock, Screen, ScreenHeader } from '../../components/Layout';
import { CATEGORIES, getCategory } from '../../domain/categories';
import { SEVERITIES, SEVERITY_LABEL, STATUSES, STATUS_LABEL } from '../../domain/labels';
import type { CategoryId, Severity, Status } from '../../domain/types';
import { useRootNav } from '../../navigation/types';
import { useData } from '../../state/DataContext';
import { colors, fonts, layout, MAX_FONT_SCALE, severityColors } from '../../theme';

type Any = 'any';

export function AllComplaintsScreen() {
  const nav = useRootNav();
  const { complaints, loading } = useData();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status | Any>('any');
  const [severity, setSeverity] = useState<Severity | 'none' | Any>('any');
  const [category, setCategory] = useState<CategoryId | Any>('any');

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^#/, '');
    return complaints.filter((c) => {
      if (status !== 'any' && c.status !== status) return false;
      if (severity === 'none' && c.severity) return false;
      if (severity !== 'any' && severity !== 'none' && c.severity !== severity) return false;
      if (category !== 'any' && c.category !== category) return false;
      if (!t) return true;
      return (
        String(c.number).includes(t) ||
        c.locationKey.includes(t) ||
        getCategory(c.category).name.toLowerCase().includes(t) ||
        c.subCategory.toLowerCase().includes(t)
      );
    });
  }, [complaints, q, status, severity, category]);

  const filtered = status !== 'any' || severity !== 'any' || category !== 'any' || q.trim() !== '';

  return (
    <Screen>
      <ScreenHeader title="All complaints" subtitle={`${shown.length} of ${complaints.length} shown`} />
      <FlatList
        data={shown}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 8, marginBottom: 12 }}>
            <View style={styles.search}>
              <Feather name="search" size={20} color={colors.textSecondary} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search number, location or category"
                placeholderTextColor={colors.textHint}
                accessibilityLabel="Search complaints"
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                style={styles.input}
                autoCorrect={false}
              />
              {q ? (
                <Pressable onPress={() => setQ('')} accessibilityRole="button" accessibilityLabel="Clear search" style={styles.clear}>
                  <Feather name="x" size={18} color={colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>
            <FilterLabel text="Status" />
            <ChipRow
              options={[{ value: 'any' as const, label: 'Any' }, ...STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))]}
              value={status}
              onChange={setStatus}
            />
            <FilterLabel text="Severity" />
            <ChipRow
              options={[
                { value: 'any' as const, label: 'Any' },
                { value: 'none' as const, label: 'Not set', dotColor: severityColors.none },
                ...SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABEL[s], dotColor: severityColors[s] })),
              ]}
              value={severity}
              onChange={setSeverity}
            />
            <FilterLabel text="Category" />
            <ChipRow
              options={[{ value: 'any' as const, label: 'Any' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.name }))]}
              value={category}
              onChange={setCategory}
            />
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: layout.screenPadding }}>
            <ComplaintCard complaint={item} showSeverityHint onPress={() => nav.navigate('ComplaintThread', { id: item.id })} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <LoadingBlock />
          ) : filtered ? (
            <EmptyState icon="search" title="No matches" text="Try clearing a filter or the search." />
          ) : (
            <EmptyState icon="inbox" title="No complaints yet" text="Complaints raised by members will show here." />
          )
        }
      />
    </Screen>
  );
}

function FilterLabel({ text }: { text: string }) {
  return (
    <AppText variant="label" color={colors.textSecondary} style={{ paddingHorizontal: layout.screenPadding }}>
      {text}
    </AppText>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: layout.screenPadding,
    paddingLeft: 12,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.textPrimary, paddingVertical: 10 },
  clear: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
