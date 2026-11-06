# CampusMate

A study companion for college students. Scan handwritten class notes with your phone camera, get an AI-generated revision summary, and keep your timetable, assignments and exam prep in one place — with a daily study streak to keep you honest.

## Features

- **Scan → summarise.** Photograph (or pick) a page of notes, run on-device OCR with ML Kit, then have Gemini turn it into concise revision bullets. Summaries can be regenerated from the note screen.
- **Home dashboard.** Greeting, study streak, today's classes (with a live *Now* badge) and a "Due soon" list with tick-off checkboxes.
- **Timetable.** Classes grouped by day. Cached in SQLite, so the screen still renders — with an *Offline* banner — when the API is down.
- **Assignments.** Full task list with due-date badges.
- **Exams.** A "Next up" countdown hero, a per-exam "Revise these" topic checklist, and links from each topic into your notes for that subject.
- **Profile.** Stats (notes scanned, AI summaries, study days) and friend streaks.
- **Accounts.** Email + password sign-up and login; the session is kept in the device's secure storage.

## Tech stack

| Layer | Technology |
| --- | --- |
| App | Expo SDK 57 · React Native 0.86 · React 19 · TypeScript (strict) |
| Navigation | expo-router (file-based, `src/app/`) |
| On-device | `@react-native-ml-kit/text-recognition`, expo-image-picker, expo-sqlite, expo-secure-store |
| UI | In-house design system (`src/theme.ts`, `src/components/ui`), Inter font, react-native-paper (snackbars only) |
| API | Express 5 · Mongoose 9 · MongoDB · JWT auth (bcryptjs) |
| AI | Google Gemini REST API, with a model fallback chain |

## Project structure

```
CampusMate/
├── src/
│   ├── app/                     expo-router routes
│   │   ├── _layout.tsx          providers, font gate, splash hand-off
│   │   ├── index.tsx            auth gate → /(tabs)/home or /login
│   │   ├── login.tsx · register.tsx
│   │   ├── (tabs)/              home · timetable · notes · exams · profile
│   │   ├── assignments.tsx      full task list (reached from Home, not a tab)
│   │   └── note/[id].tsx        note detail: scan + digital text / AI summary
│   ├── components/
│   │   ├── ui/index.tsx         Screen, Card, GradientCard, Badge, Chip, ListRow …
│   │   ├── fields.tsx           DateField, TimeField, SubjectSelect, TextField
│   │   ├── form-sheet.tsx       shared "add record" bottom sheet
│   │   └── animated-icon*.tsx   native splash hand-off (no-op on web)
│   ├── lib/format.ts            date / time / countdown helpers
│   ├── api.ts                   axios client + TypeScript mirrors of the models
│   ├── auth.tsx                 AuthProvider / useAuth
│   ├── db.ts · db.web.ts        SQLite timetable cache (web: no-ops)
│   ├── secure-storage.ts        SecureStore wrapper (localStorage on web)
│   ├── constants.ts             the one SUBJECTS list
│   └── theme.ts                 design tokens: colours, spacing, type
├── assets/                      app icons and splash
├── server/                      Express + MongoDB API
│   └── src/
│       ├── server.js            app entry
│       ├── routes/ · controllers/ · models/ · middleware/
│       ├── db.js                Mongo connection
│       └── seed.js              demo-account seeder
└── .env.example                 see also server/.env.example
```

## Getting started

### Prerequisites

- **Node.js** `^20.19.4`, `^22.13` or `^24.3`+ (React Native 0.86's requirement)
- **MongoDB** running locally, or an Atlas connection string
- **A Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey)
- **Android Studio** with an SDK and either an emulator or a USB-debuggable phone, plus `adb` on your `PATH`

> **Expo Go is not supported.** The app uses a native ML Kit module, so it runs as a development build (`npm run android`), not in Expo Go.

### 1. Install

```bash
git clone <your-repo-url>
cd CampusMate
npm install
npm --prefix server install
```

### 2. Configure and start the API

```bash
cp server/.env.example server/.env     # then fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run seed                           # optional: create the demo account
npm run server                         # API on http://localhost:5000
```

Check it is up: `curl http://localhost:5000/health` → `{"ok":true}`.

### 3. Run the app

```bash
npm run android      # first run: compiles and installs the dev client
npm start            # afterwards: just the Metro dev server
```

**Android emulator** — nothing else to do; the app reaches your machine at `http://10.0.2.2:5000`.

**Physical Android phone over USB**

```bash
cp .env.example .env.local     # EXPO_PUBLIC_API_URL=http://localhost:5000
npm run phone                  # adb reverse for Metro (8081) and the API (5000)
npm run android
```

