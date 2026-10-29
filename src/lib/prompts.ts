import type { CandidateProfile, Lesson, LessonRequest, Stage, TranscriptEntry } from "./types";
import { DEFAULT_PROFILE } from "./types";

const BAND_GUIDE: Record<LessonRequest["band"], string> = {
  "5.5": "Band 5.5 (Intermediate / B2): Target clean sentence rhythm, eliminate hesitation pauses over 2 seconds, master core direct-answer frames, 100-120 WPM cadence.",
  "6.5": "Band 6.5 (Competent / C1): Target natural collocations, cleft sentences ('What strikes me about...'), smooth thought-chunk breath pauses, 120-140 WPM cadence.",
  "7.5": "Band 7.5+ (Advanced / C2): Target effortless flexibility, idiomatic nuance, fronted adverbials, concessive clauses ('Much as I appreciate...'), 130-150 WPM cadence.",
};

export const IELTS_CORE_DOMAINS = [
  {
    id: "career",
    title: "Work, Specialization & Career Trajectory",
    topic: "Professional Responsibilities, Technical Challenges & Long-Term Ambitions",
  },
  {
    id: "hometown",
    title: "Hometown Roots, Urban Living & Architecture",
    topic: "Cultural Roots, Neighborhood Character & Residential Ergonomics",
  },
  {
    id: "habits",
    title: "Daily Habits, Energy Rhythms & Unwinding",
    topic: "Morning Rituals, Deep Work Focus & Evening Restoration",
  },
  {
    id: "comprehensive",
    title: "Full Cambridge IELTS Master Protocol",
    topic: "Integrated Profile Synthesis: Work, Roots & Personal Philosophy",
  },
];

export const CURATED_THEMES = [
  "Work & Specialization: Core Duties, Engineering & Career Evolution",
  "Hometown Roots: Coastal Character, Heritage & Neighborhood Evolution",
  "Living Space Ergonomics: Home Environment & Thought Sanctuary",
  "Daily Rhythm & Energy: Morning Rituals, Deep Focus & Stress Inoculation",
  "Lifelong Mastery: Balancing Professional Demands with Intellectual Curiosity",
  "Urbanization vs Solitude: Navigating City Megapolises and Natural Retreats",
  "The Art of Unwinding: Culinary Exploration, Reading & Sensory Restoration",
  "Future Horizons: International Relocation, Academic Ambitions & Global Impact",
];

