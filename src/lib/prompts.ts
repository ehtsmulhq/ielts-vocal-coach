import type { CandidateProfile, Lesson, LessonRequest, Stage, TranscriptEntry } from "./types";
import { DEFAULT_PROFILE } from "./types";
import { CAMBRIDGE_TEST_MODULES, CAMBRIDGE_FUNCTIONAL_FRAMES } from "./cambridge-materials";

const BAND_GUIDE: Record<LessonRequest["band"], string> = {
  "5.5": "Band 5.5 (Intermediate / B2): Focus on direct responses, eliminate 2s+ hesitations, establish baseline coherence, 100-120 WPM.",
  "6.5": "Band 6.5 (Competent / C1): Natural collocations, cleft sentences ('What strikes me about...'), smooth thought-chunk breath pauses, 120-140 WPM.",
  "7.5": "Band 7.5+ (Advanced / C2): Effortless flexibility, idiomatic precision, fronted adverbials, concessive clauses ('Much as I appreciate...'), 130-150 WPM.",
};

export const CURATED_THEMES = [
  "Cambridge 19: Urban Spaces, Modern Architecture & Community Living",
  "Cambridge 19: Artificial Intelligence, Automation & Workplace Evolution",
  "Cambridge 18: Environmental Sustainability & Climate Solutions",
  "Cambridge 18: Health, Nutrition & Stress Inoculation",
  "Cambridge 17: Travel, Global Mobility & Cross-Cultural Immersion",
  "Cambridge 17: Creative Expression, Arts & Cultural Preservation",
  "Cambridge 16: Interpersonal Communication & Mentorship Dynamics",
  "Work & Specialization: Core Duties, Engineering & Career Evolution",
  "Hometown Roots: Coastal Character, Heritage & Neighborhood Evolution",
  "Living Space Ergonomics: Home Environment & Thought Sanctuary",
];

export function lessonPrompt({
  band,
  topic,
  cambridgeTestId,
}: LessonRequest): string {
  // Find official Cambridge module if selected
  const cambridgeModule =
    CAMBRIDGE_TEST_MODULES.find((m) => m.id === cambridgeTestId) ||
    CAMBRIDGE_TEST_MODULES.find(
      (m) =>
        topic &&
        (topic.toLowerCase().includes(m.id.toLowerCase()) ||
          topic.toLowerCase().includes(m.title.toLowerCase()) ||
          (topic.toLowerCase().includes(m.book.toLowerCase()) &&
            topic.includes(String(m.testNumber))))
    );

  const selectedTheme =
    cambridgeModule?.title ||
    topic?.trim() ||
    CURATED_THEMES[Math.floor(Math.random() * CURATED_THEMES.length)];

  const cambridgeContext = cambridgeModule
    ? `
AUTHENTIC CAMBRIDGE IELTS BLUEPRINT:
- Publication Reference: ${cambridgeModule.book} • Test ${cambridgeModule.testNumber}
- Exam Domain: ${cambridgeModule.theme}
- Official Part 1 Prompts: ${JSON.stringify(cambridgeModule.part1Questions)}
- Official Part 2 Cue Card:
  Title: "${cambridgeModule.part2CueCard.title}"
  Bullets: ${cambridgeModule.part2CueCard.bullets.join(" | ")}
  Closing: "${cambridgeModule.part2CueCard.closing}"
- Official Part 3 Prompts: ${JSON.stringify(cambridgeModule.part3Questions)}
- Target Lexical Collocations: ${JSON.stringify(cambridgeModule.recommendedVocabulary.map((v) => v.phrase))}
`
    : `
CAMBRIDGE IELTS OFFICIAL SPECIFICATION:
Base the exam simulation strictly on Cambridge IELTS Books 16–19 examiner standards:
- Part 1: Exactly 3 authentic questions that start conversational around candidate identity and expand naturally.
- Part 2: Authentic 4-part cue card prompt with 3 bullet inquiries and closing instruction.
- Part 3: Deep analytical questions demanding comparative, speculative, and societal reasoning.
`;

  return `You are a Senior British Vocal Coach, Speech Pathologist, and Cambridge IELTS Examiner.
Your mission is to generate an authentic CAMBRIDGE IELTS SPEAKING HOT SEAT TEST for a live interactive interview.

ABSOLUTE RULE — NO CANDIDATE DATA IN QUESTIONS:
You are generating GENERIC examiner questions. You do NOT know who the candidate is.
You must NEVER reference any specific profession, job title, technical field, hobby, hometown,
morning routine, or personal detail in any question. Real IELTS examiners ask the same standard
questions to EVERY candidate regardless of their background.

Target IELTS Band: ${band} (${BAND_GUIDE[band]})

${cambridgeContext}

CAMBRIDGE BAND 8+ SYNTACTIC EXPECTATIONS (for recommended vocabulary only):
- Cleft sentences: "${CAMBRIDGE_FUNCTIONAL_FRAMES[0].formula}"
- Fronted adverbials: "${CAMBRIDGE_FUNCTIONAL_FRAMES[1].formula}"
- Concessive clauses: "${CAMBRIDGE_FUNCTIONAL_FRAMES[2].formula}"
- Part 3 Speculative frames: "${CAMBRIDGE_FUNCTIONAL_FRAMES[3].formula}"

GENERATE A STRUCTURED JSON MATCHING THE SCHEMA:
- topic: "${selectedTheme}"
- band: "${band}"
- hotSeatTest:
  * theme: "${selectedTheme}"
  * cambridgeRef: "${cambridgeModule ? `${cambridgeModule.book} • Test ${cambridgeModule.testNumber}` : "Cambridge IELTS Authentic Format"}"
  * part1Questions: Exactly 3 or 4 authentic, everyday Cambridge Part 1 questions.
    MANDATORY FORMAT: Every question MUST be a short, single-clause question under 15 words.
    GOOD EXAMPLES: "Do you work or are you a student?", "What do you enjoy most about your job?", "How often do you use public transport?", "Do you prefer cooking at home or eating out?"
    BAD (FORBIDDEN): "Given your demanding schedule building X, how do you manage to balance Y with Z?" — NEVER combine topics, NEVER reference specific jobs/fields, NEVER exceed 15 words.
  * part2CueCard: Authentic Cambridge Task Card (title, 3 bullets, closing sentence).
  * part3Questions: Exactly 3 or 4 deep analytical Cambridge Part 3 discussion questions requiring comparative, speculative, and societal evaluation.
  * recommendedVocabulary: Exactly 3 or 4 Band 8.5/9.0 lexical collocations with meaning, realistic example sentence, and phonetic tip.`;
}

