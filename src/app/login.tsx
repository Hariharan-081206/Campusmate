import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { errorMessage } from '@/api';
import { useAuth } from '@/auth';
import { Colors, Font, Radius, Shadow, Spacing, Type } from '@/theme';

/** Seeded by `npm run seed` in server/ — see server/src/seed.js. */
const DEMO = { email: 'demo@campusmate.app', password: 'demo123' };

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const signIn = async (withEmail: string, withPassword: string) => {
    setBusy(true);
    setError('');
    try {
      await login(withEmail.trim(), withPassword);
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(errorMessage(e, 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={[...Colors.primaryGradient] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}>
          <Icon name="school" size={30} color={Colors.onDark} />
        </LinearGradient>

        <Text style={Type.screenTitle}>CampusMate</Text>
        <Text style={[Type.body, styles.subtitle]}>
          Your timetable, notes and streaks in one place.
        </Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@college.edu"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            onPress={() => signIn(email, password)}
            disabled={busy}>
            {busy ? (
              <ActivityIndicator color={Colors.onDark} size="small" />
            ) : (
              <Text style={styles.primaryText}>Log in</Text>
            )}
          </Pressable>

          {/* One-tap path into the seeded account, for demoing the app. */}
          <Pressable
            style={({ pressed }) => [styles.demo, pressed && styles.pressed]}
            onPress={() => signIn(DEMO.email, DEMO.password)}
            disabled={busy}>
            <Icon name="flash-outline" size={16} color={Colors.primary} />
            <Text style={styles.demoText}>Use demo account</Text>
          </Pressable>
        </View>

        <Link href="/register" style={styles.link}>
          Create an account
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  body: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xxl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  subtitle: { marginTop: Spacing.sm },

  form: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginTop: Spacing.xxl,
    gap: Spacing.lg,
    ...Shadow,
  },
  field: { gap: Spacing.sm },
  label: { fontFamily: Font.medium, fontSize: 13, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 48,
    fontFamily: Font.regular,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  error: { fontFamily: Font.medium, fontSize: 13, color: Colors.danger },

  primary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  primaryText: { fontFamily: Font.semibold, fontSize: 15, color: Colors.onDark },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  demoText: { fontFamily: Font.semibold, fontSize: 14, color: Colors.primary },
  pressed: { opacity: 0.8 },

  link: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontFamily: Font.semibold,
    fontSize: 14,
    color: Colors.primary,
  },
});
