import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '../../components/Button';
import { EmptyState, SectionTitle, StatCard } from '../../components/Card';
import { ComplaintCard } from '../../components/ComplaintCard';
import { LoadingBlock, Screen, ScreenHeader } from '../../components/Layout';
import { SEVERITY_RANK } from '../../domain/labels';
import { useRootNav } from '../../navigation/types';
import { useMe } from '../../state/AuthContext';
import { useData } from '../../state/DataContext';
import { layout, statusColors } from '../../theme';

export function DashboardScreen() {
  const me = useMe();
  const nav = useRootNav();
  const tabs = useNavigation<{ navigate: (name: string) => void }>();
  const { complaints, loading } = useData();
  const count = (s: string) => complaints.filter((c) => c.status === s).length;

  const attention = complaints
    .filter((c) => c.status !== 'resolved' && (c.severity === 'critical' || c.severity === 'high'))
    .sort((a, b) => SEVERITY_RANK[b.severity!] - SEVERITY_RANK[a.severity!] || b.updatedAt.localeCompare(a.updatedAt));
  const newest = [...complaints].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const open = (id: string) => nav.navigate('ComplaintThread', { id });

  return (
    <Screen>
      <ScreenHeader title="Dashboard" subtitle={`${me.name} · Admin`} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.grid}>
          <View style={styles.pair}>
            <StatCard label="Open" value={count('open')} color={statusColors.open.text} onPress={() => tabs.navigate('Complaints')} />
            <StatCard label="In progress" value={count('in_progress')} color={statusColors.in_progress.text} onPress={() => tabs.navigate('Complaints')} />
          </View>
          <View style={styles.pair}>
            <StatCard label="Fixed" value={count('fixed')} color={statusColors.fixed.text} onPress={() => tabs.navigate('Complaints')} />
            <StatCard label="Resolved" value={count('resolved')} color={statusColors.resolved.text} onPress={() => tabs.navigate('Complaints')} />
          </View>
        </View>

        <View style={styles.pair}>
          <Button title="Send notification" icon="send" style={{ flex: 1 }} onPress={() => nav.navigate('Compose')} />
          <Button title="View hotspots" icon="map-pin" variant="secondary" style={{ flex: 1 }} onPress={() => tabs.navigate('Hotspots')} />
        </View>

        <SectionTitle>Needs attention</SectionTitle>
        {loading ? <LoadingBlock /> : null}
        {!loading && attention.length === 0 ? (
          <EmptyState icon="check-circle" title="All calm" text="No high or critical complaints are open." />
        ) : null}
        {attention.map((c) => (
          <ComplaintCard key={c.id} complaint={c} onPress={() => open(c.id)} />
        ))}

        <SectionTitle>Newest complaints</SectionTitle>
        {!loading && newest.length === 0 ? <EmptyState icon="inbox" title="No complaints yet" text="New complaints will show here." /> : null}
        {newest.map((c) => (
          <ComplaintCard key={c.id} complaint={c} showSeverityHint onPress={() => open(c.id)} />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 32, gap: 12 },
  grid: { gap: 8 },
  pair: { flexDirection: 'row', gap: 8 },
});
