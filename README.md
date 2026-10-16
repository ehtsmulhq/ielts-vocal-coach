# English Phonetics & Vocal Laboratory

> **Academic Vocal Articulation, Sight-Reading Stamina, and Spoken English Telemetry Studio**  
> *Inspired by the hands-free voice tracking of Tarteel • Powered by Google Gemini Live Multimodal Audio*

---

## 📌 Overview

The **English Phonetics & Vocal Laboratory** is a real-time, hands-free conversational speaking gym designed to overcome speech hesitation, vocal freezing, and articulatory inaccuracies.

Instead of passive language quizzes or silent voice recorders, this platform provides an **interactive, voice-driven physical workout studio**. It pairs sub-second bidirectional AI voice streaming with a real-time sight-reading teleprompter, WPM cadence tracking, and research-grade acoustic oscilloscope telemetry.

---

## 💡 The Core Inspiration: The Tarteel Paradigm

The architectural concept was sparked by **Tarteel AI**, the Quran companion app famous for its acoustic voice tracking:
- **Zero-Touch Interaction:** No buttons to press while speaking; your voice drives the entire interface.
- **Real-Time Word Following:** Text highlights synchronously as each syllable is pronounced.
- **Immediate Acoustic Feedback:** Catches hesitations and pronunciation slips in the moment.

This laboratory brings that exact hands-free, cadence-tracking experience to spoken English and IELTS exam preparation.

---

## ✨ Key Features

### 1. The 4-Stage Laboratory Protocol
- **Protocol 01 — Motor Articulation Drills:** Targets challenging English phonemes (`/θ/`, `/ð/`, `/v/` vs `/w/`, terminal clusters `-sts`, `-dth`) with biomechanical jaw and lip placement cues.
- **Protocol 02 — Academic Sight-Reading & WPM Cadence:** 150–220 word editorial passages with a synchronous teleprompter, real-time Words-Per-Minute (WPM) cadence counter, rhythmic thought-chunk breath markers (`|`), and IPA phonetic cards.
- **Protocol 03 — Speech Reflex Velocity Drills:** Tongue-twister agility drills structured with a 3-repetition velocity ramp (*Slow Exaggerated* → *Conversational* → *Maximum Pace*).
- **Protocol 04 — IELTS Speaking Exam Capstone:** Full simulation of the IELTS interview format:
  - **Part 1:** Interactive introductory questions.
  - **Part 2:** Long-turn cue card with dedicated 1-minute preparation and 2-minute speaking stopwatches.
  - **Part 3:** Two-way abstract analytical discussion.

### 2. Dual-Trace Acoustic Oscilloscope & Spectrum Monitor
- **Channel 1 (Candidate):** Real-time RMS microphone amplitude waveform with dBFS metering.
- **Channel 2 (Examiner):** 32-band spectral formant bar visualization of incoming audio response.
- Integrated controls for **Continuous Mic**, **Push-to-Talk** (`Spacebar` hotkey), and **Speech Protection** (anti-barge-in vs. live interruption).

### 3. Live System Telemetry HUD
- Real-time network round-trip time (**RTT**), model time-to-first-byte (**TTFB**), buffer starvation / packet loss detection, and audio stream health diagnostics.

### 4. Official Diagnostic Evaluation Report
- Comprehensive band evaluation across the 4 official IELTS assessment criteria:
  - *Pronunciation & Articulation*
  - *Fluency & Cadence Coherence*
  - *Lexical Range & Precision*
  - *Grammatical Accuracy*
- Biomechanical observations (jaw/lip tension, breath phrasing, consonant clarity).
- Prescriptive 5-minute daily vocal routine for continued practice.

---

## 🛠️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────┐
│                    Browser Client (React 19)               │
│  Dual-Trace Oscilloscope • Teleprompter • AudioWorklet PCM │
└─────────────┬───────────────────────────────▲──────────────┘
              │ WebSocket (Binary PCM)        │ Ephemeral Token
              ▼                               ▼
┌───────────────────────────┐    ┌───────────────────────────┐
│  Gemini Live Audio API    │    │   Next.js 16 API Server   │
│  (Bidirectional Streaming)│    │   Token • Lesson • Report │
└───────────────────────────┘    └───────────────────────────┘
```

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack) & [React 19](https://react.dev/)
- **Styling & Fonts:** [Tailwind CSS v4](https://tailwindcss.com/), `Lora` (Academic Serif), `Geist Mono` (Instrumentation)
- **Live Voice Engine:** Google Gemini Live Multimodal WebSocket API (`gemini-3.1-flash-live-preview` / `gemini-2.5-flash-native-audio-latest`)
- **Text & Scoring Models:** Google Gemini Flash (`gemini-3.5-flash-lite`, `gemini-2.5-flash`)
- **Digital Signal Processing (DSP):** Web Audio API (`AudioContext`, `AudioWorkletNode`, `AnalyserNode`)

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18.18+ or v20+
- A Google Gemini API Key ([Get one free from Google AI Studio](https://aistudio.google.com/apikey))

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ielts-coach.git
cd ielts-coach
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env.local
```

Open `.env.local` and insert your Gemini API Key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

*(Optional model overrides such as `LIVE_MODEL`, `LIVE_VOICE`, and `TEXT_MODELS` can also be specified in `.env.local`).*

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Grant microphone access when prompted.

---

## 📋 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server with Turbopack. |
| `npm run build` | Compiles optimized production bundle and runs TypeScript checks. |
| `npm run start` | Boots production server. |
| `npm run lint` | Runs ESLint to verify code quality. |

---

## 🔒 Security & Privacy

- **Protected API Keys:** The master `GEMINI_API_KEY` is kept securely on the Next.js server. The client browser only receives short-lived, single-use ephemeral tokens via `/api/token`.
- **Zero Local Recording Storage:** Candidate microphone streams are processed purely in-memory via ephemeral PCM Web Audio buffers and are not recorded or persisted to disk.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
