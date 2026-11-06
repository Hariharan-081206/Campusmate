import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { SUBJECTS, subjectLabel } from '@/constants';
import { Colors, Font, Radius, Spacing, Type } from '@/theme';

/**
 * Tap-to-pick inputs. Dates, times and subjects are never typed by hand
 * anywhere in the app — Timetable, Assignments, Exams and note creation all go
 * through these three.
 */

// ---------------------------------------------------------------------------
// Shared shell
// ---------------------------------------------------------------------------

type ShellProps = {
  label: string;
  value: string;
  placeholder: string;
  icon: string;
  onPress: () => void;
};

function FieldShell({ label, value, placeholder, icon, onPress }: ShellProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.box, pressed && styles.pressed]}>
        <Text style={value ? styles.value : styles.placeholder}>{value || placeholder}</Text>
        <Icon name={icon} size={18} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Date / time formatting
//
// Deliberately local-time, not toISOString(): the UTC form would roll the date
// back a day for anyone east of UTC after their local evening.
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, '0');

export const toDateString = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const toTimeString = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** "YYYY-MM-DD" → Date, falling back to now for an empty/invalid value. */
const parseDate = (value: string) => {
  const parsed = value ? new Date(`${value}T00:00:00`) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
};

/** "HH:mm" → Date carrying that clock time today. */
const parseTime = (value: string) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  const d = new Date();
  if (match) d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d;
};

// ---------------------------------------------------------------------------
// DateField
// ---------------------------------------------------------------------------

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

/** Stores "YYYY-MM-DD"; displays it in the phone's locale format. */
export function DateField({ label, value, onChange }: FieldProps) {
  const [open, setOpen] = useState(false);

  const handle = (event: DateTimePickerEvent, picked?: Date) => {
    setOpen(false);
    if (event.type === 'set' && picked) onChange(toDateString(picked));
  };

  return (
    <>
      <FieldShell
        label={label}
        value={value ? parseDate(value).toLocaleDateString() : ''}
        placeholder="Pick a date"
        icon="calendar-outline"
        onPress={() => setOpen(true)}
      />
      {open ? (
        <DateTimePicker value={parseDate(value)} mode="date" onChange={handle} />
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// TimeField
// ---------------------------------------------------------------------------

/** Stores "HH:mm" 24-hour, which is what the API sorts on as a string. */
export function TimeField({ label, value, onChange }: FieldProps) {
  const [open, setOpen] = useState(false);

  const handle = (event: DateTimePickerEvent, picked?: Date) => {
    setOpen(false);
    if (event.type === 'set' && picked) onChange(toTimeString(picked));
  };

  return (
    <>
      <FieldShell
        label={label}
        value={value}
        placeholder="Pick a time"
        icon="time-outline"
        onPress={() => setOpen(true)}
      />
      {open ? (
        <DateTimePicker value={parseTime(value)} mode="time" is24Hour onChange={handle} />
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// SubjectSelect
// ---------------------------------------------------------------------------

/** Stores the subject `code`; shows the full label. One list, from constants. */
export function SubjectSelect({ label, value, onChange }: FieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <FieldShell
        label={label}
        value={value ? `${value} · ${subjectLabel(value)}` : ''}
        placeholder="Choose a subject"
        icon="chevron-down"
        onPress={() => setOpen(true)}
      />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={[Type.cardTitle, styles.sheetTitle]}>Subject</Text>
            <ScrollView>
              {SUBJECTS.map((subject) => {
                const active = subject.code === value;
                return (
                  <Pressable
                    key={subject.code}
                    onPress={() => {
                      onChange(subject.code);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                    <View style={styles.optionText}>
                      <Text style={[Type.cardTitle, active && styles.optionActive]}>
                        {subject.code}
                      </Text>
                      <Text style={Type.small}>{subject.label}</Text>
                    </View>
                    {active ? (
                      <Icon name="checkmark-circle" size={20} color={Colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// TextField — the plain sibling, so add-forms look consistent
// ---------------------------------------------------------------------------

type TextFieldProps = FieldProps & { placeholder?: string; multiline?: boolean };

export function TextField({ label, value, onChange, placeholder, multiline }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
        style={[styles.box, styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.sm },
  label: { fontFamily: Font.medium, fontSize: 13, color: Colors.textSecondary },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  input: { fontFamily: Font.regular, fontSize: 14, color: Colors.textPrimary },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  value: { fontFamily: Font.regular, fontSize: 14, color: Colors.textPrimary },
  placeholder: { fontFamily: Font.regular, fontSize: 14, color: Colors.textMuted },
  pressed: { opacity: 0.7 },

  backdrop: { flex: 1, backgroundColor: Colors.backdrop, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    padding: Spacing.xl,
    maxHeight: '70%',
  },
  sheetTitle: { marginBottom: Spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: { gap: 2 },
  optionActive: { color: Colors.primary },
});
