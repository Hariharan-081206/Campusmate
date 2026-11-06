import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

import { getItem } from '@/secure-storage';

/**
 * Android emulator reaches the host laptop through 10.0.2.2. A physical device
 * needs the machine's LAN IP instead — set EXPO_PUBLIC_API_URL in .env rather
 * than editing this file.
 */
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Platform.select({ android: 'http://10.0.2.2:5000', default: 'http://localhost:5000' });

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * A 401 on anything but /auth means the stored token is dead — expired, signed
 * with an old JWT_SECRET, or its user was wiped by `npm run seed`. AuthProvider
 * registers logout here so the app returns to the login screen instead of
 * staying "signed in" while every request fails.
 */
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(undefined, (error: AxiosError) => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
    onUnauthorized?.();
  }
  return Promise.reject(error);
});

/**
 * Gemini routinely takes 8–12s to summarise a page of notes, which overruns the
 * default timeout above. Anything that waits on the model uses this instead.
 */
export const AI_TIMEOUT = 60000;

/** The API error handler in server.js always replies with `{ msg }`. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const axiosError = error as AxiosError<{ msg?: string }>;
  const msg = axiosError?.response?.data?.msg;
  if (msg) return msg;
  // No response at all: the server is down or the phone can't route to it.
  // axios only says "Network Error", which hides which of the two it is.
  if (axiosError?.isAxiosError && !axiosError.response) {
    return axiosError.code === 'ECONNABORTED'
      ? 'The server took too long to answer — try again'
      : `Can't reach the server at ${BASE_URL}`;
  }
  return error instanceof Error ? error.message : fallback;
}

export default api;

// ---------------------------------------------------------------------------
// Shapes returned by server/src/models — kept here so screens stay typed.
// ---------------------------------------------------------------------------

export type UserStats = {
  notesScanned: number;
  aiSummaries: number;
  studyDays: number;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  roll?: string;
  dept?: string;
  streakCount: number;
  stats?: UserStats;
};

export type TimetableEntry = {
  _id: string;
  day: string;
  /** A SUBJECTS code — see src/constants.ts. */
  subject: string;
  startTime: string;
  endTime?: string;
  room?: string;
};

export type Assignment = {
  _id: string;
  title: string;
  subject?: string;
  dueDate: string;
  completed: boolean;
  notes?: string;
};

export type ExamTopic = {
  _id: string;
  title: string;
  done: boolean;
};

export type Exam = {
  _id: string;
  subject: string;
  /** "Internal 2" — shown above the subject on the hero card. */
  examName?: string;
  date: string;
  startTime?: string;
  room?: string;
  syllabus?: string;
  topics?: ExamTopic[];
};

export type Note = {
  _id: string;
  title: string;
  subject?: string;
  rawText: string;
  summary: string;
  createdAt: string;
};

export type StreakStatus = {
  streakCount: number;
  lastActiveDate: string | null;
  stats?: UserStats;
  friends: { _id: string; name: string; streakCount: number; subtitle?: string }[];
};
