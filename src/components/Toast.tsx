import Feather from '@expo/vector-icons/Feather';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { AppText } from './AppText';

type Kind = 'success' | 'error' | 'info';
interface ToastState {
  id: number;
  text: string;
  kind: Kind;
}

const ToastContext = createContext<(text: string, kind?: Kind) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string, kind: Kind = 'success') => {
    setToast({ id: Date.now(), text, kind });
  }, []);

  useEffect(() => {
    if (!toast) return;
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
    }, 2600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast, opacity]);

  const value = useMemo(() => show, [show]);
  const bg = toast?.kind === 'error' ? colors.danger : toast?.kind === 'info' ? colors.textPrimary : '#166534';
  const icon = toast?.kind === 'error' ? 'alert-circle' : toast?.kind === 'info' ? 'info' : 'check-circle';

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[styles.toast, { bottom: insets.bottom + 88, opacity, backgroundColor: bg }]}
        >
          <Feather name={icon} size={20} color="#fff" />
          <AppText color="#fff" style={{ flex: 1 }} variant="bodyStrong">
            {toast.text}
          </AppText>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
