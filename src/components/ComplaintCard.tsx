import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';
import { getCategory } from '../domain/categories';
import { complaintNo } from '../domain/labels';
import type { CategoryId, Complaint } from '../domain/types';
import { colors, layout, shadow } from '../theme';
import { timeAgo } from '../utils/time';
import { AppText } from './AppText';
import { SeverityBadge, StatusBadge } from './Badges';

export function CategoryIcon({ category, size = 44 }: { category: CategoryId; size?: number }) {
  const cat = getCategory(category);
  return (
    <View style={[styles.icon, { width: size, height: size, borderRadius: size / 3 }]}>
      <Feather name={cat.icon} size={size * 0.48} color={colors.primary} />
    </View>
  );
}

interface Props {
  complaint: Complaint;
  onPress: () => void;
  showConfirmStrip?: boolean;
  showSeverityHint?: boolean;
}

export function ComplaintCard({ complaint: c, onPress, showConfirmStrip, showSeverityHint }: Props) {
  const cat = getCategory(c.category);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Complaint ${complaintNo(c.number)}, ${cat.name}, ${c.subCategory} at ${c.location}`}
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: '#F7F7F5' }]}
    >
      <View style={styles.body}>
        <CategoryIcon category={c.category} />
        <View style={styles.main}>
          <View style={styles.topRow}>
            <AppText variant="label" color={colors.textHint}>
              {complaintNo(c.number)} · {cat.name}
            </AppText>
            <AppText variant="caption" color={colors.textHint}>
              {timeAgo(c.updatedAt)}
            </AppText>
          </View>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {c.subCategory}
          </AppText>
          <View style={styles.locRow}>
            <Feather name="map-pin" size={14} color={colors.textSecondary} />
            <AppText variant="label" color={colors.textSecondary} numberOfLines={1} style={{ flex: 1 }}>
              {c.location}
            </AppText>
          </View>
          <View style={styles.badges}>
            <StatusBadge status={c.status} />
            <SeverityBadge severity={c.severity} />
            {c.joinedByIds.length > 0 ? (
              <View style={styles.joined}>
                <Feather name="users" size={13} color={colors.textSecondary} />
                <AppText variant="caption" color={colors.textSecondary}>
                  +{c.joinedByIds.length}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      {showSeverityHint && !c.severity && c.status !== 'resolved' ? (
        <View style={[styles.strip, { backgroundColor: colors.amberSoft }]}>
          <Feather name="alert-circle" size={16} color={colors.amber} />
          <AppText variant="label" color={colors.amber}>
            Set severity
          </AppText>
        </View>
      ) : null}
      {showConfirmStrip ? (
        <View style={[styles.strip, { backgroundColor: '#EDE9FE' }]}>
          <Feather name="check-circle" size={16} color="#6D28D9" />
          <AppText variant="label" color="#6D28D9">
            Confirm fix
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  body: { flexDirection: 'row', gap: 12, padding: 14 },
  icon: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1, gap: 4, minWidth: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4, alignItems: 'center' },
  joined: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
});