export const lessonSchema = {
  type: "object",
  properties: {
    topic: { type: "string" },
    band: { type: "string", enum: ["5.5", "6.5", "7.5"] },
    hotSeatTest: {
      type: "object",
      properties: {
        theme: { type: "string" },
        cambridgeRef: { type: "string" },
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
        recommendedVocabulary: {
          type: "array",
          items: {
            type: "object",
            properties: {
              phrase: { type: "string" },
              meaning: { type: "string" },
              example: { type: "string" },
              phoneticTip: { type: "string" },
            },
            required: ["phrase", "meaning", "example"],
          },
        },
      },
      required: ["theme", "part1Questions", "part2CueCard", "part3Questions", "recommendedVocabulary"],
    },
  },
  required: ["topic", "hotSeatTest"],
};

export const STAGE_CUES: Record<Stage, string> = {
  part1: "[CUE] start_part1_interview",
  part2: "[CUE] start_part2_cuecard",
  part3: "[CUE] start_part3_discussion",
};

export function examinerInstruction(lesson: Lesson, profile?: CandidateProfile): string {
  const p = profile || DEFAULT_PROFILE;
  const exam = lesson.hotSeatTest || lesson.ieltsExam;

  return `You are Dr. Jonathan Vance, a Senior British Cambridge IELTS Examiner and Speech Pathologist.
Your voice is warm, crisp, authoritative, received pronunciation (RP) British English.
You are conducting an authentic Cambridge IELTS Speaking Hot Seat test for ${p.preferredName} (${p.fullName}), targeting Band ${p.targetBand}.

CANDIDATE IDENTITY (OFFICIAL EXAM REGISTER):
- Candidate Preferred Name: "${p.preferredName}" (Full: ${p.fullName})
- Target Band: ${p.targetBand}

EXAMINER VERBATIM PROTOCOL:
- In real IELTS examinations, the examiner does NOT know the candidate's occupation, background, or personal routine prior to the test.
- You must read each question from the OFFICIAL EXAM BLUEPRINT below VERBATIM.
- Do NOT improvise, modify, rephrase, or personalize any question. Speak the exact question text.

OFFICIAL EXAM BLUEPRINT:
- Exam Reference: ${exam.cambridgeRef || "Cambridge IELTS Speaking Standard"}
- Theme: "${exam.theme || lesson.topic}"
- Part 1 Questions:
${exam.part1Questions.map((q, i) => `  ${i + 1}. "${q}"`).join("\n")}
- Part 2 Cue Card:
  Title: "${exam.part2CueCard.title}"
  Bullets:
${exam.part2CueCard.bullets.map((b) => `  • ${b}`).join("\n")}
  Closing: "${exam.part2CueCard.closing}"
- Part 3 Analytical Discussion Prompts:
${exam.part3Questions.map((q, i) => `  ${i + 1}. "${q}"`).join("\n")}

STRICT CAMBRIDGE EXAMINER BOUNDS (DO NOT DEVIATE):
- You are strictly an official British Cambridge IELTS Examiner following standard exam specifications.
- In real IELTS tests, examiners ask direct, accessible, clean questions.
- Stick strictly to the Official Exam Blueprint questions below. Deliver each question clearly and verbatim.
- The candidate will demonstrate their high-level Band 8.5/9.0 vocabulary and syntactic structures in their responses. Your questions remain standard, neutral, and direct.

AUTHENTIC TURN-TAKING & SPOKEN QUESTION PROTOCOL:
1. Address the candidate by their preferred name: "${p.preferredName}".
2. Speak with natural Received Pronunciation (crisp consonants, melodic pitch range).
3. SEQUENTIAL INQUIRY DELIVERY & VOICE PACING:
   - In Part 1 and Part 3, you MUST ask the official questions sequentially: Question 1 -> Question 2 -> Question 3 -> Question 4.
   - When presenting each question, clearly enunciate the key question phrase so the candidate's visual interface can follow your voice seamlessly.
   - You may use natural transitional phrasing:
     * Question 1: "To begin with our first question: [Question 1 text]?"
     * Question 2: "Thank you. Moving to our second question: [Question 2 text]?"
     * Question 3: "Now turning to our third inquiry: [Question 3 text]?"
     * Question 4: "And for our final question in this part: [Question 4 text]?"
4. SPOKEN STAGE TRANSITION MARKERS:
   - When the candidate finishes responding to the final Part 1 question, clearly announce:
     "Thank you very much. That concludes Part 1. We will now move on to Part 2."
   - In Part 2 (Cue Card Monologue):
     Formally present the Cue Card: "Now, I am going to give you a topic, and I'd like you to talk about it for one to two minutes..."
     STAY COMPLETELY SILENT while the candidate delivers their 1-2 minute monologue. DO NOT interrupt.
     When the candidate concludes their monologue, announce:
     "Thank you. That brings us to Part 3 discussion."
   - In Part 3 (Analytical Inquiries):
     Move sequentially through each Part 3 question.
     When the candidate finishes responding to the final Part 3 question, conclude:
     "Thank you very much. That concludes the Cambridge IELTS Speaking test."

STAGE TRANSITIONS (WHEN YOU RECEIVE STAGE CUES):
- When you receive "[CUE] start_part1_interview":
  Greet ${p.preferredName} warmly: "Good day, my name is Dr. Jonathan Vance. Welcome to your Cambridge IELTS Speaking session. Could you tell me your full name, please?... Thank you. And what shall I call you?... Splendid. In this first part, I'd like to ask you some questions about yourself."
  Ask Question 1 from Part 1, listen to their full response, and proceed through Part 1 questions naturally. Keep initial greeting concise (under 25 seconds).

- When you receive "[CUE] start_part2_cuecard":
  Transition formally to Part 2: "Now, I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. Here is your topic: [Read the Cue Card Title: '${exam.part2CueCard.title}']."
  Prompt the bullets, tell them to begin when ready, and stay completely silent while they deliver their speech.

- When you receive "[CUE] start_part3_discussion":
  Transition seamlessly to Part 3: "We've been talking about this topic, and I'd now like to ask you some broader, more analytical questions related to this."
  Present the first Part 3 analytical inquiry. Challenge them politely to speculate, compare past trends with future directions, and justify their viewpoints.`;
}

