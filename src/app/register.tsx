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

import { errorMessage } from '@/api';
import { useAuth } from '@/auth';
import { Colors, Font, Radius, Shadow, Spacing, Type } from '@/theme';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onRegister = async () => {
    setBusy(true);
    setError('');
    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(errorMessage(e, 'Registration failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={Type.screenTitle}>Create your account</Text>
        <Text style={[Type.body, styles.subtitle]}>
          One account for your timetable, notes and streaks.
        </Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Arjun V"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>
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
            onPress={onRegister}
            disabled={busy}>
            {busy ? (
              <ActivityIndicator color={Colors.onDark} size="small" />
            ) : (
              <Text style={styles.primaryText}>Sign up</Text>
            )}
          </Pressable>
        </View>

        <Link href="/login" style={styles.link}>
          I already have an account
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  body: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xxl },
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
  pressed: { opacity: 0.8 },
  link: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontFamily: Font.semibold,
    fontSize: 14,
    color: Colors.primary,
  },
});
