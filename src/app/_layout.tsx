import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';

import { AuthProvider } from '@/auth';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const paperTheme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: Colors.primary, background: Colors.background },
};

export default function RootLayout() {
  // Ionicons draws the tab bar and every in-screen glyph; MaterialCommunityIcons
  // is still what react-native-paper reaches for. Neither font is linked
  // natively, so both TTFs are loaded from react-native-vector-icons here —
  // Android/web look them up by file basename, iOS by internal family name.
  // Inter is the app typeface; src/theme.ts names these exact families.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Ionicons: require('react-native-vector-icons/Fonts/Ionicons.ttf'),
    MaterialCommunityIcons: require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
    'Material Design Icons': require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
  });

  // Nothing may render before the fonts land. Android caches every text
  // measurement for the life of the process, so a label first measured in the
  // fallback font keeps that (narrower) box after Inter arrives — which is what
  // clipped "Today's classes" to "TODAY'S" and the tab labels to "Ho…". The
  // native splash stays up meanwhile: AnimatedSplashOverlay only hides it once
  // it mounts.
  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={DefaultTheme}>
          <StatusBar style="dark" />
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
