import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { StatCard } from '../../components/Card';
import { ComplaintList } from '../../components/ComplaintList';
import { Fab, Screen } from '../../components/Layout';
import { firstName } from '../../domain/labels';
import { useRootNav } from '../../navigation/types';
import { useMe } from '../../state/AuthContext';
import { useData } from '../../state/DataContext';
import { colors, layout, statusColors } from '../../theme';

export function MemberHomeScreen() {
  const me = useMe();
  const nav = useRootNav();
  const { complaints } = useData();
  const count = (s: string) => complaints.filter((c) => c.status === s).length;

  return (
    <Screen>
      <ComplaintList
        complaints={complaints}
        empty={{ icon: 'inbox', title: 'No complaints yet', text: 'No complaints yet. Tap + to raise one.' }}
        header={
          <View style={styles.header}>
            <View>
              <AppText variant="screenTitle" accessibilityRole="header">
                Hello, {firstName(me.name)}
              </AppText>
              <AppText color={colors.textSecondary}>{me.industryName}</AppText>
            </View>
            <View style={styles.stats}>
              <StatCard label="Open" value={count('open')} color={statusColors.open.text} />
              <StatCard label="In progress" value={count('in_progress')} color={statusColors.in_progress.text} />
              <StatCard label="Fixed" value={count('fixed')} color={statusColors.fixed.text} />
            </View>
          </View>
        }
      />
      <Fab label="Raise a new complaint" onPress={() => nav.navigate('NewComplaintStep1')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenPadding, paddingTop: 16, gap: 16 },
  stats: { flexDirection: 'row', gap: 8 },
});
