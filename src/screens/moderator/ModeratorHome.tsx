import { View } from 'react-native';
import { AppText } from '../../components/AppText';
import { ComplaintList } from '../../components/ComplaintList';
import { Screen } from '../../components/Layout';
import { useMe } from '../../state/AuthContext';
import { useData } from '../../state/DataContext';
import { colors, layout } from '../../theme';

export function ModeratorHomeScreen() {
  const me = useMe();
  const { complaints } = useData();
  return (
    <Screen>
      <ComplaintList
        complaints={complaints}
        bottomPadding={24}
        empty={{ icon: 'clipboard', title: 'Nothing assigned yet', text: 'Nothing assigned yet. The admin will add you to issues.' }}
        header={
          <View style={{ paddingHorizontal: layout.screenPadding, paddingTop: 16 }}>
            <AppText variant="screenTitle" accessibilityRole="header">
              Assigned to me
            </AppText>
            <AppText color={colors.textSecondary}>
              {me.name} · {complaints.filter((c) => c.status !== 'resolved').length} active
            </AppText>
          </View>
        }
      />
    </Screen>
  );
}
