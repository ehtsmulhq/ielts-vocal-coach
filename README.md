# Accent Shadowing Gym

> Build a British RP accent through **shadowing**: listen to a native model, copy it phrase by phrase, and repeat until the accent lives in your muscle memory.

## The idea

Shadowing is how people absorb an accent: you copy the rhythm, stress and sounds of a master voice, repeatedly, until your mouth does it without thinking. This app is a gym for that.

1. **Listen**: hear a British RP model (Gemini TTS) read a script, with stressed words marked.
2. **Shadow**: the model speaks one breath-group at a time and you repeat it straight away. Each of your repeats is kept in memory so you can play it back against the model.
3. **Deliver**: say the whole answer yourself. Gemini listens to the **model clip and your take together** and scores your accent (sounds, stress, rhythm, intonation), plus one thing to fix on the next rep.

Reps, per-script best scores and a daily streak are tracked locally. Nothing leaves your browser except the audio sent for coaching, and no recordings are stored.

### Where the scripts come from

The **Cambridge-style library** has 12 original model answers (Parts 1, 2 and 3) on themes that recur in Cambridge IELTS Speaking tests: food, technology, weather, hobbies, buildings, advice, quiet places, health habits, heritage, AI, the environment and the arts. They are written for this app, not copied from any book (`src/lib/shadowing-library.ts`). The gym also ships with starter scripts built from your profile. For scripts about **your** life, use **Capture new scripts**: a short unscripted Cambridge-style interview (Parts 1-3) with a live Gemini examiner. Your answers are upgraded into Band 8.5+ spoken English (with breath marks `|`, stressed words and collocations) and become your shadowing scripts. The interview also produces an IELTS band report.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- `@google/genai`: Gemini Live (examiner), Gemini TTS (RP model audio), Gemini Flash (scripts, coaching)
- Browser: Web Audio, MediaRecorder, Web Speech API (optional live transcript), `localStorage` + IndexedDB (audio cache)

```
Browser ── /api/model-audio ──▶ Gemini TTS  (British RP WAV, cached in IndexedDB)
        ── /api/mirror-coach ─▶ Gemini      (model clip + your take -> accent scores, fixes)
        ── /api/upgrade-script ▶ Gemini     (interview transcript -> Band 8.5+ scripts)
        ── /api/token ────────▶ Gemini      (single-use token for the live examiner)
        ── /api/feedback ─────▶ Gemini      (IELTS band report)
```

## Getting started

Requires Node 20+ and a [Gemini API key](https://aistudio.google.com/apikey).

```bash
npm install
cp .env.example .env.local   # then set GEMINI_API_KEY
npm run dev
```

Open http://localhost:3000 and allow microphone access. Use headphones so the model's voice isn't picked up by your mic.

### Configuration (`.env.local`)

| Variable | Purpose | Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Required, server-side only | none |
| `TTS_MODELS` | RP model-audio models, tried in order | `gemini-3.8-flash-tts,gemini-3.1-flash-tts-preview,gemini-3.8-flash-lite-tts` |
| `TTS_VOICE` | Prebuilt voice for the model clip | `Puck` |
| `LIVE_MODEL`, `LIVE_VOICE` | Live examiner model and voice | see `.env.example` |
| `TEXT_MODELS` | Text/coaching models, tried in order | see `.env.example` |

If Gemini TTS is unavailable the gym falls back to your browser's speech voice and shows a notice. That voice may not be British RP.

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Development server |
| `npm run build` | Production build and type check |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Project layout

- `src/components/MasterMirrorGym.tsx`: Listen / Shadow / Deliver gym
- `src/app/api/model-audio`, `mirror-coach`, `upgrade-script`, `token`, `feedback`: server routes
- `src/lib/model-audio.ts`: RP clip fetch + IndexedDB cache
- `src/lib/master-script.ts`: script vault, per-script stats, day streak (`localStorage`)
- `src/app/page.tsx`: app shell; `SetupCard` and `CandidateGrillModal` handle script capture

More detail: [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md), [CONCEPTS.md](CONCEPTS.md), [docs/](docs).

## License

MIT, see [LICENSE](LICENSE).
