import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalRepository, type KeyValueStore } from './localRepository';
import type { Repository } from './repository';

const asyncStore: KeyValueStore = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};

/** The one repository the app uses. Swap this line for a SupabaseRepository in Stage 2. */
export const repo: Repository = new LocalRepository(asyncStore);

export const SESSION_KEY = 'gia.session.v1';
export const sessionStore = asyncStore;
