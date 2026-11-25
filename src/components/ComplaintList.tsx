import type Feather from '@expo/vector-icons/Feather';
import { useMemo, useState, type ComponentProps, type ReactElement } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { STATUS_LABEL } from '../domain/labels';
import type { Complaint, Status } from '../domain/types';
import { useRootNav } from '../navigation/types';
import { useMe } from '../state/AuthContext';
import { useData } from '../state/DataContext';
import { layout } from '../theme';
import { EmptyState } from './Card';
import { ChipRow } from './Chip';
import { ComplaintCard } from './ComplaintCard';
import { LoadingBlock } from './Layout';

type Filter = 'all' | Status;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: STATUS_LABEL.open },
  { value: 'in_progress', label: STATUS_LABEL.in_progress },
  { value: 'fixed', label: STATUS_LABEL.fixed },
  { value: 'resolved', label: STATUS_LABEL.resolved },
];

interface Props {
  complaints: Complaint[];
  header?: ReactElement;
  empty: { icon: ComponentProps<typeof Feather>['name']; title: string; text: string };
  bottomPadding?: number;
}

/** Complaint list with status filter chips. Used by member home and moderator home. */
export function ComplaintList({ complaints, header, empty, bottomPadding = 96 }: Props) {
  const me = useMe();
  const nav = useRootNav();
  const { loading, refresh } = useData();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const shown = useMemo(
    () => (filter === 'all' ? complaints : complaints.filter((c) => c.status === filter)),
    [complaints, filter],
  );

  return (
    <FlatList
      data={shown}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await refresh();
            setRefreshing(false);
          }}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 12 }}>
          {header}
          <ChipRow options={FILTERS} value={filter} onChange={setFilter} />
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: layout.screenPadding }}>
          <ComplaintCard
            complaint={item}
            showConfirmStrip={item.status === 'fixed' && item.createdBy === me.id}
            onPress={() =>
              item.status === 'fixed' && item.createdBy === me.id
                ? nav.navigate('ConfirmFix', { id: item.id })
                : nav.navigate('ComplaintThread', { id: item.id })
            }
          />
        </View>
      )}
      ListEmptyComponent={
        loading ? (
          <LoadingBlock />
        ) : filter === 'all' ? (
          <EmptyState icon={empty.icon} title={empty.title} text={empty.text} />
        ) : (
          <EmptyState icon="filter" title={`No ${STATUS_LABEL[filter].toLowerCase()} complaints`} text="Try another filter." />
        )
      }
    />
  );
}