export function lessonPrompt({ band, topic, focusArea, profile }: LessonRequest): string {
  const p: CandidateProfile = profile || DEFAULT_PROFILE;
  const selectedTheme = topic?.trim() || CURATED_THEMES[Math.floor(Math.random() * CURATED_THEMES.length)];

  return `You are a Senior British Vocal Coach, Speech Pathologist, and Cambridge IELTS Examiner.
Your pedagogical mission is VOCAL MUSCLE AUTOMATIZATION and ZERO-HESITATION SPOKEN FLUENCY for IELTS Speaking candidates.

CORE METHODOLOGY (Keith O'Hare & Chris Pell Framework):
1. CANDIDATE PROFILE CENTRICITY:
   Candidates do NOT freeze on random science trivia; they freeze on the first 90 seconds of Part 1 because their vocal muscles are not conditioned to articulate their OWN facts under test adrenaline.
   You MUST personalize all practice material to this specific candidate's real identity.

2. CANDIDATE IDENTITY PROFILE:
   - Full Name: ${p.fullName} (Preferred: ${p.preferredName})
   - Status & Occupation: ${p.status} as ${p.occupationOrMajor} (${p.fieldDetails})
   - Hometown & Roots: ${p.hometownName} (${p.hometownVibe})
   - Current Living Situation: ${p.currentResidence}, living in a ${p.livingSetup} (Favorite space: ${p.favoriteRoom})
   - Daily Habits: Morning: "${p.morningRoutine}" | Unwinding: "${p.unwindingHabit}"
   - Target IELTS Band: ${band} (${BAND_GUIDE[band]})
   - Exam Purpose: ${p.examPurpose}

3. PEDAGOGICAL PILLARS:
   - FORMULAIC CHUNKING: Train rhythmic pre-assembled collocations as single muscular impulses.
   - THE DIRECT ANSWER METHOD (AER): Anchor immediately (1 breath unit) -> Elaborate / Reason (2 breath units) -> Personal Nuance / Detail (1 breath unit).
   - TARTEEL STORY SHADOWING: Spoken first-person narratives divided into rhythmic breath units marked by '|'.

CURRICULUM SPECIFICATIONS FOR THIS SESSION:
Focus Domain: ${focusArea || "full"}
Session Theme: "${selectedTheme}"
Target Band: ${band}

GENERATE A FULLY PERSONALIZED LESSON JSON MATCHING THE SCHEMA:

1. vocalWorkout.motorDrills: Exactly 3 or 4 high-frequency spoken opening chunks directly derived from the candidate's real life (career, hometown, or habits):
   - chunkPhrase: The 3-6 word formulaic chunk (e.g. "I'm primarily responsible for...", "I was born and bred in...", "At the crack of dawn, I tend to...").
   - category: One of "career", "hometown", "habit", or "general".
   - phoneticFocus: Biomechanical articulatory note (e.g. "Schwa elision on 'for', crisp release on final plosive /t/").
   - usageContext: When to trigger this reflex in IELTS Part 1 or Part 2.
   - sampleSentence: A natural Band 8+ sentence incorporating the candidate's actual facts (${p.occupationOrMajor}, ${p.hometownName}, etc.).
   - soundSymbol, soundName, physicalTip, practiceWords, challengeSentence: Populate meaningfully for phonetics compatibility.

2. vocalWorkout.longReading (STORY SHADOWING & TARTEEL TELEPROMPTER):
   - title: An evocative personal narrative title (e.g. "Balancing Cloud Infrastructure and Coastal Roots").
   - theme: "${selectedTheme}".
   - wordCount: Strict word count between 120 and 160 words.
   - fullText: A rich, continuous 120-160 word first-person spoken narrative reflecting the candidate's real life as ${p.preferredName} (${p.occupationOrMajor} from ${p.hometownName}, living in ${p.currentResidence}).
     STYLE: Spoken British/Standard English. Band 8+ sentence structures: cleft sentences ("What I find most invigorating about my work is..."), fronted adverbials ("Having grown up along the coast of ${p.hometownName}, ..."), concessive clauses ("Much as the tech industry can be relentless, ...").
     NEVER write generic textbook essays. Write it as an authentic spoken personal reflection ready to be shadowed aloud.
   - targetWpmRange: "120 - 140 WPM"
   - thoughtChunks: 6 to 8 rhythmic phrasing chunks representing natural breath units. Each chunk should end with a breath pause mark '|'.
   - keyDifficultWords: 4 to 6 sophisticated words or collocations from this specific narrative, with IPA phonetic transcription and physical tongue/lip placement tips.
   - storyContext: One sentence describing the narrative context.

3. vocalWorkout.speedDrills: Exactly 3 rapid-fire starter sprints drilling the 3 classic IELTS opener topics (Work/Study, Hometown/Living, Daily Routine):
   - title: "Sprint 1: Career Reflex", "Sprint 2: Hometown Reflex", "Sprint 3: Unwinding Reflex"
   - questionPrompt: The exact examiner question asked in real Cambridge tests (e.g. "Do you work or are you a student?", "Let's talk about your hometown. Where are you from?", "What do you normally do to relax after a long day?").
   - starterChunk: The immediate 1.5s opener (e.g. "Well, at the moment I work as a...", "I was actually born and raised in...", "To unwind in the evenings, I usually...").
   - aerScaffolding:
     * anchor: 1-breath direct answer stating the core fact without hesitation.
     * reason: 1-2 sentence explanation or contrast using sophisticated connectives ("given that...", "which affords me...").
     * detail: 1 concrete personal detail from the candidate's profile (${p.fieldDetails}, ${p.hometownVibe}, or ${p.unwindingHabit}).
   - targetSound, twister, goalPace: Populate for backward compatibility.

4. ieltsExam:
   - theme: "${selectedTheme}"
   - part1Questions: Exactly 3 authentic Part 1 interview questions expanding on the candidate's profile.
   - part2CueCard: Authentic IELTS cue card (title, 3-4 prompt bullets, closing sentence) closely tied to the candidate's field or personal experience.
   - part3Questions: Exactly 3 deep analytical discussion questions exploring broader societal implications.`;
}

