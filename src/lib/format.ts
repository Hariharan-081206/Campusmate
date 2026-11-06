/** Date and label helpers shared by Home, Timetable, Assignments and Exams. */

const MS_DAY = 864e5;

/** "Morning" / "Afternoon" / "Evening", for the Home greeting. */
export function partOfDay(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

/** "Mon, 2 February" — the small date above the Home greeting. */
export function longDate(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

export const firstName = (name?: string): string => (name ?? '').trim().split(/\s+/)[0] ?? '';

/** Whole days from today, negative for the past. Rounds off the clock time. */
export function daysAway(value: string | Date): number {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return NaN;
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOf(target) - startOf(new Date())) / MS_DAY);
}

/** "HH:mm" as minutes past midnight, for the "happening now" comparison. */
function minutes(time?: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time ?? '');
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** True while the wall clock sits inside the class slot. */
export function isHappeningNow(startTime: string, endTime?: string): boolean {
  const start = minutes(startTime);
  if (start === null) return false;
  // A class with no end time is treated as a one-hour slot.
  const end = minutes(endTime) ?? start + 60;
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  return now >= start && now < end;
}

export type DueBadge = { label: string; variant: 'due' | 'now' };

/** The orange Today/Tomorrow/overdue pill on assignment rows. */
export function dueBadge(dueDate: string): DueBadge | null {
  const days = daysAway(dueDate);
  if (Number.isNaN(days)) return null;
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, variant: 'now' };
  if (days === 0) return { label: 'Today', variant: 'now' };
  if (days === 1) return { label: 'Tomorrow', variant: 'due' };
  if (days <= 7) return { label: `${days} days`, variant: 'due' };
  return null;
}

/** "18 Feb"-style chip used on the exam list. */
export function dayMonth(value: string | Date): { day: string; month: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: '--', month: '' };
  return {
    day: String(date.getDate()),
    month: date.toLocaleDateString(undefined, { month: 'short' }),
  };
}

/** "4 days left" / "Today" countdown for exams. */
export function countdown(value: string | Date): string {
  const days = daysAway(value);
  if (Number.isNaN(days)) return 'Date not set';
  if (days < 0) return 'Done';
  if (days === 0) return 'Today';
  return `${days} day${days === 1 ? '' : 's'} left`;
}
