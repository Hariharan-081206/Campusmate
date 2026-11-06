import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/auth';
import { Colors } from '@/theme';

/** Auth gate: the persisted session decides whether we land in the app or login. */
export default function Index() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href={user ? '/(tabs)/home' : '/login'} />;
}