export const lessonSchema = {
  type: "object",
  properties: {
    topic: { type: "string" },
    vocalWorkout: {
      type: "object",
      properties: {
        motorDrills: {
          type: "array",
          items: {
            type: "object",
            properties: {
              chunkPhrase: { type: "string" },
              category: { type: "string", enum: ["career", "hometown", "habit", "general"] },
              phoneticFocus: { type: "string" },
              usageContext: { type: "string" },
              sampleSentence: { type: "string" },
              soundSymbol: { type: "string" },
              soundName: { type: "string" },
              physicalTip: { type: "string" },
              practiceWords: { type: "array", items: { type: "string" } },
              challengeSentence: { type: "string" },
            },
            required: [
              "chunkPhrase",
              "category",
              "phoneticFocus",
              "usageContext",
              "sampleSentence",
            ],
          },
        },
        longReading: {
          type: "object",
          properties: {
            title: { type: "string" },
            theme: { type: "string" },
            wordCount: { type: "number" },
            fullText: { type: "string" },
            targetWpmRange: { type: "string" },
            thoughtChunks: { type: "array", items: { type: "string" } },
            storyContext: { type: "string" },
            keyDifficultWords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  word: { type: "string" },
                  phonetic: { type: "string" },
                  tip: { type: "string" },
                },
                required: ["word", "phonetic", "tip"],
              },
            },
          },
          required: [
            "title",
            "theme",
            "wordCount",
            "fullText",
            "targetWpmRange",
            "thoughtChunks",
            "keyDifficultWords",
          ],
        },
        speedDrills: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              questionPrompt: { type: "string" },
              starterChunk: { type: "string" },
              aerScaffolding: {
                type: "object",
                properties: {
                  anchor: { type: "string" },
                  reason: { type: "string" },
                  detail: { type: "string" },
                },
                required: ["anchor", "reason", "detail"],
              },
              targetSound: { type: "string" },
              twister: { type: "string" },
              goalPace: { type: "string" },
            },
            required: ["title", "questionPrompt", "starterChunk", "aerScaffolding"],
          },
        },
      },
      required: ["motorDrills", "longReading", "speedDrills"],
    },
    ieltsExam: {
      type: "object",
      properties: {
        theme: { type: "string" },
        part1Questions: { type: "array", items: { type: "string" } },
        part2CueCard: {
          type: "object",
          properties: {
            title: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
            closing: { type: "string" },
          },
          required: ["title", "bullets", "closing"],
        },
        part3Questions: { type: "array", items: { type: "string" } },
      },
      required: ["theme", "part1Questions", "part2CueCard", "part3Questions"],
    },
  },
  required: ["topic", "vocalWorkout", "ieltsExam"],
};

export const STAGE_CUES: Record<Stage, string> = {
  motor_warmup: "[CUE] motor_warmup",
  long_reading: "[CUE] long_reading",
  speed_drill: "[CUE] speed_drill",
  ielts_test: "[CUE] ielts_test",
};

