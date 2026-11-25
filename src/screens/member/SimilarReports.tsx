import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { StatusBadge } from '../../components/Badges';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CategoryIcon } from '../../components/ComplaintCard';
import { LoadingBlock, Screen, ScreenHeader } from '../../components/Layout';
import { useToast } from '../../components/Toast';
import { repo } from '../../data';
import { complaintNo } from '../../domain/labels';
import type { Complaint } from '../../domain/types';
import type { RootScreenProps } from '../../navigation/types';
import { useMe } from '../../state/AuthContext';
import { errorText } from '../../state/DataContext';
import { colors, layout } from '../../theme';
import { timeAgo } from '../../utils/time';

export function SimilarReportsScreen({ navigation, route }: RootScreenProps<'SimilarReports'>) {
  const { draft } = route.params;
  const me = useMe();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [matches, setMatches] = useState<Complaint[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    repo.findSimilar(me.id, draft.category, draft.location).then(setMatches);
  }, [me.id, draft.category, draft.location]);

  const openThread = (id: string) =>
    navigation.reset({ index: 1, routes: [{ name: 'Main' }, { name: 'ComplaintThread', params: { id } }] });

  const join = async (c: Complaint) => {
    setBusy(c.id);
    try {
      await repo.joinComplaint(me.id, c.id);
      toast(`You joined ${complaintNo(c.number)}`);
      openThread(c.id);
    } catch (e) {
      toast(errorText(e), 'error');
      setBusy(null);
    }
  };

  const raiseAnyway = async () => {
    setBusy('new');
    try {
      const c = await repo.createComplaint(me.id, draft);
      toast(`Complaint ${complaintNo(c.number)} raised`);
      openThread(c.id);
    } catch (e) {
      toast(errorText(e), 'error');
      setBusy(null);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Someone already reported this" back />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <AppText color={colors.textSecondary}>
          These open complaints are for the same problem at the same place. Join one so the team sees how many people are affected.
        </AppText>
        {matches === null ? <LoadingBlock /> : null}
        {matches?.map((c) => (
          <Card key={c.id} style={{ gap: 12 }}>
            <View style={styles.row}>
              <CategoryIcon category={c.category} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="label" color={colors.textHint}>
                  {complaintNo(c.number)} · raised {timeAgo(c.createdAt)}
                </AppText>
                <AppText variant="bodyStrong">{c.subCategory}</AppText>
                <AppText variant="label" color={colors.textSecondary}>
                  {c.location}
                </AppText>
              </View>
            </View>
            <View style={styles.row}>
              <StatusBadge status={c.status} />
              <Feather name="users" size={16} color={colors.textSecondary} />
              <AppText variant="label" color={colors.textSecondary}>
                {1 + c.joinedByIds.length} {c.joinedByIds.length === 0 ? 'person' : 'people'} reported
              </AppText>
            </View>
            <Button title="Join this complaint" variant="secondary" onPress={() => join(c)} loading={busy === c.id} disabled={!!busy} />
          </Card>
        ))}
        <Button title="No, this is a different problem" variant="text" onPress={raiseAnyway} loading={busy === 'new'} disabled={!!busy} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
