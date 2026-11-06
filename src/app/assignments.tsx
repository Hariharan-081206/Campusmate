import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import api, { errorMessage, type Assignment } from '@/api';
import { DateField, SubjectSelect, TextField } from '@/components/fields';
import { FormSheet } from '@/components/form-sheet';
import { Badge, Card, ListRow, Screen, SectionLabel } from '@/components/ui';
import { subjectLabel } from '@/constants';
import { dueBadge } from '@/lib/format';
import { Colors, Radius, Shadow, Spacing, Type } from '@/theme';

/**
 * Assignments live outside the five-tab bar — Home's "Due soon / See all" link
 * pushes this route. Everything else about the screen is unchanged: list, add,
 * and an optimistic completion toggle.
 */

type Form = { title: string; subject: string; dueDate: string; notes: string };

const emptyForm = (): Form => ({ title: '', subject: '', dueDate: '', notes: '' });

export default function Assignments() {
  // No tab bar under this screen, so the FAB has to clear the gesture bar itself.
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Assignment[]>('/assignments');
      setItems(data);
    } catch (e) {
      setToast(errorMessage(e, 'Could not load tasks'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { open: pending, done } = useMemo(
    () => ({
      open: items.filter((item) => !item.completed),
      done: items.filter((item) => item.completed),
    }),
    [items]
  );

  const add = async () => {
    if (!form.title || !form.dueDate) {
      setError('A title and a due date are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/assignments', form);
      setOpen(false);
      setForm(emptyForm());
      await load();
    } catch (e) {
      setError(errorMessage(e, 'Could not save the task'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (assignment: Assignment) => {
    const completed = !assignment.completed;
    // Flip locally first so the checkbox feels instant, then reconcile.
    setItems((prev) =>
      prev.map((item) => (item._id === assignment._id ? { ...item, completed } : item))
    );
    try {
      await api.put(`/assignments/${assignment._id}`, { completed });
    } catch (e) {
      setToast(errorMessage(e, 'Could not update the task'));
      await load();
    }
  };

  const renderRow = (assignment: Assignment, index: number) => {
    const badge = assignment.completed ? null : dueBadge(assignment.dueDate);
    return (
      <View key={assignment._id}>
        {index > 0 ? <View style={styles.divider} /> : null}
        <ListRow
          onPress={() => toggle(assignment)}
          left={
            <View style={[styles.checkbox, assignment.completed && styles.checkboxDone]}>
              {assignment.completed ? <Icon name="checkmark" size={14} color={Colors.onDark} /> : null}
            </View>
          }
          title={assignment.title}
          subtitle={subjectLabel(assignment.subject)}
          strikethrough={assignment.completed}
          right={badge ? <Badge label={badge.label} variant={badge.variant} /> : null}
        />
      </View>
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={Type.screenTitle}>Assignments</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <View style={styles.section}>
          <SectionLabel>Open</SectionLabel>
          <Card>
            {pending.length === 0 ? (
              <Text style={Type.body}>
                {loading ? 'Loading…' : 'Nothing due. You are all caught up.'}
              </Text>
            ) : (
              pending.map(renderRow)
            )}
          </Card>
        </View>

        {done.length > 0 ? (
          <View style={styles.section}>
            <SectionLabel>Completed</SectionLabel>
            <Card>{done.map(renderRow)}</Card>
          </View>
        ) : null}
      </ScrollView>

      <FormSheet
        visible={open}
        title="Add a task"
        busy={saving}
        error={error}
        onSubmit={add}
        onDismiss={() => setOpen(false)}>
        <TextField
          label="Title"
          value={form.title}
          onChange={(title) => setForm((prev) => ({ ...prev, title }))}
          placeholder="DBMS ER-diagram record"
        />
        <SubjectSelect
          label="Subject"
          value={form.subject}
          onChange={(subject) => setForm((prev) => ({ ...prev, subject }))}
        />
        <DateField
          label="Due date"
          value={form.dueDate}
          onChange={(dueDate) => setForm((prev) => ({ ...prev, dueDate }))}
        />
        <TextField
          label="Notes"
          value={form.notes}
          onChange={(notes) => setForm((prev) => ({ ...prev, notes }))}
          multiline
        />
      </FormSheet>

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: Spacing.xl + insets.bottom },
          pressed && styles.fabPressed,
        ]}
        onPress={() => setOpen(true)}>
        <Icon name="add" size={28} color={Colors.onDark} />
      </Pressable>

      <Snackbar visible={!!toast} onDismiss={() => setToast('')} duration={4000}>
        {toast}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  back: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingTop: Spacing.xl, paddingBottom: 96 },
  section: { marginBottom: Spacing.xxl },
  divider: { height: 1, backgroundColor: Colors.border },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },

  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow,
    elevation: 6,
  },
  fabPressed: { opacity: 0.85 },
});
