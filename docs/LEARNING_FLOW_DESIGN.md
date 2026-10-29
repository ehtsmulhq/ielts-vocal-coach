# The Learning Flow & Interaction Design Blueprint
## English Phonetics & Vocal Laboratory — Human-AI Pedagogical Flow

> **The Core Design Challenge:**  
> Developing the technical code (WebSockets, Next.js, Web Audio) is straightforward. The complex challenge is **orchestrating the user's attention, vocal muscles, and cognitive load** across screen states so practice feels natural, motivating, and confidence-building—never clumsy or robotic.

---

## 1. The High-Level Architecture of a 15-Minute Session

A successful session follows a clinical **Cognitive & Motor Ramp**:

```mermaid
journey
    title 15-Minute Daily Spoken Workout Journey
    section Phase 0: Setup
      Profile Check & Domain Selection: 5: Candidate
    section Phase 1: Priming
      Call & Response Chunks: 7: Candidate, AI Coach
    section Phase 2: Shadowing
      Tarteel Teleprompter Model Answer: 8: Candidate, AI Coach
    section Phase 3: Reflex Sprint
      Zero-Hesitation 1.5s Rapid Fire: 9: Candidate, AI Coach
    section Phase 4: Capstone
      Unseen Part 2/3 Exam Simulation: 8: Candidate, AI Coach
    section Phase 5: Feedback
      Diagnostic Report & Next Prescription: 9: Candidate
```

---

## 2. Screen-by-Screen Detailed Interaction Flow

---

### PHASE 0: The Local Profile Anchor (First 60 Seconds or Auto-Loaded)

#### What the User Experiences:
- If first time: A clean, minimalist 4-question profile card appears.
- If returning: Automatically loaded from `localStorage`. One click: **[ INITIALIZE WORKOUT ]**.

```
┌────────────────────────────────────────────────────────────────────────┐
│ [ CANDIDATE PROFILE ANCHOR ]                                [ EDIT ✏️ ] │
├────────────────────────────────────────────────────────────────────────┤
│ • Name: Alex                                                           │
│ • Occupation: Software Engineer building cloud infrastructure          │
│ • Hometown: Chittagong (coastal city) -> Now living: Dhaka (Dhanmondi) │
│ • Favorite Routine: Early morning workout, filter coffee               │
│ • Target Score: Band 7.5+                                              │
├────────────────────────────────────────────────────────────────────────┤
│ [ SELECT WORKOUT DOMAIN ]:                                             │
│ [x] DOMAIN 1: Work, Career & Ambition                                  │
│ [ ] DOMAIN 2: Hometown, Urban Shifts & Living Space                    │
│ [ ] DOMAIN 3: Daily Habits, Unwinding & Passions                       │
│                                                                        │
│                       [ BEGIN 15-MIN SESSION → ]                       │
└────────────────────────────────────────────────────────────────────────┘
```

#### AI Prompt Generation Rule:
The `/api/lesson` endpoint takes `CandidateProfile` and injects these exact facts into the generation schema so **everything on screen is 100% about the candidate's real life**.

---

### PHASE 1: Conversational Opener Priming (Duration: 3 Minutes)

#### Pedagogical Goal:
Speech motor activation. Waking up the lips, tongue, and vocal cords using formulaic opening sequences that the candidate will actually say during the test.

#### Screen State:
- **Left Console:** Oscilloscope shows live microphone waveform; status reads `LISTENING TO CANDIDATE`.
- **Right Desk:** Presents 3 sequential formulaic chunks tailored to the candidate's actual job and city.

```
┌────────────────────────────────────────┬────────────────────────────────────────┐
│ LEFT CONSOLE: ACOUSTIC OSCILLOSCOPE    │ RIGHT DESK: FORMULAIC CHUNK PRIMING    │
├────────────────────────────────────────┼────────────────────────────────────────┤
│ [ LIVE TRACE: RMS -18.4 dBFS ]         │ PROTOCOL 01: CONVERSATIONAL OPENERS   │
│                                        │ DRILL 1 OF 3: THE CAREER ANCHOR        │
│ ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿  │                                        │
│                                        │ "Well, to be perfectly candid,         │
│ CH1: MIC ACTIVE    CH2: AI STANDBY     │  I've spent the past few years         │
│                                        │  working in software development..."   │
│ [ MIC: CONTINUOUS ]                    │                                        │
│                                        │ [🔊 HEAR AI MODEL]  [REPEAT ALOUD 2X]   │
│                                        │                                        │
│ [ ADVANCE TO PROTOCOL 02 → ]           │ Target Phonetics:                      │
│                                        │ /kændɪd/ • stress on first syllable    │
└────────────────────────────────────────┴────────────────────────────────────────┘
```

#### Interaction Choreography:
1. Candidate clicks **[🔊 HEAR AI MODEL]**: AI voice speaks the chunk with natural British RP pitch and rhythm.
2. Candidate speaks the sentence aloud into their mic.
3. The oscilloscope lights up green, verifying vocal delivery.
4. Candidate taps **Next Chunk** until 3 openers are physically pronounced.

---

### PHASE 2: Personal Narrative Shadowing (Duration: 5 Minutes)

#### Pedagogical Goal:
Cadence, breath control, and stress-timing. The candidate shadows an exemplar Band 8+ spoken narrative of **their own life story** using the Tarteel-inspired teleprompter.

