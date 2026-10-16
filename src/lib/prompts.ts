import type { Lesson, LessonRequest, Stage, TranscriptEntry } from "./types";

const BAND_GUIDE: Record<LessonRequest["band"], string> = {
  "5.5": "intermediate (B1-B2): foundational connected speech, clear everyday sentences, 100-120 WPM cadence",
  "6.5": "upper-intermediate (B2-C1): natural idioms, consonant cluster transitions (-sts, -dth, -lved), 120-140 WPM cadence",
  "7.5": "advanced (C1+): sophisticated prose, academic vocabulary, rhythmic stress shifts, 130-150 WPM cadence",
};

export const CURATED_THEMES = [
  "Deep Ocean Trenches & Bioluminescent Life",
  "The James Webb Space Telescope & Infrared Cosmology",
  "The Neurobiology of Deep Sleep & Memory Consolidation",
  "The Chemistry & Heritage of Artisan Sourdough Fermentation",
  "High-Altitude Himalayan Mountaineering & Oxygen Physiology",
  "Mycelial Networks: The Underground Communication of Forests",
  "Ancient Polynesian Wayfinding & Celestial Wave Navigation",
  "The Mechanical Precision of 18th Century Horology & Clocks",
  "Acoustic Engineering of Concert Halls & Resonance Chambers",
  "The Philosophy of Flow State & Deep Creative Focus",
  "Subterranean Caverns & Extreme Speleology",
  "Evolutionary Biology of Human Speech & Vocal Tracts",
  "Traditional Japanese Woodblock Printing & Pigment Alchemy",
  "Atmospheric Rivers & Extreme Global Weather Patterns",
  "Archaeology of Lost Silk Road Caravans & Desert Trade",
  "The Psychology of Lifelong Curiosity & Wonder",
  "Coral Reef Soundscapes & Marine Midnight Biodiversity",
  "The Aerodynamics of Soaring Birds & Albatross Dynamics",
  "Analog Film Photography Revival in the Hyper-Digital Era",
  "Volcanic Obsidian & Stone Age Glass Toolmaking",
  "The Olfactory Sense: How Scent Rewires Human Memory",
  "Solitary Atlantic Lighthouses & Maritime Survival",
  "Medieval Islamic Observatories & Celestial Geometry",
  "Extreme Desert Flora Adaptation in the Atacama",
  "The Acoustic Ecology of Silence in Urban Megacities",
  "The Art and Ergonomics of Handcrafted Fountain Pens",
  "Subarctic Glaciology & Ice Core Climate Records",
  "Traditional Nordic Timber Architecture & Stave Churches",
  "Bioluminescent Fungi & Nighttime Rainforest Botany",
  "The Mathematics of Origami & Deployable Space Solar Arrays",
];

export const PHONETIC_SETS = [
  {
    name: "Liquid Approximants & Retroflexion (/r/ vs /l/)",
    drill1: { symbol: "/r/ vs /l/", name: "Liquid Approximant Contrast", cue: "Do not touch the roof of the mouth for British /r/; tap firmly on the upper tooth ridge for crisp /l/." },
    drill2: { symbol: "-sts, -sks, -sps", name: "Dense Consonant Cluster Endings", cue: "Avoid swallowing the final plosive; articulate the /s/ hiss immediately followed by a clean stop (/t/ or /k/)." },
  },
  {
    name: "Labiodental vs Bilabial Approximants (/v/ vs /w/)",
    drill1: { symbol: "/v/ vs /w/", name: "Labiodental vs Bilabial Friction", cue: "Gently press upper front teeth against bottom lip for /v/; purse lips forward like blowing a candle for /w/." },
    drill2: { symbol: "/p/ vs /b/ & /t/ vs /d/", name: "Aspirated Plosive Explosions", cue: "Build oral air pressure behind lips and tongue tip, then release with a sharp, punchy burst of air." },
  },
  {
    name: "Interdental Fricatives & Sibilant Contrast (/θ/, /ð/ vs /s/, /z/)",
    drill1: { symbol: "/θ/ vs /s/", name: "Interdental vs Alveolar Air Stream", cue: "Extend tongue tip lightly between incisors for /θ/; pull tongue back behind teeth for the high-frequency /s/ hiss." },
    drill2: { symbol: "-ed Past Tense Endings", name: "Voiced vs Voiceless Suffix Stops", cue: "Distinguish unvoiced /t/ (stopped, cracked) from voiced /d/ (roamed, solved) and full syllables /ɪd/ (created)." },
  },
  {
    name: "Palato-Alveolar Fricatives & Affricates (/ʃ/, /tʃ/, /dʒ/)",
    drill1: { symbol: "/ʃ/ vs /tʃ/", name: "Continuous Hiss vs Stop-Affricate", cue: "Round lips and arch tongue blade for continuous /ʃ/; block air completely with tongue before popping /tʃ/." },
    drill2: { symbol: "/iː/ vs /ɪ/", name: "Tense Long Vowel vs Lax Short Vowel", cue: "Spread mouth into an exaggerated smile with high tongue for /iː/ (reach); drop jaw slightly and relax for /ɪ/ (rich)." },
  },
  {
    name: "Medial & Terminal Clusters (-dth, -lved, -ntly)",
    drill1: { symbol: "-dth & -ths", name: "Dental Suffix Transitions", cue: "Move smoothly from alveolar tongue position into interdental /θ/ without adding an extra vowel sound." },
    drill2: { symbol: "/ŋ/ vs /ŋk/", name: "Velar Nasals & Hard Releases", cue: "Seal the back of your tongue against the soft palate; let air ring through nasal cavity before clean release." },
  },
];

