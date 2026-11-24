<div align="center">

# Sounds Like You

**Build a British accent by shadowing, with a voice coach who remembers you.**

Listen to a model voice, copy it phrase by phrase, and get specific feedback on your sounds, stress, rhythm and intonation. A few focused minutes a day.

![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=nextdotjs) ![React](https://img.shields.io/badge/React_19-20232a?logo=react&logoColor=61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white) ![Gemini](https://img.shields.io/badge/Gemini_Live-8e75b2?logo=googlegemini&logoColor=white) ![License](https://img.shields.io/badge/license-MIT-green)

</div>

> **Status: early preview.** It works end to end and is ready to try, but it is young. The accent scores are an AI coach's judgement, not a lab measurement. **If you learn English, teach it, or have ever tried to change how you sound, [tell me what you struggle with](#share-feedback).** Your answers decide what gets built next.

---

## Why this exists

Most speaking apps tell you **what** to say. The hard part is sounding natural saying it: the rhythm, the stress, the way sounds link together. Shadowing is the technique interpreters and language teachers use for this: you copy a fluent speaker straight after them, again and again, until your mouth does it without thinking.

Sounds Like You turns that technique into a daily habit, with a coach who guides each step and tells you exactly what to fix next.

## How it works

| | Step | What happens |
| :-: | :-- | :-- |
| 1 | **Listen** | Your coach reads a short script in a British RP accent. Stressed words are marked. |
| 2 | **Shadow** | The model speaks one breath group at a time and you repeat it straight away. |
| 3 | **Deliver** | You say the whole answer. Gemini listens to the **model clip and your take together** and scores your accent on four skills. |
| 4 | **Fix** | You get one specific thing to work on, a before/after against your last take, and your coach explains it out loud. |

## Features

- **A voice coach that knows you.** Pick Olivia, James, Amelia or Harry. They are live Gemini voices who greet you by name, talk you through each step, answer your questions out loud, and remember how last time went: a gap of days, a second lesson today, the thing you were asked to work on. One lesson stays connected across scripts and pages, and resumes after a reload.
- **Accent feedback, not just word accuracy.** Scores for sounds, stress, rhythm and intonation against a British RP model, a single focus tip, and a before/after view. Clearly labelled as AI guidance.
- **A library and your own scripts.** Twelve original, Cambridge-style IELTS Speaking answers, plus a short spoken interview that turns *your own* answers into personal scripts. You choose which to keep, and nothing you already have is replaced.
- **Progress you can see.** Streaks, a score trend, your weakest accent area and a practice calendar.
- **Private by default.** No accounts. Progress lives in your browser. Recordings are never stored; only the audio sent for coaching leaves the device. Back up and restore from Settings.
- **Works on your phone.** Bottom tab bar, a coach bottom sheet, touch-sized controls and a hold-to-talk button. Installable as an app and opens offline.

## Quick start

Requires **Node 20.9+** and a [Gemini API key](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/ehtsmulhq/ielts-vocal-coach.git
cd ielts-vocal-coach
npm install
cp .env.example .env.local   # then set GEMINI_API_KEY
npm run dev
```

Open <http://localhost:3000>, allow the microphone, and **use headphones** so the model voice isn't picked up by your mic.

## Deploy

The app deploys to Vercel with no sign-in, so testers can use it on their phones. Because anyone with the link can use it, it ships with shared rate limits, a daily AI budget and request caps to protect your Gemini bill.

Follow **[docs/DEPLOY.md](docs/DEPLOY.md)** for the step-by-step guide, including the Upstash Redis setup and the Gemini spending cap you should set before sharing the link.

## Configuration

Set these in `.env.local` (or in your Vercel project). See [`.env.example`](.env.example) for everything.

| Variable | Purpose | Default |
| :-- | :-- | :-- |
| `GEMINI_API_KEY` | **Required.** Server-side only, never sent to the browser. | none |
| `TRUST_PROXY` | Set to `1` behind a proxy such as Vercel so visitors are identified correctly for rate limiting. | off |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared rate limits and the daily budget (`KV_REST_API_*` also accepted). Without them, limits are per server instance. | none |
| `DAILY_AI_LIMIT` | Daily cap on the costly AI calls. | `2000` |
| `MODEL_AUDIO_ENGINE` | `live`: the coach's Live voice reads model clips (verified word for word, TTS fallback). `tts`: TTS only, faster. | `live` |
| `TEXT_MODELS` | Coaching, grading and script models, tried in order. | see `.env.example` |
| `TTS_MODELS`, `TTS_VOICE` | Fallback text-to-speech models and voice. | see `.env.example` |
| `LIVE_MODEL`, `LIVE_VOICE` | Live voice model and default voice. | see `.env.example` |
| `ALLOWED_ORIGINS` | Extra origins allowed to call the API. | same-origin only |

## Built with

- **Next.js 16** (App Router) and **React 19**, **TypeScript**, **Tailwind CSS v4**
- **Google Gemini** via `@google/genai`: Live API for the voice coach, multimodal models for accent feedback, TTS for model clips
- **Zod** contracts shared between client and server; **Vitest** for tests
- **Local-first storage** (versioned, migrating) in the browser; **Upstash Redis** for shared rate limits when hosted
- Installable **PWA** with an offline shell

## Project structure

```text
src/
  app/          routes and API handlers (thin)
  features/     practice, tutor (coach), capture, library, progress, settings, today, shell
  domain/       pure logic: scoring, streaks, learner context, contracts (no React)
  server/       Gemini calls, prompts, rate limiting, request guards (server-only)
  storage/      versioned local-first stores, backup, wipe
  ui/           design-system primitives
```

Details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Development

| Command | Description |
| :-- | :-- |
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build and server (enables the service worker) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types, then TypeScript |
| `npm run test` | Unit tests (Vitest) |
| `npm run check` | Lint, typecheck and tests |

## Good to know

- **Scores are guidance.** Accent scoring comes from an AI model comparing two audio clips, so the same take can score a little differently each time. Use it to find what to work on, not as a grade.
- **One accent for now:** British RP.
- **Needs a Gemini key** and a browser with microphone access over HTTPS (or `localhost`). Developed and tested in Chromium-based browsers (Chrome, Brave). Safari, including on iPhone, should work but hasn't been verified yet, so reports are welcome.
- **Occasional busy periods.** Newer Gemini models are sometimes briefly overloaded; the app falls back through several models and asks you to retry if all are busy.

## Share feedback

This is being shaped by the people who use it. If you can spare two minutes, I'd love to hear:

- What have you tried to improve your accent, and where did it fall short?
- What would make you practise **every day** instead of giving up after a week?
- What should a coach say, and what should it never say?

Open an [issue](https://github.com/ehtsmulhq/ielts-vocal-coach/issues) or start a discussion. Teachers and speech coaches: your view on what learners actually struggle with is especially valuable.

## Documentation

- [docs/PRODUCT.md](docs/PRODUCT.md): who it's for, the core loop, screens and principles
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): code layout, data, API, security and how to extend it
- [docs/DEPLOY.md](docs/DEPLOY.md): hosting on Vercel
- [CONCEPTS.md](CONCEPTS.md): the learning method and Gemini Live API notes
- [docs/IELTS_SPEAKING_MASTERY_GUIDE.md](docs/IELTS_SPEAKING_MASTERY_GUIDE.md): IELTS Speaking background

## License

MIT. See [LICENSE](LICENSE).
