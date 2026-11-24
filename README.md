# Accent Shadowing Gym

> Build a British RP accent through **shadowing**: listen to a model voice, copy it phrase by phrase, and repeat until the accent lives in your muscle memory.

## The idea

Shadowing is how people absorb an accent: you copy the rhythm, stress and sounds of a fluent voice, again and again, until your mouth does it without thinking. This app is a gym for that.

1. **Listen**: hear a British RP model (Gemini TTS) read a script, with stressed words marked.
2. **Shadow**: the model speaks one breath group at a time and you repeat it straight away. Each repeat is kept in memory so you can play it back against the model.
3. **Deliver**: say the whole answer. Gemini listens to the **model clip and your take together** and scores your accent (sounds, stress, rhythm, intonation), with one thing to fix on the next rep and a before/after against your last take.

Progress (streak, score trend, weakest accent area, practice calendar) is tracked in your browser. Nothing leaves it except the audio sent for coaching, and recordings are never stored. Settings lets you download a backup and restore it on another device. The app is installable (PWA) and opens offline.

### Where the scripts come from

- **IELTS Speaking library**: 12 original, Cambridge-style model answers for Parts 1, 2 and 3, written for this app (`src/lib/shadowing-library.ts`).
- **Your own scripts**: a short spoken interview with a live Gemini examiner. Your answers are rewritten into natural, high-band spoken English, using only what you actually said; you choose which to keep and nothing you already have is replaced. An unfinished interview is saved so you can still get a report from it. The interview also produces an IELTS band report (graded from the transcript, so its pronunciation score is an estimate; audio-based accent feedback is what practice is for).

## Getting started

Requires Node 20+ and a [Gemini API key](https://aistudio.google.com/apikey).

```bash
npm install
cp .env.example .env.local   # then set GEMINI_API_KEY
npm run dev
```

Open http://localhost:3000 in a normal browser window, allow the microphone, and use headphones so the model's voice isn't picked up by your mic.

### Configuration (`.env.local`)

| Variable | Purpose | Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Required, server-side only | none |
| `TTS_MODELS` | Model-voice models, tried in order | `gemini-3.8-flash-tts,gemini-3.1-flash-tts-preview,gemini-3.8-flash-lite-tts` |
| `TTS_VOICE` | Default prebuilt voice for the model clip (learners can change it in Settings) | `Puck` |
| `LIVE_MODEL`, `LIVE_VOICE` | Live examiner model and voice | see `.env.example` |
| `TEXT_MODELS` | Coaching, grading and script models, tried in order | see `.env.example` |
| `ALLOWED_ORIGINS` | Extra origins allowed to call the API | none (same-origin only) |

If Gemini TTS is unavailable the app falls back to the browser's speech voice and says so; that voice may not be British.

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build (enables the service worker) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types, then TypeScript |
| `npm run test` | Unit tests (Vitest) |
| `npm run check` | Lint, typecheck and tests (CI also runs the build) |

## Documentation

- [docs/PRODUCT.md](docs/PRODUCT.md): who it's for, the core loop, screens and principles
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): code layout, data, API, security and how to extend it
- [CONCEPTS.md](CONCEPTS.md): the learning method and Gemini Live API notes
- [docs/IELTS_SPEAKING_MASTERY_GUIDE.md](docs/IELTS_SPEAKING_MASTERY_GUIDE.md): IELTS Speaking background

## License

MIT, see [LICENSE](LICENSE).
