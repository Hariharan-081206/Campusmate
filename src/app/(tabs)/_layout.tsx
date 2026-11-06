import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAuth } from '@/auth';
import { Colors, Font } from '@/theme';

/** The five tabs from the mockup, in order. */
const TABS = [
  { name: 'home', title: 'Home', icon: 'home' },
  { name: 'timetable', title: 'Timetable', icon: 'calendar' },
  { name: 'notes', title: 'Notes', icon: 'document-text' },
  { name: 'exams', title: 'Exams', icon: 'school' },
  { name: 'profile', title: 'Profile', icon: 'person' },
] as const;

export default function TabsLayout() {
  const { user, ready } = useAuth();
  // Android draws edge-to-edge, so the bar has to clear the gesture handle /
  // nav buttons itself — a fixed height let the handle sit on the labels.
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }
  // Also covers logging out from the Profile tab: clearing the user pops us here.
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 56 + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
        },
        tabBarLabelStyle: { fontFamily: Font.medium, fontSize: 11 },
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size, focused }) => (
              <Icon name={focused ? tab.icon : `${tab.icon}-outline`} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
