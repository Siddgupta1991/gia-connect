import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { formatTime } from '../utils/time';
import { AppText } from './AppText';

export function MessageBubble({ text, mine, senderName, createdAt }: {
  text: string;
  mine: boolean;
  senderName: string;
  createdAt: string;
}) {
  return (
    <View style={[styles.row, mine ? styles.right : styles.left]}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        {!mine ? (
          <AppText variant="label" color={colors.primaryDark}>
            {senderName}
          </AppText>
        ) : null}
        <AppText color={mine ? colors.onPrimary : colors.textPrimary}>{text}</AppText>
        <AppText variant="caption" color={mine ? '#E0E7FF' : colors.textHint} style={{ alignSelf: 'flex-end' }}>
          {mine ? 'You · ' : ''}
          {formatTime(createdAt)}
        </AppText>
      </View>
    </View>
  );
}

export function SystemMessage({ text }: { text: string }) {
  return (
    <View style={styles.system}>
      <AppText variant="caption" color={colors.textSecondary} center>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 16, marginVertical: 4 },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, gap: 2 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  system: {
    alignSelf: 'center',
    backgroundColor: '#F0EFEC',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginVertical: 6,
    marginHorizontal: 24,
  },
});
