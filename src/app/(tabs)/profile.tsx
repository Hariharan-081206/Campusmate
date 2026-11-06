import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';

import api, { errorMessage, type StreakStatus } from '@/api';
import { useAuth } from '@/auth';
import { Card, ListRow, Screen, SectionLabel, StatTile } from '@/components/ui';
import { Colors, Font, Radius, Spacing, Type } from '@/theme';

/** Up to two initials — "Hariharan C V" → "HC". */
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/** Stable per-name avatar tint, so a friend keeps the same colour. */
const avatarColor = (name: string) => {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return Colors.avatars[sum % Colors.avatars.length];
};

export default function Profile() {
  const { user, logout } = useAuth();
  // null until /streak/status lands — a live streak of 0 must not fall back.
  const [status, setStatus] = useState<StreakStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<StreakStatus>('/streak/status');
      setStatus(data);
    } catch (e) {
      setToast(errorMessage(e, 'Could not load your streak'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // /streak/status carries the live figures; the persisted user is the fallback
  // when the request has not landed yet.
  const stats = status?.stats ?? user?.stats;
  const streak = status?.streakCount ?? user?.streakCount ?? 0;
  const friends = status?.friends ?? [];
  const name = user?.name ?? '';
  const subtitle = [user?.roll, user?.dept, 'CIT'].filter(Boolean).join(' · ');

  return (
    <Screen>
      <Text style={Type.screenTitle}>Profile</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />
        }>
        <Card style={styles.userCard}>
          <View style={[styles.avatar, { backgroundColor: avatarColor(name) }]}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
          <View style={styles.userText}>
            <Text style={Type.cardTitle}>{name}</Text>
            <Text style={[Type.small, styles.userSubtitle]}>{subtitle}</Text>
          </View>
          <View style={styles.streak}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={styles.streakCount}>{streak}</Text>
          </View>
        </Card>

        <View style={styles.statRow}>
          <StatTile value={stats?.notesScanned ?? 0} label="Notes scanned" />
          <StatTile value={stats?.aiSummaries ?? 0} label="AI summaries" />
          <StatTile value={stats?.studyDays ?? 0} label="Study days" />
        </View>

        <View style={styles.section}>
          <SectionLabel
            action="Add friend"
            onAction={() => setToast('Friend requests are coming soon')}>
            Friend streaks
          </SectionLabel>
          <Card>
            {friends.length === 0 ? (
              <Text style={Type.body}>No friends yet — add one to compare streaks.</Text>
            ) : (
              friends.map((friend, index) => (
                <View key={friend._id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <ListRow
                    left={
                      <View
                        style={[styles.friendAvatar, { backgroundColor: avatarColor(friend.name) }]}>
                        <Text style={styles.friendAvatarText}>{initials(friend.name)}</Text>
                      </View>
                    }
                    title={friend.name}
                    subtitle={friend.subtitle}
                    right={<Text style={styles.friendStreak}>🔥 {friend.streakCount}</Text>}
                  />
                </View>
              ))
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Card>
            <ListRow
              left={<Icon name="person-outline" size={20} color={Colors.textSecondary} />}
              title="Account"
              right={<Icon name="chevron-forward" size={18} color={Colors.textMuted} />}
              onPress={() => setToast('Account settings are coming soon')}
            />
            <View style={styles.divider} />
            <ListRow
              left={<Icon name="notifications-outline" size={20} color={Colors.textSecondary} />}
              title="Notifications"
              right={<Icon name="chevron-forward" size={18} color={Colors.textMuted} />}
              onPress={() => setToast('Notification settings are coming soon')}
            />
            <View style={styles.divider} />
            <ListRow
              left={<Icon name="log-out-outline" size={20} color={Colors.danger} />}
              title="Log out"
              onPress={logout}
              style={styles.logoutRow}
            />
          </Card>
        </View>
      </ScrollView>

      <Snackbar visible={!!toast} onDismiss={() => setToast('')} duration={3000}>
        {toast}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: Spacing.xl, paddingBottom: Spacing.xxl },

  userCard: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Font.bold, fontSize: 18, color: Colors.onDark },
  userText: { flex: 1, marginLeft: Spacing.lg },
  userSubtitle: { marginTop: 2 },
  streak: { alignItems: 'center' },
  streakFire: { fontSize: 18 },
  streakCount: { fontFamily: Font.bold, fontSize: 16, color: Colors.textPrimary },

  statRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },

  section: { marginTop: Spacing.xxl },
  divider: { height: 1, backgroundColor: Colors.border },

  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: { fontFamily: Font.semibold, fontSize: 14, color: Colors.onDark },
  friendStreak: { fontFamily: Font.semibold, fontSize: 14, color: Colors.textPrimary },

  logoutRow: { opacity: 0.95 },
});
