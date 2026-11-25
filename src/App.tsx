import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './components/Toast';
import { RootNavigator } from './navigation/RootNavigator';
import { SplashView } from './screens/auth/Splash';
import { AuthProvider, useAuth } from './state/AuthContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_MS = 1200;

function Gate({ fontsReady }: { fontsReady: boolean }) {
  const { ready } = useAuth();
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    if (!fontsReady) return;
    SplashScreen.hideAsync().catch(() => {});
    const t = setTimeout(() => setMinTimeDone(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, [fontsReady]);

  if (!fontsReady) return null;
  if (!ready || !minTimeDone) return <SplashView />;
  return <RootNavigator />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <ToastProvider>
          <Gate fontsReady={fontsLoaded || !!fontError} />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
