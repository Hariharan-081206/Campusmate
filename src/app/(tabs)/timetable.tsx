import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import api, { errorMessage, type TimetableEntry } from '@/api';
import { SubjectSelect, TextField, TimeField } from '@/components/fields';
import { FormSheet } from '@/components/form-sheet';
import { Badge, Card, Chip, ListRow, Screen, SectionLabel } from '@/components/ui';
import { DAYS, subjectLabel, todayDay } from '@/constants';
import { cacheTimetable, initDB, readCachedTimetable } from '@/db';
import { isHappeningNow } from '@/lib/format';
import { Colors, Font, Radius, Shadow, Spacing, Type } from '@/theme';

type Form = { subject: string; day: string; startTime: string; endTime: string; room: string };

const emptyForm = (): Form => ({
  subject: '',
  day: todayDay(),
  startTime: '',
  endTime: '',
  room: '',
});

export default function Timetable() {
  const [items, setItems] = useState<TimetableEntry[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    await initDB();
    try {
      const { data } = await api.get<TimetableEntry[]>('/timetable');
      setItems(data);
      setOffline(false);
      await cacheTimetable(data); // keep the offline copy fresh
    } catch {
      setItems(await readCachedTimetable()); // fall back to SQLite
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Grouped by weekday, in DAYS order, each day sorted by start time. */
  const byDay = useMemo(
    () =>
      DAYS.map((day) => ({
        day,
        entries: items
          .filter((entry) => entry.day === day)
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      })).filter((group) => group.entries.length > 0),
    [items]
  );

  const add = async () => {
    if (!form.subject || !form.startTime) {
      setError('Pick a subject and a start time');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/timetable', form);
      setOpen(false);
      setForm(emptyForm());
      await load();
    } catch (e) {
      setError(errorMessage(e, 'Could not save the class'));
    } finally {
      setSaving(false);
    }
  };

  const today = todayDay();

  return (
    <Screen>
      <Text style={Type.screenTitle}>Timetable</Text>

      {offline ? (
        <View style={styles.offline}>
          <Icon name="cloud-offline-outline" size={16} color={Colors.warningText} />
          <Text style={styles.offlineText}>Offline — showing your cached timetable</Text>
        </View>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {byDay.length === 0 && !loading ? (
          <Text style={[Type.body, styles.empty]}>No classes yet — add one with the + button.</Text>
        ) : null}

        {byDay.map((group) => (
          <View key={group.day} style={styles.group}>
            <SectionLabel>{group.day === today ? `${group.day} · Today` : group.day}</SectionLabel>
            <Card>
              {group.entries.map((entry, index) => (
                <View key={entry._id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <ListRow
                    left={
                      <View style={styles.timeCol}>
                        <Text style={styles.timeText}>{entry.startTime}</Text>
                        {entry.endTime ? <Text style={Type.small}>{entry.endTime}</Text> : null}
                      </View>
                    }
                    title={subjectLabel(entry.subject)}
                    subtitle={entry.room}
                    right={
                      group.day === today && isHappeningNow(entry.startTime, entry.endTime) ? (
                        <Badge label="Now" variant="now" />
                      ) : null
                    }
                  />
                </View>
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>

      <FormSheet
        visible={open}
        title="Add a class"
        busy={saving}
        error={error}
        onSubmit={add}
        onDismiss={() => setOpen(false)}>
        <SubjectSelect
          label="Subject"
          value={form.subject}
          onChange={(subject) => setForm((prev) => ({ ...prev, subject }))}
        />
        <View style={styles.dayField}>
          <Text style={styles.dayLabel}>Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChips}>
            {DAYS.map((day) => (
              <Chip
                key={day}
                label={day}
                selected={form.day === day}
                onPress={() => setForm((prev) => ({ ...prev, day }))}
              />
            ))}
          </ScrollView>
        </View>
        <TimeField
          label="Start time"
          value={form.startTime}
          onChange={(startTime) => setForm((prev) => ({ ...prev, startTime }))}
        />
        <TimeField
          label="End time"
          value={form.endTime}
          onChange={(endTime) => setForm((prev) => ({ ...prev, endTime }))}
        />
        <TextField
          label="Room"
          value={form.room}
          onChange={(room) => setForm((prev) => ({ ...prev, room }))}
          placeholder="Block A · Lab 3"
        />
      </FormSheet>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => setOpen(true)}>
        <Icon name="add" size={28} color={Colors.onDark} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: Spacing.xl, paddingBottom: 96 },
  group: { marginBottom: Spacing.xl },
  divider: { height: 1, backgroundColor: Colors.border },
  timeCol: { width: 52 },
  timeText: { fontFamily: Font.semibold, fontSize: 14, color: Colors.textPrimary },
  empty: { textAlign: 'center', marginTop: Spacing.xxl },

  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warningSoft,
    borderRadius: Radius.button,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  offlineText: { fontFamily: Font.medium, fontSize: 12, color: Colors.warningText },

  dayField: { gap: Spacing.sm },
  dayLabel: { fontFamily: Font.medium, fontSize: 13, color: Colors.textSecondary },
  dayChips: { gap: Spacing.sm, paddingRight: Spacing.lg },

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