`npm run phone` must be re-run whenever the cable or `adb` restarts — the tunnels drop with it. Over Wi-Fi instead, set `EXPO_PUBLIC_API_URL` to your computer's LAN IP.

> iOS: no `ios/` project is committed. `npm run ios` will generate one with `expo prebuild`; it has not been tested.

### Demo account

After `npm run seed`, sign in with **`demo@campusmate.app`** / **`demo123`** (the login screen also has a demo shortcut). The seed adds 8 classes, 4 notes, 4 assignments, 3 exams and 2 friends, with dates relative to today so nothing is ever in the past. It is safe to re-run: it only deletes and recreates documents owned by the demo account and its friends.

## Configuration

### Server — `server/.env`

| Variable | Required | Description |
| --- | :---: | --- |
| `MONGO_URI` | yes | MongoDB connection string, e.g. `mongodb://127.0.0.1:27017/campusmate` |
| `JWT_SECRET` | yes | Secret for signing 30-day login tokens |
| `GEMINI_API_KEY` | yes | Gemini key used for note summaries |
| `PORT` | no | Defaults to `5000` |
| `GEMINI_MODELS` | no | Comma-separated models tried in order. Default: `gemini-3.6-flash,gemini-3.5-flash,gemini-3.1-flash-lite` |
| `GEMINI_FALLBACK` | no | `1` returns the raw OCR text instead of an error when Gemini fails |

### App — `.env.local`

| Variable | Description |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | API base URL. Defaults to `http://10.0.2.2:5000` on Android and `http://localhost:5000` elsewhere |

Both `.env` and `.env.local` are gitignored; only the `.env.example` files are committed.

## API

All routes except `/auth/*` and `/health` need `Authorization: Bearer <token>`. Every query is scoped to the authenticated user, and errors from the handlers come back as JSON: `{ "msg": "…" }`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Liveness check |
| `POST` | `/auth/register` | `{ name, email, password }` → `{ token, user }` |
| `POST` | `/auth/login` | `{ email, password }` → `{ token, user }` |
| `GET` `POST` | `/timetable` | List / create classes |
| `PUT` `DELETE` | `/timetable/:id` | Update / delete a class |
| `GET` `POST` | `/assignments` | List / create assignments |
| `PUT` `DELETE` | `/assignments/:id` | Update / delete an assignment |
| `GET` `POST` | `/exams` | List / create exams (a comma-separated `syllabus` becomes the topic checklist) |
| `PUT` `DELETE` | `/exams/:id` | Update / delete an exam |
| `GET` | `/notes` | List notes, newest first |
| `POST` | `/notes` | `{ title?, subject?, rawText }` → creates the note and its Gemini summary |
| `GET` `DELETE` | `/notes/:id` | Fetch / delete a note |
| `POST` | `/notes/:id/summarize` | Generate or regenerate the summary |
| `POST` | `/streak/ping` | Record study activity for today |
| `GET` | `/streak/status` | Streak, profile stats and friend streaks |

Summaries take roughly 8–12 s. Gemini answers `503 "high demand"` in bursts, so the server walks the model list twice within a 50 s budget before giving up.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Metro dev server (for the dev client) |
| `npm run android` | Compile and install the Android dev client |
| `npm run ios` | Prebuild and run on iOS (untested) |
| `npm run web` | Web build via `expo start --web` |
| `npm run phone` | `adb reverse` for ports 8081 and 5000 |
| `npm run server` | Start the API |
| `npm run seed` | Rebuild the demo account |
| `npm run lint` | `expo lint` (first run scaffolds an ESLint config) |
| `npx tsc --noEmit` | Typecheck |

Inside `server/`, `npm run dev` runs the API under nodemon. There is no automated test suite yet.

Changing `app.json` plugins or adding a native dependency needs a rebuild (`npm run android`); a Metro reload is not enough. Avoid `expo prebuild --clean` unless you mean to regenerate `android/`.

## Troubleshooting

- **"Can't reach the server at …"** — the API isn't running (`npm run server`), or on a USB phone the `adb reverse` tunnels dropped (`npm run phone`).
- **The app drops to the login screen after `npm run seed`** — expected. The seed recreates the demo user under a new id, which invalidates the old token.
- **AI summary fails** — the error text from Gemini is shown in the app. `503` means overload (retry); `404 "no longer available"` means that model was retired for your key — set `GEMINI_MODELS`. For a live demo, `GEMINI_FALLBACK=1` degrades gracefully.
- **API exits at boot** — check `MONGO_URI` and that MongoDB is running.

## Known limitations

- The streak's day boundary is UTC midnight, not local midnight.
- Scanning (ML Kit) and the offline timetable cache are native-only; the web build stubs the cache and has no OCR.
- No automated tests.

## License

MIT — see [LICENSE](LICENSE).
