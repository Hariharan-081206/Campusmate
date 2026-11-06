import type { TimetableEntry } from '@/api';

/**
 * Web stub for the timetable cache. expo-sqlite's web implementation imports a
 * `.wasm` worker that Metro can't resolve without extra assetExts/COOP-COEP
 * setup, and the offline story only has to hold on the Android build — so the
 * web bundle keeps the API surface and skips the database entirely.
 */
export async function initDB(): Promise<void> {}

export async function cacheTimetable(_items: TimetableEntry[]): Promise<void> {}

export async function readCachedTimetable(): Promise<TimetableEntry[]> {
  return [];
}