export function lessonPrompt({ band, topic, focusArea }: LessonRequest): string {
  const selectedTheme = topic?.trim() || CURATED_THEMES[Math.floor(Math.random() * CURATED_THEMES.length)];
  const phoneticSet = PHONETIC_SETS[Math.floor(Math.random() * PHONETIC_SETS.length)];

  return `You are a Senior British Vocal Coach, Speech Therapist, and Cambridge IELTS Examiner.
Your PRIMARY MISSION is VOCAL MUSCLE REHABILITATION and EXTENDED SIGHT-READING STAMINA for English learners.

Target Band: ${band} — ${BAND_GUIDE[band]}.
MANDATORY SESSION THEME: "${selectedTheme}".
Focus Mode: ${focusArea ?? "full"}.

PHONETIC TARGET DIRECTIVES FOR THIS UNIQUE SESSION:
- Drill 1 Sound: "${phoneticSet.drill1.symbol}" (${phoneticSet.drill1.name})
  Guideline: ${phoneticSet.drill1.cue}
- Drill 2 Sound: "${phoneticSet.drill2.symbol}" (${phoneticSet.drill2.name})
  Guideline: ${phoneticSet.drill2.cue}

Generate a completely custom, highly imaginative, NON-REPETITIVE Vocal Gym session:

1. vocalWorkout.motorDrills: Exactly 2 phonetic articulation drills matching the two target sounds above:
   - Drill 1 MUST target "${phoneticSet.drill1.symbol}" (${phoneticSet.drill1.name}).
   - Drill 2 MUST target "${phoneticSet.drill2.symbol}" (${phoneticSet.drill2.name}).
   - Provide concrete biomechanical mouth/jaw cues, 4-5 words, and an original challenging sentence related to "${selectedTheme}".

2. vocalWorkout.longReading (CORE VOCAL STAMINA GYM):
   - title: An inspiring, original editorial title about "${selectedTheme}".
   - theme: "${selectedTheme}".
   - wordCount: Exact word count (MUST BE STRICTLY BETWEEN 150 AND 220 WORDS).
   - fullText: A rich, continuous 150-220 word long reading passage strictly exploring "${selectedTheme}". Write it in the style of an immersive BBC Radio 4 documentary or National Geographic feature. Use varied sentence rhythm, natural breath pauses, evocative vocabulary, and rhythmic momentum. NEVER output generic or repetitive filler.
   - targetWpmRange: "120 - 140 WPM"
   - thoughtChunks: 6 to 8 rhythmic phrasing chunks representing natural breath pauses.
   - keyDifficultWords: 4 to 6 of the most phonetically challenging words from this specific passage, with IPA transcription and physical mouth-position tip.

3. vocalWorkout.speedDrills: Exactly 2 tongue twisters designed to drill motor velocity on "${phoneticSet.drill1.symbol}" and "${phoneticSet.drill2.symbol}".
   - targetSound: The sound exercised.
   - twister: An alliterative, fun, original twister sentence.
   - goalPace: Clear velocity advice (e.g. "Slow articulation -> Natural cadence -> Rapid fire").

4. ieltsExam (SECONDARY APPLICATION):
   - theme: Cambridge IELTS theme related to "${selectedTheme}".
   - part1Questions: Exactly 3 authentic Part 1 interview questions.
   - part2CueCard: Authentic IELTS cue card (title, 3-4 bullets, closing).
   - part3Questions: Exactly 3 deep analytical discussion questions.`;
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
              soundSymbol: { type: "string" },
              soundName: { type: "string" },
              physicalTip: { type: "string" },
              practiceWords: { type: "array", items: { type: "string" } },
              challengeSentence: { type: "string" },
            },
            required: ["soundSymbol", "soundName", "physicalTip", "practiceWords", "challengeSentence"],
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
          required: ["title", "theme", "wordCount", "fullText", "targetWpmRange", "thoughtChunks", "keyDifficultWords"],
        },
        speedDrills: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              targetSound: { type: "string" },
              twister: { type: "string" },
              goalPace: { type: "string" },
            },
            required: ["title", "targetSound", "twister", "goalPace"],
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