#### Screen State:
- **Header:** Displays real-time WPM Cadence and Stopwatch.
- **Right Desk:** Displays the 120-word spoken story formatted with rhythmic breath markers (`|`).

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIME: 01:24  |  CADENCE: 132 WPM (TARGET: 125-140)  |  [| BREATH MARKS] │
├────────────────────────────────────────────────────────────────────────┤
│ “At the moment, | I'm working as a software developer for a tech firm  │
│  based in the city center. | I've been in this role for about two      │
│  years now, | primarily architecting cloud infrastructure. | What I   │
│  find most rewarding | is the creative problem solving, | because no   │
│  two days ever look identical. | While it can occasionally be          │
│  mentally taxing during tight deadlines, | the autonomy I have over    │
│  my workflow | makes it an immensely worthwhile pursuit.”              │
├────────────────────────────────────────────────────────────────────────┤
│ [▶️ PLAY MODEL 0.85x]   [▶️ PLAY MODEL 1.0x]   [🎤 YOUR TURN TO SHADOW]   │
└────────────────────────────────────────────────────────────────────────┘
```

#### The Tarteel Teleprompter Mechanics:
1. **Word-by-Word Advance:** As the candidate speaks, incoming speech recognition highlights spoken words in real time.
2. **Breath Pause Marks (`|`):** Visual guides showing exactly where a native speaker pauses for a micro-breath (preventing running out of air mid-sentence).
3. **Cadence Monitor:** Real-time calculation showing if the candidate is rushing ($>155\text{ WPM}$) or dragging ($<110\text{ WPM}$). Target zone: **125–140 WPM**.

---

### PHASE 3: The 1.5-Second Reflex Sprint (Duration: 4 Minutes)

#### Pedagogical Goal:
Zero-hesitation retrieval. Testing if the candidate can answer the "obvious starter questions" without saying *"Uhh..."* or freezing.

#### Screen State:
- The script disappears!
- The AI voice asks an obvious question out loud.
- A **1.5-second visual latency ring** begins ticking down.
- Visual AER formula tags appear as a structural safety net.

```
┌────────────────────────────────────────────────────────────────────────┐
│ PROTOCOL 03: THE ZERO-HESITATION CRUCIBLE                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│     AI EXAMINER: "Do you work, or are you currently studying?"         │
│                                                                        │
│                        ⏱️ SPEAK NOW: [ 1.2s ]                          │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  [ 1. DIRECT ANCHOR ]   "At the moment, I'm working as..."   │     │
│   │  [ 2. CONTEXT / WHY ]   "I've been in this position for..."  │     │
│   │  [ 3. NUANCED DETAIL ]  "What I appreciate most is..."       │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                        │
│   Live Hesitation Sensor: [ 🟢 IMMEDIATE RETRIEVAL (< 0.8s) ]          │
└────────────────────────────────────────────────────────────────────────┘
```

#### AI Behavioral Rule in Phase 3:
- The AI examiner asks the question, then **mutes itself completely**.
- It does **not** interrupt the candidate while they speak their 3 sentences.
- When the candidate finishes (1.2s of acoustic silence), the AI gives a 1-sentence encouraging transition:  
  *“Spot on. Smooth anchor. Now let’s move to where you live...”*

---

### PHASE 4: The Exam Capstone (Duration: 5 Minutes)

#### Pedagogical Goal:
Transferring warmed-up, relaxed vocal agility into authentic IELTS Part 2 (Cue Card) and Part 3 (Abstract Discussion).

#### Screen State:
- Part 2 Cue Card displayed with interactive 60-second prep timer and 2-minute talk timer.
- Candidate speaks freely with warm vocal muscles and positive momentum.

---

### PHASE 5: Official Diagnostic Evaluation & Next Prescription (Duration: 2 Minutes)

#### What the User Sees:
- Official Cambridge-aligned Band Breakdown (Pronunciation, Fluency, Lexical, Grammar).
- **Vocal Biomechanics:** Notes on jaw tension, breath phrasing, and clarity.
- **The Repetition Audit:** Flags words the candidate overused (e.g., *"You used 'very' 6 times. Tomorrow, substitute with 'exceptionally' or 'substantially'."*).
- **Tomorrow's 5-Minute Prescription:** Direct action plan for their next session.

---

## 3. State Machine & Event Choreography

The application state machine governs how audio streams, UI cards, and AI voice responses transition cleanly:

```
[IDLE / SETUP] 
       │
       ▼ (User clicks Start)
[INIT_API] ──▶ Fetches /api/token & /api/lesson with CandidateProfile
       │
       ▼
[STAGE_1_PRIMING] ──▶ AI models chunk ──▶ Candidate repeats ──▶ Next chunk
       │
       ▼ (Click Advance)
[STAGE_2_SHADOWING] ──▶ Teleprompter tracks speech ──▶ Cadence WPM calculated
       │
       ▼ (Click Advance)
[STAGE_3_SPRINT] ──▶ AI asks question ──▶ 1.5s Countdown ──▶ Candidate speaks AER
       │
       ▼ (Click Advance)
[STAGE_4_CAPSTONE] ──▶ Part 2/3 Exam simulation ──▶ Finish session
       │
       ▼
[STAGE_5_REPORT] ──▶ /api/feedback evaluates transcript ──▶ Renders Report
```

---

## 4. Key Behavioral Rules for AI and Web Components

1. **Never Intercept Mid-Sentence:** During Stages 2, 3, and 4, the AI voice must be muted while the candidate speaks. Audio barge-in should only trigger on intentional hotkeys (`Spacebar`), never from ambient room noise.
2. **Scaffolding Safety Net:** In Stage 3 (Reflex Sprint), if the candidate stays silent for $>2.5\text{ seconds}$, a subtle hint chip fades in with an opening chunk (*"Try starting with: 'Well, currently I'm based in...'"*).
3. **No Abstract Science Themes:** All lesson generation prompts must strictly generate curriculum rooted in the candidate's actual job, hometown, living space, and daily habits.
4. **Persistent Profile:** The candidate never has to re-type their profile unless they choose to edit it via the **[ EDIT ✏️ ]** button.