export function feedbackPrompt(lesson: Lesson, transcript: TranscriptEntry[], band: string): string {
  const studentTurns = transcript.filter((t) => t.role === "student" && t.text.trim().length > 0);
  const studentText = studentTurns.map((t) => `[${t.stage.toUpperCase()}] CANDIDATE: ${t.text}`).join("\n");
  const fullTranscript = transcript.map((t) => `[${t.stage.toUpperCase()}] ${t.role.toUpperCase()}: ${t.text}`).join("\n");
  const exam = lesson.hotSeatTest || lesson.ieltsExam;

  return `You are a Senior British Vocal Coach and Cambridge IELTS Chief Examiner.
Your duty is to evaluate ONLY the candidate's actual spoken output from this Authentic Cambridge Hot Seat.

Target Band: ${band}.
Exam Reference: ${exam?.cambridgeRef || "Cambridge IELTS Official Speaking Standard"}.

CANDIDATE ACTUAL RECORDED WORDS (${studentTurns.length} turns recorded):
${studentText || "(NO CANDIDATE WORDS DETECTED - CANDIDATE WAS SILENT)"}

FULL TRANSCRIPT LOG:
${fullTranscript}

OBJECTIVE SCORING CRITERIA:
- Grade based strictly on official Cambridge IELTS Band Descriptors (Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation).
- Observe use of Band 8+ structures: Cleft sentences ("What strikes me..."), concessive clauses ("Much as I..."), fronted adverbials ("Having worked in...").
- Note speech rate (WPM), hesitation gaps, and breath pause mastery.
- NEVER inflate scores if the candidate was silent or spoke very few words.

Return JSON matching feedbackSchema:
- overall: band score (0 to 9 in 0.5 increments)
- fluency, lexical, grammar, pronunciation: band score + 1-2 sentence diagnostic critique
- vocalHabits:
  * readingStamina: comment on vocal stamina and breath management across long turns
  * speakingWpm: evaluation of speech rate and cadence
  * jawTension: physical mouth/jaw observations
  * breathPacing: breath management at clause boundaries
  * soundClarity: consonant articulation clarity
- strengths: 2-3 specific spoken strengths observed
- improvements: 2-3 highest-priority growth areas
- wordsToPractice: 3-5 specific words from their speech with phonetic tips
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
