import { StyleSheet, View } from 'react-native';
import { ROLE_LABEL, SEVERITY_LABEL, STATUS_LABEL } from '../domain/labels';
import type { Role, Severity, Status } from '../domain/types';
import { colors, severityColors, statusColors } from '../theme';
import { AppText } from './AppText';

export function StatusBadge({ status }: { status: Status }) {
  const c = statusColors[status];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]} accessibilityLabel={`Status ${STATUS_LABEL[status]}`}>
      <AppText variant="label" color={c.text}>
        {STATUS_LABEL[status]}
      </AppText>
    </View>
  );
}

export function SeverityBadge({ severity }: { severity: Severity | null }) {
  const color = severityColors[severity ?? 'none'];
  const label = severity ? SEVERITY_LABEL[severity] : 'Not set';
  return (
    <View style={[styles.pill, styles.outline]} accessibilityLabel={`Severity ${label}`}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="label" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

export function RoleTag({ role }: { role: Role }) {
  const soft = role === 'admin' ? colors.primarySoft : role === 'moderator' ? '#EDE9FE' : '#F5F5F4';
  const fg = role === 'admin' ? colors.primaryDark : role === 'moderator' ? '#6D28D9' : colors.textSecondary;
  return (
    <View style={[styles.pill, { backgroundColor: soft }]}>
      <AppText variant="label" color={fg}>
        {ROLE_LABEL[role]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  outline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
