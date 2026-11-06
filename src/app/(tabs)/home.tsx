import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';

import api, { errorMessage, type Assignment, type StreakStatus, type TimetableEntry } from '@/api';
import { useAuth } from '@/auth';
import { Badge, Card, GradientCard, ListRow, Screen, SectionLabel } from '@/components/ui';
import { subjectLabel, todayDay } from '@/constants';
import { dueBadge, firstName, isHappeningNow, longDate, partOfDay } from '@/lib/format';
import { Colors, Font, Radius, Spacing, Type } from '@/theme';

export default function Home() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<TimetableEntry[]>([]);
  const [dueSoon, setDueSoon] = useState<Assignment[]>([]);
  const [streak, setStreak] = useState(user?.streakCount ?? 0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    // Each section stands on its own — one failing request shouldn't blank the
    // whole dashboard, so they settle independently.
    const [timetable, assignments, status] = await Promise.allSettled([
      api.get<TimetableEntry[]>('/timetable'),
      api.get<Assignment[]>('/assignments'),
      api.get<StreakStatus>('/streak/status'),
    ]);

    if (timetable.status === 'fulfilled') {
      const today = todayDay();
      setClasses(
        timetable.value.data
          .filter((entry) => entry.day === today)
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
      );
    }
    if (assignments.status === 'fulfilled') {
      setDueSoon(assignments.value.data.filter((item) => !item.completed).slice(0, 4));
    }
    if (status.status === 'fulfilled') setStreak(status.value.data.streakCount);
    // One failure keeps the other sections; all three failing means the server
    // is unreachable, and the empty states would otherwise pass for "no data".
    if (
      timetable.status === 'rejected' &&
      assignments.status === 'rejected' &&
      status.status === 'rejected'
    ) {
      setToast(errorMessage(timetable.reason, 'Could not load your day'));
    }
    setLoading(false);
  }, []);

  // Refetch on focus so a note captured or a task ticked elsewhere shows here.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggle = async (assignment: Assignment) => {
    const completed = !assignment.completed;
    // Optimistic: the row leaves the list immediately, then we reconcile.
    setDueSoon((prev) => prev.filter((item) => item._id !== assignment._id));
    try {
      await api.put(`/assignments/${assignment._id}`, { completed });
    } catch {
      await load();
    }
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />
        }>
        <View style={styles.header}>
          <View>
            <Text style={Type.small}>{longDate()}</Text>
            <Text style={[Type.greeting, styles.greeting]}>
              {partOfDay()}, {firstName(user?.name)} 👋
            </Text>
          </View>
          <Pressable style={styles.bell} hitSlop={8}>
            <Icon name="notifications-outline" size={22} color={Colors.textPrimary} />
          </Pressable>
        </View>

        <GradientCard style={styles.streakCard}>
          <View>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
          <Text style={styles.streakFire}>🔥</Text>
        </GradientCard>

        <Card
          style={styles.scanCard}
          onPress={() => router.push({ pathname: '/(tabs)/notes', params: { scan: Date.now() } })}>
          <View style={styles.scanIcon}>
            <Icon name="scan-outline" size={22} color={Colors.onDark} />
          </View>
          <View style={styles.scanText}>
            <Text style={styles.scanTitle}>Scan a note</Text>
            <Text style={styles.scanSubtitle}>Capture handwriting → get an AI summary</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
        </Card>

        <View style={styles.section}>
          <SectionLabel action="Timetable" onAction={() => router.push('/(tabs)/timetable')}>
            Today&apos;s classes
          </SectionLabel>
          <Card>
            {classes.length === 0 ? (
              <Text style={Type.body}>No classes today. Enjoy the gap.</Text>
            ) : (
              classes.map((entry, index) => (
                <View key={entry._id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <ListRow
                    left={
                      <View style={styles.timeCol}>
                        <Text style={styles.timeText}>{entry.startTime}</Text>
                        {entry.endTime ? (
                          <Text style={Type.small}>{entry.endTime}</Text>
                        ) : null}
                      </View>
                    }
                    title={subjectLabel(entry.subject)}
                    subtitle={entry.room}
                    right={
                      isHappeningNow(entry.startTime, entry.endTime) ? (
                        <Badge label="Now" variant="now" />
                      ) : null
                    }
                  />
                </View>
              ))
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <SectionLabel action="See all" onAction={() => router.push('/assignments')}>
            Due soon
          </SectionLabel>
          <Card>
            {dueSoon.length === 0 ? (
              <Text style={Type.body}>Nothing due. You are all caught up.</Text>
            ) : (
              dueSoon.map((assignment, index) => {
                const badge = dueBadge(assignment.dueDate);
                return (
                  <View key={assignment._id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <ListRow
                      left={
                        <Pressable onPress={() => toggle(assignment)} hitSlop={8}>
                          <View style={styles.checkbox} />
                        </Pressable>
                      }
                      title={assignment.title}
                      subtitle={subjectLabel(assignment.subject)}
                      right={badge ? <Badge label={badge.label} variant={badge.variant} /> : null}
                    />
                  </View>
                );
              })
            )}
          </Card>
        </View>
      </ScrollView>

      <Snackbar visible={!!toast} onDismiss={() => setToast('')} duration={4000}>
        {toast}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: Spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  greeting: { marginTop: Spacing.xs },
  bell: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
  },
  streakNumber: { fontFamily: Font.bold, fontSize: 44, color: Colors.onDark, lineHeight: 50 },
  streakLabel: { fontFamily: Font.medium, fontSize: 14, color: Colors.onDarkSoft },
  streakFire: { fontSize: 40 },

  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark,
    marginTop: Spacing.lg,
  },
  scanIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.button,
    backgroundColor: Colors.onDarkFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: { flex: 1, marginLeft: Spacing.md },
  scanTitle: { fontFamily: Font.semibold, fontSize: 16, color: Colors.onDark },
  scanSubtitle: { fontFamily: Font.regular, fontSize: 12, color: Colors.onDarkMuted, marginTop: 2 },

  section: { marginTop: Spacing.xxl },
  divider: { height: 1, backgroundColor: Colors.border },
  timeCol: { width: 52 },
  timeText: { fontFamily: Font.semibold, fontSize: 14, color: Colors.textPrimary },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
  },
});
