# Architecture

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4, with Google Gemini behind server routes. Local-first: there are no accounts and no database; all learner data lives in the browser.

## Layout

```
src/
  app/                    routes only (thin pages that render a feature screen)
    (main)/               shared shell: nav, theme, error/loading boundaries
      page.tsx            /            Today (first-run welcome, today's script)
      library/            /library     script packs
      practice/[scriptId] /practice/x  Listen -> Shadow -> Deliver -> Feedback
      progress/           /progress    trend, focus area, calendar
      capture/            /capture     live interview; /capture/report
      settings/           /settings    voice, profile, theme, backup/restore/erase
    api/*/route.ts        server routes (see below)
    manifest.ts           PWA manifest
  features/               one folder per feature: screens, hooks, components
    practice/             useModelPlayer, useRecorder, useShadowLoop, useCoach + panels
    capture/              captureReducer, useCaptureSession, gradeCapture + screens
    library/ progress/ settings/ today/ profile/ shell/ shared/
  domain/                 pure logic, no React or DOM; unit-tested
                          contracts (Zod), stats, transcript, attempts, progress,
                          capture (auto-advance, script merge), improvement, json
  storage/                local-first persistence (registry, store, attempts,
                          preferences, capture drafts, backup, wipe)
  server/                 server-only: Gemini client, config/allowlists, guard,
                          errors, lessons (question banks), wav
  ui/                     design-system primitives (Button, Card, Badge, Alert,
                          ScoreBar, Dialog); tokens are in app/globals.css
  lib/                    shared content and older modules (question banks,
                          library scripts, prompts, live session, speech engine)
  components/             live-interview widgets (VoiceOrb, LessonCard,
                          TranscriptFeed, LatencyHUD)
public/sw.js              service worker (offline shell)
```

Rules of thumb: routes stay thin; a feature owns its state in hooks; `domain/` never imports React, the DOM or `server/`; `server/` is never imported by client code (it starts with `import "server-only"`).

## Data (browser only)

Every key is declared in `src/storage/registry.ts`. Values are stored as `{ v, data }` envelopes by `createStore` (`src/storage/store.ts`): older or un-enveloped data is migrated on read, so an app update never wipes anything. Stores are `useSyncExternalStore`-ready, sync across tabs, and report quota errors.

| Key | Contents |
| :--- | :--- |
| `vocal_lab_candidate_profile_v1` | profile (name, work/study, hometown, band) |
| `vocal_lab_master_script_v2` | personal scripts, totals, day streak, per-script stats |
| `vocal_lab_attempts_v1` | scored takes (last 500) for before/after and progress |
| `vocal_lab_test_history_v2` | capture interview band history |
| `vocal_lab_capture_v1` | in-progress interview draft and the pending report |
| `vocal_lab_preferences_v1` | theme, model voice and speed, onboarding flag |
| IndexedDB `vocal_lab_model_audio_v1` | cached model clips (regenerable; not backed up) |

Backup (`storage/backup.ts`) exports every registry key to a JSON file and restores only a fully valid file. Wipe (`storage/wipe.ts`) clears every key and the audio cache.

## API routes

All routes validate input with the shared Zod contracts in `src/domain/contracts.ts` and pass through `server/guard.ts` (same-origin check, body size cap, per-client rate limit). Errors are `{ error: { code, message } }` with safe messages; details go to server logs only.

| Route | Purpose | Model |
| :--- | :--- | :--- |
| `POST /api/model-audio` | Model clip as WAV, read by the coach's Live voice; the reading's transcript must match the script (else retry, then TTS) | `LIVE_RENDER_MODEL`, then `TTS_MODELS` |
| `POST /api/tutor-token` | Single-use Live token for the coach, locked to the coach's voice and a teaching prompt built from the (length-capped) script | Live |
| `POST /api/mirror-coach` | accent coaching from the model clip + learner take | `TEXT_MODELS`, scoring mode |
| `POST /api/lesson` | interview questions (built-in banks, else generated) | `TEXT_MODELS`, creative mode |
| `POST /api/token` | single-use Live token, locked to model, voice and a server-built examiner prompt | Live |
| `POST /api/feedback` | IELTS band report from the transcript | `TEXT_MODELS`, scoring mode |
| `POST /api/upgrade-script` | learner answers -> shadowing scripts (transcript is the only source of facts) | `TEXT_MODELS` |
| `GET /api/ping` | latency probe for the live session | none |

`server/gemini.ts` tries each configured model in order and only moves on for retryable failures (rate limit, server error, unknown model, unparseable output). Scoring uses temperature 0.2; content generation 1.0.

## Personal coach

`lib/tutors.ts` defines the coaches (name, Live voice, style); the chosen coach is a preference, and model clips use the same voice. On the practice page, `features/tutor/useTutor.ts` opens a Live session with a token from `/api/tutor-token`. The prompt (`server/tutor-prompt.ts`) defines the persona and an event protocol: the app sends `[EVENT] start`, `phase listen|shadow|deliver`, `shadow_done`, `result {json}` and `goodbye`, and the learner can talk freely in between. While a model clip plays or the learner records, the page calls `hold()` (mic not sent, coach interrupted) and `release()` afterwards; holds nest. Today's greeting text comes from `domain/greeting.ts` and is read by the coach's voice through `/api/model-audio`. Clips for a script are prefetched in the background when its page opens.

## Live interview

`features/capture/captureReducer.ts` holds all interview state. The `LiveSession` WebSocket (`lib/live-session.ts`) only dispatches actions; effects in `useCaptureSession` react to state to send stage cues, auto-advance (`domain/capture.ts`), keep the clock, save the draft and grade. The token from `/api/token` is locked to the model, voice and an examiner prompt built only from the server's own question banks. (The coach token from `/api/tutor-token` is also locked, but its prompt embeds the learner's script text; that text is length-capped, stripped of control characters and delimited as data, which reduces but does not eliminate prompt-injection risk. Rate limits are the backstop.)

## Security and limits

- The Gemini key never reaches the browser; the Live API uses single-use, constrained tokens.
- Rate limits are in-memory per server instance (`server/guard.ts`, `LIMITS`): fine for one instance; use a shared store if you scale out.
- Headers (`next.config.ts`): `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy, and `Permissions-Policy` allowing the microphone for this site only.

## Tests and CI

`npm run check` runs lint, typecheck and Vitest; `.github/workflows/ci.yml` also builds. Tests cover the domain logic, storage migrations and backup, the guard and allowlists, WAV handling, contracts, the capture reducer, the catalog and progress maths.

## Extending

- **New script pack**: add `ScriptItem`s (validated by `ScriptItemSchema`) and a `Pack` in `features/library/catalog.ts`.
- **New stored data**: add a key to `storage/registry.ts`, create a store with `createStore`, and bump its `version` with a `migrate` step when the shape changes.
- **New API route**: define its schema in `domain/contracts.ts`, add a `LIMITS` entry, and start the handler with `guardJson`.
