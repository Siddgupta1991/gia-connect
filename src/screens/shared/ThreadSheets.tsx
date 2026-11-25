import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { RadioRow } from '../../components/Layout';
import { BottomSheet } from '../../components/Overlays';
import { PeoplePicker } from '../../components/PeoplePicker';
import { useToast } from '../../components/Toast';
import { repo } from '../../data';
import { SEVERITIES, SEVERITY_LABEL, STATUS_LABEL } from '../../domain/labels';
import { sheetStatusOptions } from '../../domain/lifecycle';
import type { Complaint, Severity, Status } from '../../domain/types';
import { isInThread } from '../../domain/visibility';
import { useMe } from '../../state/AuthContext';
import { errorText, useData } from '../../state/DataContext';
import { colors, severityColors } from '../../theme';

export function AddPeopleSheet({ complaint, visible, onClose }: { complaint: Complaint; visible: boolean; onClose: () => void }) {
  const me = useMe();
  const toast = useToast();
  const { users } = useData();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const candidates = useMemo(
    () => users.filter((u) => !isInThread(u.id, complaint) && u.id !== me.id),
    [users, complaint, me.id],
  );

  const save = async () => {
    setLoading(true);
    try {
      const n = await repo.addPeople(me.id, complaint.id, selected);
      toast(`Added ${n} ${n === 1 ? 'person' : 'people'}`);
      onClose();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setLoading(false);
    }
  };

  const n = selected.length;
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add people"
      scroll={false}
      tall
      footer={<Button title={n === 0 ? 'Add people' : `Add ${n} ${n === 1 ? 'person' : 'people'}`} disabled={n === 0} loading={loading} onPress={save} />}
    >
      <PeoplePicker people={candidates} selected={selected} onChange={setSelected} />
    </BottomSheet>
  );
}

export function SeverityStatusSheet({ complaint, visible, onClose }: { complaint: Complaint; visible: boolean; onClose: () => void }) {
  const me = useMe();
  const toast = useToast();
  const isAdmin = me.role === 'admin';
  const [severity, setSeverity] = useState<Severity | null>(complaint.severity);
  const [status, setStatus] = useState<Status>(complaint.status);
  const [loading, setLoading] = useState(false);

  const allowed = sheetStatusOptions(me, complaint);
  const rows: Status[] = ['open', 'in_progress', 'fixed'];
  const changed = severity !== complaint.severity || status !== complaint.status;

  const save = async () => {
    setLoading(true);
    try {
      if (isAdmin && severity && severity !== complaint.severity) await repo.setSeverity(me.id, complaint.id, severity);
      if (status !== complaint.status) await repo.changeStatus(me.id, complaint.id, status);
      toast('Saved');
      onClose();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isAdmin ? 'Severity and status' : 'Change status'}
      footer={<Button title="Save" onPress={save} disabled={!changed} loading={loading} />}
    >
      {isAdmin ? (
        <View style={{ gap: 8 }}>
          <AppText variant="label" color={colors.textSecondary}>
            Severity
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SEVERITIES.map((s) => (
              <Chip key={s} label={SEVERITY_LABEL[s]} dotColor={severityColors[s]} selected={severity === s} onPress={() => setSeverity(s)} />
            ))}
          </View>
        </View>
      ) : null}
      <View style={{ gap: 8 }}>
        <AppText variant="label" color={colors.textSecondary}>
          Status
        </AppText>
        {rows.map((s) => {
          const current = s === complaint.status;
          const enabled = current || allowed.includes(s);
          return (
            <RadioRow
              key={s}
              label={STATUS_LABEL[s]}
              hint={current ? 'Current status' : enabled ? undefined : 'Not available from here'}
              selected={status === s}
              disabled={!enabled}
              onPress={() => setStatus(s)}
            />
          );
        })}
        <AppText variant="caption" color={colors.textSecondary}>
          {isAdmin
            ? 'To close the complaint use "Resolve now". The complainant confirms a fix themselves.'
            : 'When the work is done, mark it Fixed. The complainant then confirms it.'}
        </AppText>
      </View>
    </BottomSheet>
  );
}
