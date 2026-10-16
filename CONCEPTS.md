# IELTS Vocal Coach — Core Concepts

## 1. The problem we are solving
Many learners can **think** and **write** in English but freeze when **speaking**. The bottleneck is not knowledge — it is
*motor skill*. The mouth, jaw and tongue have not rehearsed English sound patterns enough, and the brain has never had to
produce English in real time under mild pressure. The fix is **volume of spoken output**, not more reading.

## 2. Learning principles baked into the app
| Principle | How the app applies it |
|---|---|
| **Speak first, think later** | Every stage requires the student to talk out loud. There is no typing anywhere. |
| **Warm the muscles before the test** | Each session opens with a read-aloud paragraph packed with tricky sounds, then a *repeat-after-me* drill on the words the student struggled with. |
| **Shadowing** | The tutor models a word or phrase and the student immediately repeats it, copying rhythm and stress. |
| **Low interruption, delayed correction** | During answers the tutor stays quiet. Corrections come *after* a stage, so fluency is never broken mid-sentence. |
| **Real exam pressure** | Parts 1–3 follow the official IELTS format, including a 1-minute prep / 2-minute talk timer for Part 2. |
| **Fresh content every time** | A lesson generator writes a new paragraph, questions and cue card per session, so the student can't memorise answers. |
| **Measurable progress** | A separate scoring model grades the transcript against the 4 public IELTS criteria. |

## 3. Session flow
```
Setup (target band, optional topic)
  → Lesson generated  (text model)
  → Warm-up: read paragraph aloud → feedback → repeat-after-me drill
  → Part 1: 3 short interview questions
  → Part 2: cue card, 1 min prep, up to 2 min talk
  → Part 3: 3 abstract discussion questions
  → Feedback report (text model grades the transcript)
```
The student moves between stages with a **Next** button. The app then sends a hidden `[CUE]` message telling the tutor to
start the next stage, so the UI and the tutor always stay in sync.

## 4. Multi-model architecture (free tier friendly)
| Job | Model | Why |
|---|---|---|
| Generate lesson (JSON) | `gemini-3.5-flash-lite` (fallbacks: `gemini-2.5-flash-lite`, `gemini-2.5-flash`) | Fast, cheap, 500 requests/day on the free tier |
| Live voice examiner | `gemini-3.8-live` | Real-time two-way audio with an unlimited daily quota |
| Score the transcript | `gemini-3.5-flash-lite` (same fallbacks) | Structured JSON grading, 1 call per session |

You can change all model IDs in `src/lib/models.ts` or through env vars.

```
Browser ──POST /api/lesson──▶ Next.js server ──▶ flash-lite   (lesson JSON)
Browser ──POST /api/token───▶ Next.js server ──▶ Gemini auth  (1-use ephemeral token)
Browser ══WebSocket (token)═══════════════════▶ gemini-3.8-live (mic audio ⇄ tutor audio + transcripts)
Browser ──POST /api/feedback▶ Next.js server ──▶ flash-lite   (band scores JSON)
```

## 5. Security
The real `GEMINI_API_KEY` is only stored on the server in `.env.local`. The browser gets a short-lived, single-use
**ephemeral token** for the live session, so the key is never sent to the browser.

## 6. Live API rules we learned the hard way
- `gemini-3.8-live` accepts **only** `responseModalities: ["AUDIO"]`. Asking for `["AUDIO","TEXT"]` makes the server
  close the socket with code **1007**. Text comes back through `outputAudioTranscription`.
- Server frames come in as **binary**, so set `ws.binaryType = "arraybuffer"` and decode them before `JSON.parse`.
- Wait for `setupComplete` before streaming mic audio.
- Mic audio goes in as 16 kHz 16-bit mono PCM. Tutor audio comes back as 24 kHz PCM.
- On `serverContent.interrupted`, stop queued playback straight away so the student can barge in.