export function examinerInstruction(lesson: Lesson): string {
  const motor = lesson.vocalWorkout.motorDrills;
  const reading = lesson.vocalWorkout.longReading;
  const speed = lesson.vocalWorkout.speedDrills;
  const exam = lesson.ieltsExam;

  return `You are an elite British Vocal Coach, Speech Therapist, and Senior Cambridge IELTS Examiner.
Your voice is warm, articulative, encouraging, and authoritative with a crisp Received Pronunciation (RP) British accent.

CORE PHILOSOPHY:
- Speaking freeze is caused by physical vocal muscle tightness and breath anxiety, NOT lack of vocabulary.
- Your primary duty is vocal gymnastics, jaw relaxation, breath phrasing, and extended reading stamina.
- The IELTS exam is an optional secondary application.

CURRICULUM IN THIS SESSION:
Theme: "${lesson.topic}"

1. MOTOR DRILLS:
${motor
  .map(
    (m, i) =>
      `  Drill ${i + 1}: ${m.soundSymbol} (${m.soundName}) - Cue: "${m.physicalTip}" | Words: ${m.practiceWords.join(", ")} | Sentence: "${m.challengeSentence}"`
  )
  .join("\n")}

2. LONG READING GYM (CORE VOCAL STAMINA):
  Title: "${reading.title}" (${reading.wordCount} words)
  Pacing Target: ${reading.targetWpmRange}
  Key Difficult Words: ${reading.keyDifficultWords.map((w) => `${w.word} (${w.phonetic})`).join(", ")}
  Passage:
  "${reading.fullText}"

3. SPEED & VELOCITY DRILLS:
${speed.map((s, i) => `  Drill ${i + 1}: [${s.targetSound}] "${s.twister}" (${s.goalPace})`).join("\n")}

4. IELTS EXAM (OPTIONAL CAPSTONE):
  Part 1 Questions: ${exam.part1Questions.join(" | ")}
  Part 2 Cue Card: "${exam.part2CueCard.title}"
  Part 3 Questions: ${exam.part3Questions.join(" | ")}

BEHAVIORAL INSTRUCTIONS BY CUE:
- When you receive "[CUE] motor_warmup":
  Greet the student warmly. Explain that before speaking spontaneously, we must wake up the jaw, tongue tip, and vocal cords. Guide them through the first sound: explain the mouth position tip concisely, model 2 practice words, and ask them to repeat. Keep each turn under 25 seconds.
- When you receive "[CUE] long_reading":
  Introduce the core stamina exercise. Instruct the student to read the entire passage aloud at a steady, controlled pace (${reading.targetWpmRange}). Remind them to breathe at commas and clause boundaries without holding their breath. Once they finish reading, give immediate feedback on rhythm, continuous vocal projection, and consonant crispness.
- When you receive "[CUE] speed_drill":
  Challenge them to test their vocal motor speed with the tongue twisters. Ask them to do 1 slow articulation rep, then 1 natural rep, then 1 rapid-fire rep.
- When you receive "[CUE] ielts_test":
  Adopt a formal, supportive Cambridge examiner persona and conduct Part 1, Part 2, or Part 3 based on the candidate's preference.

GENERAL CONVERSATION RULES:
- Keep turns concise (15-30 seconds max). NEVER monologue.
- Praise physical clarity ("Crisp release on that /t/ sound!").
- Model pronunciation clearly with natural British cadence.`;
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
    "overall", "fluency", "lexical", "grammar", "pronunciation", "vocalHabits",
    "strengths", "improvements", "wordsToPractice", "nextDrill",
  ],
};
