import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NewComplaintInput } from '../domain/engine';
import type { CategoryId } from '../domain/types';

export type RootStackParamList = {
  Login: undefined;
  CreateAccount: undefined;
  Main: undefined;
  NewComplaintStep1: undefined;
  NewComplaintStep2: { category: CategoryId; subCategory: string };
  SimilarReports: { draft: NewComplaintInput };
  ComplaintThread: { id: string };
  ConfirmFix: { id: string };
  HotspotDetail: { locationKey: string; category: CategoryId | null };
  Compose: undefined;
  SentHistory: undefined;
  BroadcastDetail: { id: string };
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export function useRootNav() {
  return useNavigation<NativeStackNavigationProp<RootStackParamList>>();
}
