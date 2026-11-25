import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { CategoryIcon } from '../../components/ComplaintCard';
import { Screen, ScreenHeader } from '../../components/Layout';
import { StepProgress } from '../../components/StepProgress';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { repo } from '../../data';
import { getCategory } from '../../domain/categories';
import { complaintNo } from '../../domain/labels';
import { LIMITS, validateDescription, validateLocation } from '../../domain/validation';
import type { RootScreenProps } from '../../navigation/types';
import { useMe } from '../../state/AuthContext';
import { errorText } from '../../state/DataContext';
import { colors, layout } from '../../theme';

export function NewComplaintStep2Screen({ navigation, route }: RootScreenProps<'NewComplaintStep2'>) {
  const { category, subCategory } = route.params;
  const me = useMe();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [touched, setTouched] = useState({ location: false, description: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    repo.locationSuggestions().then(setSuggestions);
  }, []);

  const locErr = validateLocation(location);
  const descErr = validateDescription(description);
  const ready = !locErr && !descErr;

  const submit = async () => {
    setTouched({ location: true, description: true });
    if (!ready || loading) return;
    setLoading(true);
    const draft = { category, subCategory, location, description };
    try {
      const similar = await repo.findSimilar(me.id, category, location);
      if (similar.length > 0) {
        setLoading(false);
        navigation.navigate('SimilarReports', { draft });
        return;
      }
      const c = await repo.createComplaint(me.id, draft);
      toast(`Complaint ${complaintNo(c.number)} raised`);
      navigation.reset({ index: 1, routes: [{ name: 'Main' }, { name: 'ComplaintThread', params: { id: c.id } }] });
    } catch (e) {
      toast(errorText(e), 'error');
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="New complaint" back />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <StepProgress step={2} of={2} />
          <View style={styles.picked}>
            <CategoryIcon category={category} size={40} />
            <View style={{ flex: 1 }}>
              <AppText variant="label" color={colors.textSecondary}>
                {getCategory(category).name}
              </AppText>
              <AppText variant="bodyStrong">{subCategory}</AppText>
            </View>
            <Button title="Change" variant="text" compact onPress={() => navigation.goBack()} />
          </View>

          <TextField
            label="Where is the problem?"
            helper="Example, Gate 2 near the water tank"
            value={location}
            onChangeText={setLocation}
            onBlur={() => setTouched((t) => ({ ...t, location: true }))}
            error={touched.location ? locErr : null}
            maxLength={LIMITS.locationMax}
          />
          {suggestions.length > 0 ? (
            <View style={styles.chips}>
              {suggestions.map((s) => (
                <Chip key={s} label={s} icon="map-pin" selected={location.trim().toLowerCase() === s.toLowerCase()} onPress={() => setLocation(s)} />
              ))}
            </View>
          ) : null}

          <TextField
            label="Describe the problem"
            value={description}
            onChangeText={setDescription}
            onBlur={() => setTouched((t) => ({ ...t, description: true }))}
            error={touched.description ? descErr : null}
            multiline
            counter={{ value: description.trim().length, max: LIMITS.descriptionMax }}
            maxLength={LIMITS.descriptionMax + 20}
            placeholder="What did you see? Since when?"
          />
          <View style={styles.note}>
            <Feather name="lock" size={16} color={colors.textSecondary} />
            <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
              Only you, the admin and people added to this complaint can see it.
            </AppText>
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button title="Submit complaint" onPress={submit} disabled={!ready} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 24, gap: 12 },
  picked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -4, marginBottom: 4 },
  note: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
