import * as SQLite from 'expo-sqlite';

import type { TimetableEntry } from '@/api';

/**
 * Offline cache for the timetable: the one screen that has to render when the
 * API is unreachable. See db.web.ts — expo-sqlite's web build pulls in a WASM
 * worker that Metro can't resolve here, so web gets no-ops instead.
 */

type CachedRow = {
  id: string;
  day: string;
  subject: string;
  startTime: string;
  endTime: string | null;
  room: string | null;
};

let dbp: Promise<SQLite.SQLiteDatabase> | null = null;
const getDB = () => {
  if (!dbp) dbp = SQLite.openDatabaseAsync('campusmate.db');
  return dbp;
};

export async function initDB(): Promise<void> {
  const db = await getDB();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS timetable_cache (
      id TEXT PRIMARY KEY, day TEXT, subject TEXT,
      startTime TEXT, endTime TEXT, room TEXT
    );
  `);
}

export async function cacheTimetable(items: TimetableEntry[]): Promise<void> {
  const db = await getDB();
  await db.execAsync('DELETE FROM timetable_cache;');
  for (const item of items) {
    await db.runAsync(
      'INSERT INTO timetable_cache (id,day,subject,startTime,endTime,room) VALUES (?,?,?,?,?,?)',
      item._id,
      item.day,
      item.subject,
      item.startTime,
      item.endTime ?? null,
      item.room ?? null
    );
  }
}

export async function readCachedTimetable(): Promise<TimetableEntry[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<CachedRow>(
    'SELECT * FROM timetable_cache ORDER BY startTime;'
  );
  // Re-key to the server shape so the screen renders cached and live rows identically.
  return rows.map((row) => ({
    _id: row.id,
    day: row.day,
    subject: row.subject,
    startTime: row.startTime,
    endTime: row.endTime ?? undefined,
    room: row.room ?? undefined,
  }));
}
