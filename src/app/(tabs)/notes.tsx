import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';

import api, { AI_TIMEOUT, errorMessage, type Note } from '@/api';
import { SubjectSelect, TextField } from '@/components/fields';
import { Badge, Card, Chip, Screen } from '@/components/ui';
import { NOTE_FILTER_SUBJECTS } from '@/constants';
import { Colors, Font, Radius, Shadow, Spacing, Type } from '@/theme';

type Draft = { rawText: string; title: string; subject: string };

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState('');

  // The scan pipeline: pick → OCR → review draft → save.
  const [picking, setPicking] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Note[]>('/notes');
      setNotes(data);
    } catch (e) {
      setToast(errorMessage(e, 'Could not load your notes'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Home's "Scan a note" card sends a fresh `scan` value on every press; the
  // ref keeps a re-render from re-opening the picker for one already handled.
  // The exam screen's "{n} notes" badge arrives here with `subject` instead.
  const { scan, subject } = useLocalSearchParams<{ scan?: string; subject?: string }>();
  const handledScan = useRef<string | undefined>(undefined);
  useFocusEffect(
    useCallback(() => {
      if (scan && handledScan.current !== scan) {
        handledScan.current = scan;
        setPicking(true);
      }
      if (subject) {
        setFilter(subject);
        // Consume the param, or every later visit to the tab would re-apply it
        // over whatever chip the student picked since.
        router.setParams({ subject: undefined });
      }
    }, [scan, subject])
  );

  // An exam in a subject without a standing chip (TOC, SE) still gets one, so
  // the active filter is always visible.
  const chips = useMemo(
    () => [
      'All',
      ...NOTE_FILTER_SUBJECTS,
      ...(filter === 'All' || (NOTE_FILTER_SUBJECTS as readonly string[]).includes(filter)
        ? []
        : [filter]),
    ],
    [filter]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (filter !== 'All' && note.subject !== filter) return false;
      if (!needle) return true;
      return (
        note.title.toLowerCase().includes(needle) || note.rawText.toLowerCase().includes(needle)
      );
    });
  }, [notes, query, filter]);

  // Pad an odd count with an empty cell so the last card keeps half width
  // instead of stretching across the whole row.
  const cells = useMemo<(Note | null)[]>(
    () => (visible.length % 2 ? [...visible, null] : visible),
    [visible]
  );

  /** ML Kit runs entirely on device — no network until the note is saved. */
  const runOcr = async (uri: string) => {
    setOcrBusy(true);
    try {
      const result = await TextRecognition.recognize(uri);
      if (!result.text.trim()) {
        setToast('No text found in that image');
        return;
      }
      // Seed the title from the first line, which is usually the heading.
      const firstLine = result.text.trim().split('\n')[0].slice(0, 60);
      setDraft({ rawText: result.text, title: firstLine, subject: '' });
    } catch (e) {
      setToast(errorMessage(e, 'OCR failed'));
    } finally {
      setOcrBusy(false);
    }
  };

  const fromCamera = async () => {
    setPicking(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setToast('Camera permission denied');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 });
    if (!res.canceled) await runOcr(res.assets[0].uri);
  };

  // Emulators ship a fake camera, so the gallery is the reliable demo path.
  const fromGallery = async () => {
    setPicking(false);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
    if (!res.canceled) await runOcr(res.assets[0].uri);
  };

  const saveDraft = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const { data } = await api.post<Note>('/notes', draft, { timeout: AI_TIMEOUT });
      try {
        await api.post('/streak/ping'); // studying today → keep the streak alive
      } catch {
        // A missed ping shouldn't cost the student their summary.
      }
      setDraft(null);
      await load();
      router.push(`/note/${data._id}`);
    } catch (e) {
      setToast(errorMessage(e, 'Could not save the note'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={Type.screenTitle}>Notes</Text>

      <View style={styles.search}>
        <Icon name="search" size={18} color={Colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your notes"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {chips.map((code) => (
          <Chip
            key={code}
            label={code}
            selected={filter === code}
            onPress={() => setFilter(code)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={cells}
        keyExtractor={(note) => note?._id ?? 'spacer'}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          loading ? null : (
            <Text style={[Type.body, styles.empty]}>
              {notes.length === 0
                ? 'No notes yet — tap the scan button to capture one.'
                : 'No notes match that filter.'}
            </Text>
          )
        }
        renderItem={({ item }) =>
          !item ? (
            <View style={styles.spacer} />
          ) : (
          <Card style={styles.noteCard} onPress={() => router.push(`/note/${item._id}`)}>
            <View style={styles.noteHead}>
              {item.subject ? <Badge label={item.subject} variant="count" /> : <View />}
            </View>
            <Text style={[Type.cardTitle, styles.noteTitle]} numberOfLines={3}>
              {item.title}
            </Text>
            <Text style={[Type.small, styles.notePreview]} numberOfLines={2}>
              {item.rawText}
            </Text>
            {item.summary ? (
              <View style={styles.noteFoot}>
                <Badge label="Summary ready" variant="ready" />
              </View>
            ) : null}
          </Card>
          )
        }
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => setPicking(true)}>
        <Icon name="scan-outline" size={26} color={Colors.onDark} />
      </Pressable>

      {/* Source picker — camera or gallery */}
      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={[Type.cardTitle, styles.sheetTitle]}>Scan a note</Text>
            <Pressable style={styles.sourceRow} onPress={fromCamera}>
              <Icon name="camera-outline" size={22} color={Colors.primary} />
              <Text style={styles.sourceText}>Take a photo</Text>
            </Pressable>
            <Pressable style={styles.sourceRow} onPress={fromGallery}>
              <Icon name="images-outline" size={22} color={Colors.primary} />
              <Text style={styles.sourceText}>Choose from gallery</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Draft review — title and subject before the AI summary runs */}
      <Modal visible={!!draft} transparent animationType="slide" onRequestClose={() => setDraft(null)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, styles.draftSheet]}>
            <Text style={[Type.cardTitle, styles.sheetTitle]}>Save this note</Text>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.draftBody}>
              <TextField
                label="Title"
                value={draft?.title ?? ''}
                onChange={(title) => setDraft((prev) => (prev ? { ...prev, title } : prev))}
                placeholder="Binary Search Trees"
              />
              <SubjectSelect
                label="Subject"
                value={draft?.subject ?? ''}
                onChange={(subject) => setDraft((prev) => (prev ? { ...prev, subject } : prev))}
              />
              <Text style={Type.sectionLabel}>Recognised text</Text>
              <View style={styles.ocrBox}>
                <Text style={Type.body}>{draft?.rawText}</Text>
              </View>
            </ScrollView>
            <View style={styles.draftActions}>
              <Pressable style={styles.secondaryBtn} onPress={() => setDraft(null)} disabled={saving}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={saveDraft} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={Colors.onDark} size="small" />
                ) : (
                  <Text style={styles.primaryText}>Save & summarise</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {ocrBusy ? (
        <View style={styles.ocrOverlay}>
          <ActivityIndicator color={Colors.onDark} size="large" />
          <Text style={styles.ocrText}>Reading your handwriting…</Text>
        </View>
      ) : null}

      <Snackbar visible={!!toast} onDismiss={() => setToast('')} duration={4000}>
        {toast}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadow,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontFamily: Font.regular,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  chips: { gap: Spacing.sm, paddingVertical: Spacing.lg, paddingRight: Spacing.lg },

  grid: { paddingBottom: 96 },
  column: { gap: Spacing.md, marginBottom: Spacing.md },
  noteCard: { flex: 1, minHeight: 150 },
  spacer: { flex: 1 },
  noteHead: { flexDirection: 'row', minHeight: 22 },
  noteTitle: { marginTop: Spacing.sm },
  notePreview: { marginTop: Spacing.xs, flex: 1 },
  noteFoot: { marginTop: Spacing.sm },
  empty: { textAlign: 'center', marginTop: Spacing.xxl },

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

  backdrop: { flex: 1, backgroundColor: Colors.backdrop, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    padding: Spacing.xl,
  },
  sheetTitle: { marginBottom: Spacing.md },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  sourceText: { fontFamily: Font.medium, fontSize: 15, color: Colors.textPrimary },

  draftSheet: { maxHeight: '88%' },
  draftBody: { gap: Spacing.lg, paddingBottom: Spacing.lg },
  ocrBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  draftActions: { flexDirection: 'row', gap: Spacing.md },
  primaryBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  primaryText: { fontFamily: Font.semibold, fontSize: 15, color: Colors.onDark },
  secondaryBtn: {
    flex: 1,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  secondaryText: { fontFamily: Font.semibold, fontSize: 15, color: Colors.textSecondary },

  ocrOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  ocrText: { fontFamily: Font.medium, fontSize: 14, color: Colors.onDark },
});
