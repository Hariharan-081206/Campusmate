/**
 * The one subject list. SubjectSelect, the Notes filter chips, the timetable,
 * assignments and exams all read from here — a subject is stored as its `code`
 * everywhere in the API (Note.subject, Assignment.subject, Timetable.subject,
 * Exam.subject) and rendered through `subjectLabel`.
 */

export type Subject = {
  code: string;
  label: string;
};

export const SUBJECTS: readonly Subject[] = [
  { code: 'DSA', label: 'Data Structures & Algorithms' },
  { code: 'DBMS', label: 'Database Management' },
  { code: 'OS', label: 'Operating Systems' },
  { code: 'CN', label: 'Computer Networks' },
  { code: 'TOC', label: 'Theory of Computation' },
  { code: 'SE', label: 'Software Engineering' },
] as const;

/** The four chips the Notes screen filters by, after "All". */
export const NOTE_FILTER_SUBJECTS = ['DSA', 'DBMS', 'OS', 'CN'] as const;

/** Falls back to the raw value so notes saved before this list still render. */
export function subjectLabel(code?: string): string {
  if (!code) return '';
  return SUBJECTS.find((s) => s.code === code)?.label ?? code;
}

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** Timetable.day is stored as "Mon"…"Sun"; JS getDay() is Sunday-first. */
const JS_DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const todayDay = (): string => JS_DAY_ORDER[new Date().getDay()];