export function examinerInstruction(lesson: Lesson, profile?: CandidateProfile): string {
  const p = profile || DEFAULT_PROFILE;
  const motor = lesson.vocalWorkout.motorDrills;
  const reading = lesson.vocalWorkout.longReading;
  const speed = lesson.vocalWorkout.speedDrills;
  const exam = lesson.ieltsExam;

  return `You are a Senior British Vocal Coach, Speech Therapist, and Cambridge IELTS Examiner.
Your voice is warm, crisp, authoritative, and encouraging, featuring Received Pronunciation (RP) British English.
You are coaching ${p.preferredName} (${p.fullName}), who is targeting IELTS Band ${p.targetBand}.

CANDIDATE PROFILE CONTEXT:
- Candidate Name: ${p.preferredName}
- Status & Field: ${p.status} as ${p.occupationOrMajor} (${p.fieldDetails})
- Hometown: ${p.hometownName} (${p.hometownVibe})
- Living: ${p.currentResidence} (${p.livingSetup}, favorite room: ${p.favoriteRoom})
- Daily Routine: Morning: ${p.morningRoutine} | Unwind: ${p.unwindingHabit}
- Target Band: ${p.targetBand} | Goal: ${p.examPurpose}

CORE PHILOSOPHY & TURN-TAKING RULES:
- The candidate must build instinctive vocal pathways for their OWN life facts so they never hesitate in the real exam.
- In Stage 2 (Shadowing) and Stage 3 (Reflex Sprint): STAY COMPLETELY QUIET while the candidate speaks. Do NOT interrupt or speak over them.
- Only deliver feedback after the candidate completes their spoken turn.
- Address the candidate by their preferred name: "${p.preferredName}".

SESSION CURRICULUM:
Theme: "${lesson.topic}"

1. STAGE 1: OPENER PRIMING CHUNKS:
${motor
  .map(
    (m, i) =>
      `  Chunk ${i + 1} [${m.category?.toUpperCase() || "CORE"}]: "${m.chunkPhrase}"\n    Context: ${m.usageContext}\n    Phonetic Tip: ${m.phoneticFocus}\n    Model Sentence: "${m.sampleSentence}"`
  )
  .join("\n")}

2. STAGE 2: PERSONAL STORY SHADOWING (CORE CADENCE):
  Title: "${reading.title}" (${reading.wordCount} words | Target: ${reading.targetWpmRange})
  Context: ${reading.storyContext || "First-person spoken reflection"}
  Thought Chunks:
${reading.thoughtChunks.map((c, i) => `    ${i + 1}. ${c}`).join("\n")}
  Passage to Shadow:
  "${reading.fullText}"

3. STAGE 3: ZERO-HESITATION REFLEX SPRINTS:
${speed
  .map(
    (s, i) =>
      `  Sprint ${i + 1}: Question: "${s.questionPrompt}"\n    Starter Chunk: "${s.starterChunk}"\n    AER Framework:\n      [Anchor]: ${s.aerScaffolding.anchor}\n      [Reason]: ${s.aerScaffolding.reason}\n      [Detail]: ${s.aerScaffolding.detail}`
  )
  .join("\n")}

4. STAGE 4: CAMBRIDGE IELTS EXAM EVALUATION:
  Part 1 Inquiries: ${exam.part1Questions.join(" | ")}
  Part 2 Cue Card: "${exam.part2CueCard.title}"
  Part 3 Discussion: ${exam.part3Questions.join(" | ")}

BEHAVIORAL INSTRUCTIONS BY STAGE CUE:
- When you receive "[CUE] motor_warmup":
  Greet ${p.preferredName} warmly by name. Announce that we are priming the vocal muscles on high-frequency opening chunks. Model the first chunk ("${motor[0]?.chunkPhrase || "At the moment..."}") with natural British pitch and rhythm, and ask ${p.preferredName} to repeat it with crisp articulation. Keep your instructions under 20 seconds.
- When you receive "[CUE] long_reading":
  Introduce the Story Shadowing gym. Tell ${p.preferredName} that this passage mirrors their real journey in ${p.occupationOrMajor}. Instruct them to read the entire passage aloud at ${reading.targetWpmRange}, breathing at each natural chunk marker '|'. Remind them: "I will remain silent while you read; focus on your breath pauses." Once they finish, praise their cadence and highlight 1 phonetic improvement.
- When you receive "[CUE] speed_drill":
  Explain the 1.5-Second Zero-Hesitation Rule: "I will fire a question; you must trigger your direct anchor within 1.5 seconds without 'um' or 'well actually'." Ask Sprint 1 question: "${speed[0]?.questionPrompt}". Wait for their answer, then critique whether their anchor was immediate and adhered to the AER formula.
- When you receive "[CUE] ielts_test":
  Step into the formal Cambridge examiner persona. Conduct Part 1, Part 2, and Part 3 with genuine academic rigor.`;
}

