import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CategoryDef } from '../domain/categories';
import { colors, fonts, layout } from '../theme';
import { AppText } from './AppText';

export function CategoryTile({ category, selected, onPress }: { category: CategoryDef; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={category.name}
      style={({ pressed }) => [
        styles.tile,
        selected && styles.selected,
        pressed && !selected && { backgroundColor: '#F7F7F5' },
      ]}
    >
      <View style={[styles.icon, selected && { backgroundColor: colors.primary }]}>
        <Feather name={category.icon} size={26} color={selected ? colors.onPrimary : colors.primary} />
      </View>
      <AppText
        center
        style={{ fontFamily: selected ? fonts.semibold : fonts.medium, fontSize: 15 }}
        color={selected ? colors.primaryDark : colors.textPrimary}
      >
        {category.name}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 112,
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
  },
  selected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primarySoft },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
