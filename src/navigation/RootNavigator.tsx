import Feather from '@expo/vector-icons/Feather';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { AllComplaintsScreen } from '../screens/admin/AllComplaints';
import { BroadcastDetailScreen } from '../screens/admin/BroadcastDetail';
import { ComposeScreen } from '../screens/admin/Compose';
import { DashboardScreen } from '../screens/admin/Dashboard';
import { HotspotDetailScreen } from '../screens/admin/HotspotDetail';
import { HotspotsScreen } from '../screens/admin/Hotspots';
import { SentHistoryScreen } from '../screens/admin/SentHistory';
import { CreateAccountScreen } from '../screens/auth/CreateAccount';
import { LoginScreen } from '../screens/auth/Login';
import { ConfirmFixScreen } from '../screens/member/ConfirmFix';
import { MemberHomeScreen } from '../screens/member/MemberHome';
import { NewComplaintStep1Screen } from '../screens/member/NewComplaintStep1';
import { NewComplaintStep2Screen } from '../screens/member/NewComplaintStep2';
import { SimilarReportsScreen } from '../screens/member/SimilarReports';
import { ModeratorHomeScreen } from '../screens/moderator/ModeratorHome';
import { AlertsScreen } from '../screens/shared/Alerts';
import { ComplaintThreadScreen } from '../screens/shared/ComplaintThread';
import { ProfileScreen } from '../screens/shared/Profile';
import { useAuth } from '../state/AuthContext';
import { DataProvider, useData } from '../state/DataContext';
import { colors, fonts } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary, card: colors.surface, text: colors.textPrimary, border: colors.border },
};

type IconName = ComponentProps<typeof Feather>['name'];
const tabIcon = (name: IconName) =>
  function TabIcon({ color }: { color: string }) {
    return <Feather name={name} size={24} color={color} />;
  };

const tabOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: '#78716C',
  tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 13 },
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: 64, paddingTop: 6 },
  tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.onPrimary, fontFamily: fonts.semibold, fontSize: 13 },
  tabBarAllowFontScaling: false,
} as const;

function NewTabPlaceholder() {
  return <View />;
}

function MemberTabs() {
  const { unreadCount } = useData();
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Home" component={MemberHomeScreen} options={{ tabBarIcon: tabIcon('home') }} />
      <Tab.Screen
        name="New"
        component={NewTabPlaceholder}
        options={{ tabBarIcon: tabIcon('plus-circle'), tabBarAccessibilityLabel: 'Raise a new complaint' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('NewComplaintStep1');
          },
        })}
      />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ tabBarIcon: tabIcon('bell'), tabBarBadge: unreadCount || undefined }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('user') }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const { unreadCount } = useData();
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: tabIcon('grid'), tabBarLabel: 'Home', tabBarAccessibilityLabel: 'Dashboard' }} />
      <Tab.Screen name="Complaints" component={AllComplaintsScreen} options={{ tabBarIcon: tabIcon('list'), tabBarLabel: 'Issues', tabBarAccessibilityLabel: 'All complaints' }} />
      <Tab.Screen name="Hotspots" component={HotspotsScreen} options={{ tabBarIcon: tabIcon('map-pin') }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ tabBarIcon: tabIcon('bell'), tabBarBadge: unreadCount || undefined }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('user') }} />
    </Tab.Navigator>
  );
}

function ModeratorTabs() {
  const { unreadCount } = useData();
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Assigned" component={ModeratorHomeScreen} options={{ tabBarIcon: tabIcon('clipboard') }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ tabBarIcon: tabIcon('bell'), tabBarBadge: unreadCount || undefined }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('user') }} />
    </Tab.Navigator>
  );
}

function SignedInStack() {
  const { user } = useAuth();
  const Tabs = user?.role === 'admin' ? AdminTabs : user?.role === 'moderator' ? ModeratorTabs : MemberTabs;
  return (
    <DataProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="Main" component={Tabs} />
        <Stack.Screen name="NewComplaintStep1" component={NewComplaintStep1Screen} />
        <Stack.Screen name="NewComplaintStep2" component={NewComplaintStep2Screen} />
        <Stack.Screen name="SimilarReports" component={SimilarReportsScreen} />
        <Stack.Screen name="ComplaintThread" component={ComplaintThreadScreen} />
        <Stack.Screen name="ConfirmFix" component={ConfirmFixScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="HotspotDetail" component={HotspotDetailScreen} />
        <Stack.Screen name="Compose" component={ComposeScreen} />
        <Stack.Screen name="SentHistory" component={SentHistoryScreen} />
        <Stack.Screen name="BroadcastDetail" component={BroadcastDetailScreen} />
      </Stack.Navigator>
    </DataProvider>
  );
}

function SignedOutStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer theme={navTheme}>
      {/* Keyed by user so switching accounts starts from a clean stack. */}
      {user ? <SignedInStack key={user.id} /> : <SignedOutStack />}
    </NavigationContainer>
  );
}