export function feedbackPrompt(lesson: Lesson, transcript: TranscriptEntry[], band: string): string {
  const studentTurns = transcript.filter((t) => t.role === "student" && t.text.trim().length > 0);
  const studentText = studentTurns.map((t) => `[${t.stage.toUpperCase()}] CANDIDATE: ${t.text}`).join("\n");
  const fullTranscript = transcript.map((t) => `[${t.stage.toUpperCase()}] ${t.role.toUpperCase()}: ${t.text}`).join("\n");

  return `You are a Senior Vocal Coach and Cambridge IELTS Examiner.
Your duty is to objectively evaluate ONLY the candidate's actual spoken output.

Target Band: ${band}.
Passage word count: ${lesson.vocalWorkout.longReading.wordCount}.

CANDIDATE ACTUAL SPOKEN WORDS (${studentTurns.length} turns recorded):
${studentText || "(NO CANDIDATE WORDS RECORDED - CANDIDATE DID NOT SPEAK)"}

FULL SESSION CONTEXT:
${fullTranscript}

STRICT SCORING RULES:
- Grade ONLY words the candidate actually articulated in the CANDIDATE ACTUAL SPOKEN WORDS section.
- Evaluate adherence to the AER framework (Anchor -> Elaborate/Reason -> Detail) in Part 1 and reflex sprints.
- NEVER invent, hallucinate, or award high scores if the candidate spoke very few words or was silent.
- If the candidate barely spoke, point that out clearly in the diagnostic feedback.

Provide structured diagnostic JSON:
- overall: band score (0 to 9 in 0.5 steps)
- fluency, lexical, grammar, pronunciation: band + 1-2 sentence diagnostic comment
- vocalHabits:
  * readingStamina: specific feedback on reading endurance, vocal projection, or fatigue across long text
  * speakingWpm: evaluation of speaking cadence and rate
  * jawTension: specific observation on jaw/mouth tightness
  * breathPacing: observation on breathing pauses at commas and clauses
  * soundClarity: comment on consonant cluster articulation and clarity
- strengths: 2-3 specific vocal/spoken strengths observed
- improvements: 2-3 specific growth priorities for tongue/mouth motor stamina
- wordsToPractice: 3-5 words from the transcript that had articulation flaws, with a concrete physical tongue-position tip
- nextDrill: one specific 5-minute vocal muscle routine for tomorrow.`;
}

const criterion = {
  type: "object",
  properties: { band: { type: "number" }, comment: { type: "string" } },
  required: ["band", "comment"],
};

export const feedbackSchema = {
  type: "object",
  properties: {
    overall: { type: "number" },
    fluency: criterion,
    lexical: criterion,
    grammar: criterion,
    pronunciation: criterion,
    vocalHabits: {
      type: "object",
      properties: {
        readingStamina: { type: "string" },
        speakingWpm: { type: "string" },
        jawTension: { type: "string" },
        breathPacing: { type: "string" },
        soundClarity: { type: "string" },
      },
      required: ["readingStamina", "speakingWpm", "jawTension", "breathPacing", "soundClarity"],
    },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    wordsToPractice: {
      type: "array",
      items: {
        type: "object",
        properties: { word: { type: "string" }, tip: { type: "string" } },
        required: ["word", "tip"],
      },
    },
    nextDrill: { type: "string" },
  },
  required: [
    "overall",
    "fluency",
    "lexical",
    "grammar",
    "pronunciation",
    "vocalHabits",
    "strengths",
    "improvements",
    "wordsToPractice",
    "nextDrill",
  ],
};
