import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { Colors, Font, Radius, Spacing, Type } from '@/theme';

/**
 * The bottom sheet shared by the Timetable, Assignments and Exams add-forms.
 * It owns the chrome only — each screen passes its own DateField/TimeField/
 * SubjectSelect children, since the three forms no longer share a field shape.
 * Replaces the old entity-form-modal, which could only render text inputs.
 */

type Props = {
  visible: boolean;
  title: string;
  children: ReactNode;
  busy?: boolean;
  error?: string;
  submitLabel?: string;
  onSubmit: () => void;
  onDismiss: () => void;
};

export function FormSheet({
  visible,
  title,
  children,
  busy,
  error,
  submitLabel = 'Save',
  onSubmit,
  onDismiss,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={[Type.cardTitle, styles.title]}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {children}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={styles.secondary} onPress={onDismiss} disabled={busy}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primary} onPress={onSubmit} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={Colors.onDark} size="small" />
              ) : (
                <Text style={styles.primaryText}>{submitLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Colors.backdrop, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    padding: Spacing.xl,
    maxHeight: '88%',
  },
  title: { marginBottom: Spacing.lg },
  body: { gap: Spacing.lg, paddingBottom: Spacing.lg },
  error: { fontFamily: Font.medium, fontSize: 13, color: Colors.danger },
  actions: { flexDirection: 'row', gap: Spacing.md },
  primary: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  primaryText: { fontFamily: Font.semibold, fontSize: 15, color: Colors.onDark },
  secondary: {
    flex: 1,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  secondaryText: { fontFamily: Font.semibold, fontSize: 15, color: Colors.textSecondary },
});
