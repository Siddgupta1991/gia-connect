import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { PublicUser } from '../domain/types';
import { colors, fonts, layout, MAX_FONT_SCALE } from '../theme';
import { AppText } from './AppText';
import { Avatar } from './Avatar';
import { RoleTag } from './Badges';
import { EmptyState } from './Card';

interface Props {
  people: PublicUser[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

/** Searchable multi select list of people. Search matches name or industry. */
export function PeoplePicker({ people, selected, onChange }: Props) {
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return people;
    return people.filter((p) => p.name.toLowerCase().includes(t) || p.industryName.toLowerCase().includes(t));
  }, [people, q]);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.search}>
        <Feather name="search" size={20} color={colors.textSecondary} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search by name or industry"
          placeholderTextColor={colors.textHint}
          accessibilityLabel="Search by name or industry"
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
      <FlatList
        data={shown}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: layout.screenPadding, paddingBottom: 8 }}
        ListEmptyComponent={<EmptyState icon="users" title="Nobody found" text="Try another name." />}
        renderItem={({ item }) => {
          const on = selected.includes(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${item.name}, ${item.industryName}`}
              style={({ pressed }) => [styles.row, on && { backgroundColor: colors.primarySoft }, pressed && !on && { backgroundColor: '#F7F7F5' }]}
            >
              <Avatar name={item.name} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {item.name}
                </AppText>
                <AppText variant="label" color={colors.textSecondary} numberOfLines={1}>
                  {item.industryName}
                </AppText>
              </View>
              <RoleTag role={item.role} />
              <View style={[styles.check, on && styles.checkOn]}>{on ? <Feather name="check" size={16} color="#fff" /> : null}</View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: layout.screenPadding,
    marginBottom: 8,
    paddingLeft: 12,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.textPrimary, paddingVertical: 10 },
  clear: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, minHeight: 64 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
