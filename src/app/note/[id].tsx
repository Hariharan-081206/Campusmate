import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';

import api, { AI_TIMEOUT, errorMessage, type Note } from '@/api';
import { Badge, Card, Screen } from '@/components/ui';
import { subjectLabel } from '@/constants';
import { Colors, Font, Radius, Spacing, Type } from '@/theme';

type Tab = 'text' | 'summary';

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [tab, setTab] = useState<Tab>('text');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Note>(`/notes/${id}`);
      setNote(data);
    } catch (e) {
      setToast(errorMessage(e, 'Could not open that note'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Generate and Regenerate are the same call. The server no longer hides
   * Gemini failures, so `errorMessage` surfaces the real reason here.
   */
  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post<Note>(`/notes/${id}/summarize`, null, {
        timeout: AI_TIMEOUT,
      });
      setNote(data);
      setTab('summary');
    } catch (e) {
      setToast(errorMessage(e, 'Summary failed'));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={[Type.cardTitle, styles.headerTitle]} numberOfLines={1}>
          {note?.title}
        </Text>
        {note?.subject ? <Badge label={note.subject} variant="count" /> : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <Text style={Type.screenTitle}>{note?.title}</Text>
        {note?.subject ? (
          <Text style={[Type.body, styles.subject]}>{subjectLabel(note.subject)}</Text>
        ) : null}

        <Text style={[Type.sectionLabel, styles.sectionSpacing]}>Original scan</Text>
        <Card style={styles.scanCard}>
          {/* The tinted paper + monospace lines read as a photographed page. */}
          <Text style={styles.scanText} numberOfLines={8}>
            {note?.rawText}
          </Text>
        </Card>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'text' && styles.tabActive]}
            onPress={() => setTab('text')}>
            <Text style={[styles.tabText, tab === 'text' && styles.tabTextActive]}>
              Digital text
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'summary' && styles.tabActive]}
            onPress={() => setTab('summary')}>
            <Text style={[styles.tabText, tab === 'summary' && styles.tabTextActive]}>
              AI summary
            </Text>
          </Pressable>
        </View>

        <Card style={styles.contentCard}>
          {tab === 'text' ? (
            <Text style={styles.contentText}>{note?.rawText}</Text>
          ) : generating ? (
            <View style={styles.generating}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={Type.body}>Summarising with Gemini…</Text>
            </View>
          ) : note?.summary ? (
            <>
              <Text style={styles.contentText}>{note.summary}</Text>
              <Pressable style={styles.regenerate} onPress={generate}>
                <Icon name="refresh" size={16} color={Colors.primary} />
                <Text style={styles.regenerateText}>Regenerate</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.emptySummary}>
              <Text style={Type.body}>No summary yet for this note.</Text>
              <Pressable style={styles.primaryBtn} onPress={generate}>
                <Icon name="sparkles-outline" size={16} color={Colors.onDark} />
                <Text style={styles.primaryText}>Generate summary</Text>
              </Pressable>
            </View>
          )}
        </Card>
      </ScrollView>

      <Snackbar visible={!!toast} onDismiss={() => setToast('')} duration={6000}>
        {toast}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: Spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1 },
  body: { paddingBottom: Spacing.xxl },
  subject: { marginTop: Spacing.xs },
  sectionSpacing: { marginTop: Spacing.xl, marginBottom: Spacing.md },

  scanCard: { backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.paperBorder },
  scanText: {
    fontFamily: Font.regular,
    fontSize: 13,
    lineHeight: 22,
    color: Colors.paperInk,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.button,
    padding: Spacing.xs,
    marginTop: Spacing.xl,
  },
  tab: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.button - 4, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontFamily: Font.medium, fontSize: 14, color: Colors.textSecondary },
  tabTextActive: { color: Colors.onDark, fontFamily: Font.semibold },

  contentCard: { marginTop: Spacing.md },
  contentText: {
    fontFamily: Font.regular,
    fontSize: 14,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  generating: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  emptySummary: { alignItems: 'flex-start', gap: Spacing.lg },
  regenerate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    alignSelf: 'flex-start',
  },
  regenerateText: { fontFamily: Font.semibold, fontSize: 14, color: Colors.primary },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  primaryText: { fontFamily: Font.semibold, fontSize: 14, color: Colors.onDark },
});
