import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { CategoryTile } from '../../components/CategoryTile';
import { Chip } from '../../components/Chip';
import { Screen, ScreenHeader } from '../../components/Layout';
import { StepProgress } from '../../components/StepProgress';
import { CATEGORIES, getCategory } from '../../domain/categories';
import type { CategoryId } from '../../domain/types';
import type { RootScreenProps } from '../../navigation/types';
import { colors, layout } from '../../theme';

export function NewComplaintStep1Screen({ navigation }: RootScreenProps<'NewComplaintStep1'>) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [sub, setSub] = useState<string | null>(null);

  return (
    <Screen>
      <ScreenHeader title="New complaint" back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <StepProgress step={1} of={2} />
        <AppText variant="sectionTitle">What is the problem?</AppText>
        <View style={styles.grid}>
          {CATEGORIES.map((c) => (
            <CategoryTile
              key={c.id}
              category={c}
              selected={category === c.id}
              onPress={() => {
                if (category !== c.id) {
                  setCategory(c.id);
                  const subs = c.subCategories;
                  setSub(subs.length === 1 ? subs[0] : null);
                }
              }}
            />
          ))}
        </View>
        {category ? (
          <View style={{ gap: 12 }}>
            <AppText variant="sectionTitle">Pick the exact issue</AppText>
            <View style={styles.chips}>
              {getCategory(category).subCategories.map((s) => (
                <Chip key={s} label={s} selected={sub === s} onPress={() => setSub(s)} />
              ))}
            </View>
          </View>
        ) : (
          <AppText color={colors.textSecondary}>Choose a category to see the options.</AppText>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          title="Next"
          disabled={!category || !sub}
          onPress={() => category && sub && navigation.navigate('NewComplaintStep2', { category, subCategory: sub })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 24, gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
