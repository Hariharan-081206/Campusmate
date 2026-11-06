import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';

import api, { errorMessage, type Exam, type ExamTopic, type Note } from '@/api';
import { DateField, SubjectSelect, TextField, TimeField } from '@/components/fields';
import { FormSheet } from '@/components/form-sheet';
import { Badge, Card, GradientCard, ListRow, Screen, SectionLabel } from '@/components/ui';
import { subjectLabel } from '@/constants';
import { countdown, dayMonth, daysAway } from '@/lib/format';
import { Colors, Font, Radius, Shadow, Spacing, Type } from '@/theme';

type Form = {
  subject: string;
  examName: string;
  date: string;
  startTime: string;
  room: string;
  syllabus: string;
};

const emptyForm = (): Form => ({
  subject: '',
  examName: 'Internal 2',
  date: '',
  startTime: '',
  room: '',
  syllabus: '',
});

export default function Exams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [examRes, noteRes] = await Promise.allSettled([
      api.get<Exam[]>('/exams'),
      api.get<Note[]>('/notes'),
    ]);
    if (examRes.status === 'fulfilled') {
      setExams(
        [...examRes.value.data].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      );
    } else {
      setToast(errorMessage(examRes.reason, 'Could not load exams'));
    }
    // Note counts drive the "{n} notes" badges; a failure just hides them.
    if (noteRes.status === 'fulfilled') setNotes(noteRes.value.data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Past exams drop off; otherwise yesterday's paper stays pinned as "Next up".
  const [next, ...later] = useMemo(() => exams.filter((exam) => daysAway(exam.date) >= 0), [exams]);

  /**
   * Notes worth revising for one topic: same subject, and mentioning one of the
   * topic's significant words. When nothing matches by keyword we fall back to
   * every note in the subject — the badge links to the subject's notes either
   * way, and a count of 0 would just hide a useful shortcut.
   */
  const noteCount = useCallback(
    (exam: Exam, topic: ExamTopic) => {
      const inSubject = notes.filter((note) => note.subject === exam.subject);
      const words = topic.title
        .toLowerCase()
        .split(/[^a-z0-9+]+/)
        .filter((word) => word.length > 3);
      const matches = inSubject.filter((note) => {
        const haystack = `${note.title} ${note.rawText}`.toLowerCase();
        return words.some((word) => haystack.includes(word));
      });
      return (matches.length > 0 ? matches : inSubject).length;
    },
    [notes]
  );

  const toggleTopic = async (exam: Exam, index: number) => {
    const topics = (exam.topics ?? []).map((topic, i) =>
      i === index ? { ...topic, done: !topic.done } : topic
    );
    // Optimistic — the checklist has to feel instant while revising.
    setExams((prev) => prev.map((e) => (e._id === exam._id ? { ...e, topics } : e)));
    try {
      await api.put(`/exams/${exam._id}`, { topics });
    } catch (e) {
      setToast(errorMessage(e, 'Could not update that topic'));
      await load();
    }
  };

  const add = async () => {
    if (!form.subject || !form.date) {
      setError('Pick a subject and a date');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/exams', form);
      setOpen(false);
      setForm(emptyForm());
      await load();
    } catch (e) {
      setError(errorMessage(e, 'Could not save the exam'));
    } finally {
      setSaving(false);
    }
  };

  const topics = useMemo(() => next?.topics ?? [], [next]);

  return (
    <Screen>
      <Text style={Type.screenTitle}>Exam mode</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {!next ? (
          <Text style={[Type.body, styles.empty]}>
            {loading ? '' : 'No exams scheduled — add one with the + button.'}
          </Text>
        ) : (
          <>
            <GradientCard colors={Colors.darkGradient} style={styles.hero}>
              <Text style={styles.heroLabel}>
                Next up · {(next.examName ?? 'Exam').toUpperCase()}
              </Text>
              <Text style={styles.heroSubject}>{subjectLabel(next.subject)}</Text>
              <View style={styles.heroMeta}>
                <Icon name="time-outline" size={14} color={Colors.onDarkFaint} />
                <Text style={styles.heroMetaText}>
                  {countdown(next.date)}
                  {next.room ? ` · ${next.room}` : ''}
                  {next.startTime ? ` · ${next.startTime}` : ''}
                </Text>
              </View>
            </GradientCard>

            <View style={styles.section}>
              <SectionLabel>Revise these</SectionLabel>
              <Card>
                {topics.length === 0 ? (
                  <Text style={Type.body}>
                    No topics listed for this exam yet. List them in the syllabus field,
                    separated by commas.
                  </Text>
                ) : (
                  topics.map((topic, index) => {
                    const count = noteCount(next, topic);
                    return (
                      <View key={topic._id ?? topic.title}>
                        {index > 0 ? <View style={styles.divider} /> : null}
                        <ListRow
                          onPress={() => toggleTopic(next, index)}
                          left={
                            <View style={[styles.checkbox, topic.done && styles.checkboxDone]}>
                              {topic.done ? (
                                <Icon name="checkmark" size={14} color={Colors.onDark} />
                              ) : null}
                            </View>
                          }
                          title={topic.title}
                          strikethrough={topic.done}
                          right={
                            !topic.done && count > 0 ? (
                              <Pressable
                                onPress={() =>
                                  router.push({
                                    pathname: '/(tabs)/notes',
                                    params: { subject: next.subject },
                                  })
                                }
                                hitSlop={8}>
                                <Badge
                                  label={`${count} note${count === 1 ? '' : 's'}`}
                                  variant="count"
                                />
                              </Pressable>
                            ) : null
                          }
                        />
                      </View>
                    );
                  })
                )}
              </Card>
            </View>
          </>
        )}

        {later.length > 0 ? (
          <View style={styles.section}>
            <SectionLabel>Later this month</SectionLabel>
            <Card>
              {later.map((exam, index) => {
                const { day, month } = dayMonth(exam.date);
                return (
                  <View key={exam._id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <ListRow
                      left={
                        <View style={styles.dateChip}>
                          <Text style={styles.dateDay}>{day}</Text>
                          <Text style={styles.dateMonth}>{month}</Text>
                        </View>
                      }
                      title={subjectLabel(exam.subject)}
                      subtitle={[exam.examName, exam.room].filter(Boolean).join(' · ')}
                      right={<Text style={Type.small}>{countdown(exam.date)}</Text>}
                    />
                  </View>
                );
              })}
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <FormSheet
        visible={open}
        title="Add an exam"
        busy={saving}
        error={error}
        onSubmit={add}
        onDismiss={() => setOpen(false)}>
        <SubjectSelect
          label="Subject"
          value={form.subject}
          onChange={(subject) => setForm((prev) => ({ ...prev, subject }))}
        />
        <TextField
          label="Exam"
          value={form.examName}
          onChange={(examName) => setForm((prev) => ({ ...prev, examName }))}
          placeholder="Internal 2"
        />
        <DateField
          label="Date"
          value={form.date}
          onChange={(date) => setForm((prev) => ({ ...prev, date }))}
        />
        <TimeField
          label="Start time"
          value={form.startTime}
          onChange={(startTime) => setForm((prev) => ({ ...prev, startTime }))}
        />
        <TextField
          label="Hall"
          value={form.room}
          onChange={(room) => setForm((prev) => ({ ...prev, room }))}
          placeholder="Hall A"
        />
        <TextField
          label="Syllabus"
          value={form.syllabus}
          onChange={(syllabus) => setForm((prev) => ({ ...prev, syllabus }))}
          placeholder="Normalization, Transactions, Indexing"
          multiline
        />
      </FormSheet>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
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
  body: { paddingTop: Spacing.xl, paddingBottom: 96 },
  empty: { textAlign: 'center', marginTop: Spacing.xxl },

  hero: { paddingVertical: Spacing.xxl },
  heroLabel: {
    fontFamily: Font.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.onDarkMuted,
  },
  heroSubject: {
    fontFamily: Font.bold,
    fontSize: 26,
    color: Colors.onDark,
    marginTop: Spacing.sm,
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.md },
  heroMetaText: { fontFamily: Font.regular, fontSize: 12, color: Colors.onDarkFaint },

  section: { marginTop: Spacing.xxl },
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

  dateChip: {
    width: 46,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.button,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  dateDay: { fontFamily: Font.bold, fontSize: 16, color: Colors.textPrimary },
  dateMonth: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },

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
