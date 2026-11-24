# Concepts

## Why shadowing

Many learners can read and write English well but sound unnatural or freeze when speaking. The bottleneck is usually not knowledge but **motor skill**: the mouth, jaw and tongue haven't rehearsed English sound patterns, rhythm and stress enough. The fix is a large volume of spoken repetition of a good model, not more reading.

Shadowing means copying a fluent speaker immediately after them, phrase by phrase. Done repeatedly on the same material, the model's rhythm, stress and sounds become automatic.

## Principles in the app

| Principle | How the app applies it |
| :--- | :--- |
| Listen before speaking | Every script starts with the model voice, stressed words marked |
| Small chunks | Shadowing goes one breath group at a time, with an immediate turn to repeat |
| Same script, many times | Reps, best scores and before/after comparisons reward repetition, not novelty |
| Your own story | Capture turns the learner's real answers into scripts, so practice transfers to real conversations |
| One thing at a time | Each take gets a single focus tip; Progress highlights the weakest accent area |
| Honest measurement | Scores are labelled as AI judgement; text-only grading never claims to hear pronunciation |

## Gemini Live API notes

These rules were learned the hard way while building the live interview (`src/lib/live-session.ts`):

- Live models accept only `responseModalities: ["AUDIO"]`; text comes back through `outputAudioTranscription`. Asking for `["AUDIO","TEXT"]` closes the socket with code 1007.
- Server frames arrive as binary: set `ws.binaryType = "arraybuffer"` and decode before `JSON.parse`.
- Wait for `setupComplete` before streaming microphone audio.
- Microphone audio goes in as 16 kHz 16-bit mono PCM; examiner audio comes back as 24 kHz PCM.
- On `serverContent.interrupted`, stop queued playback straight away so the learner can barge in.
- Tokens from `/api/token` are single-use and locked (`liveConnectConstraints` + `lockAdditionalFields: []`) to the model, voice and examiner prompt built on the server.

## Model choices

| Job | Configured by | Default |
| :--- | :--- | :--- |
| Model voice (shadowing) | `TTS_MODELS` | `gemini-3.8-flash-tts` first |
| Accent coaching, grading, scripts | `TEXT_MODELS` | `gemini-3.5-flash-lite` first |
| Live examiner | `LIVE_MODEL` / Settings at capture time | `gemini-3.1-flash-live-preview` |

All lists are tried in order, so a rate-limited or retired model falls through to the next.
