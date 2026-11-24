# Accent Shadowing Gym: Project Overview

## Purpose
Help a learner build a British RP accent through **shadowing**: copying a native model voice, phrase by phrase, over many repetitions, until the rhythm, stress and sounds become muscle memory. IELTS Speaking material is the content (scripts come from the learner's own interview answers), but the product is the accent practice.

## Core loop
| Phase | What happens | Code |
| :--- | :--- | :--- |
| Listen | RP model clip (Gemini TTS) at 0.75x / 0.85x / 1.0x; stressed words marked | `MasterMirrorGym.tsx`, `/api/model-audio`, `lib/model-audio.ts` |
| Shadow | Per breath-group: model speaks, learner repeats at once; each repeat is kept in memory for A/B playback | `runShadowLoop` in `MasterMirrorGym.tsx` |
| Deliver | Full take recorded; model clip + learner clip sent to Gemini; accent sub-scores (sounds, stress, rhythm, intonation), mistakes with phonetic tips, one focus tip; rep auto-logged | `/api/mirror-coach` |

## Script capture ("Hot Seat")
A short unscripted Cambridge-style interview with a live Gemini examiner (`lib/live-session.ts`, `/api/token`). The transcript is upgraded by `/api/upgrade-script` into Band 8.5+ scripts (breath chunks `|`, stressed words, collocations) saved to the vault, and `/api/feedback` produces a band report. Starter scripts exist from first launch (`createDefaultMasterRepository`).

## Data (all local, no accounts)
- `vocal_lab_master_script_v2`: scripts, total reps, day streak, per-script stats (`itemStats`: reps, best accent score)
- `vocal_lab_candidate_profile_v1`: learner profile
- `vocal_lab_test_history_v2`: interview history
- IndexedDB `vocal_lab_model_audio_v1`: cached model clips (recordings are never stored)

## Models
Gemini TTS for the model voice (`TTS_MODELS`, `TTS_VOICE`), Gemini Flash for coaching/scripts (`TEXT_MODELS`), Gemini Live for the examiner (`LIVE_MODEL`). See `src/lib/models.ts`. Every route tries models in order; the client falls back to browser speech synthesis if TTS fails.

## Known limits
- Accent scoring is an LLM's listening judgement against the reference clip, not a phoneme-level acoustic analysis. Treat scores as guidance.
- The model voice is a prebuilt Gemini voice prompted for British RP, not a verified RP recording.
- Browser-only storage: clearing site data resets progress and the audio cache.
