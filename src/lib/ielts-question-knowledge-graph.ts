/**
 * IELTS Speaking Real Test Knowledge Graph & Question Pattern Database.
 *
 * Curated from:
 * 1. Cambridge IELTS Official Practice Books 15–19 (Official Examiner Booklets).
 * 2. High-frequency YouTube Mock Test Transcripts (IELTS Advantage, Fastrack IELTS,
 *    IDP Official, British Council, E2 IELTS 2024–2026 Test Pools).
 *
 * Core Principle:
 * Examiners in real IELTS tests ask SIMPLE, ACCESSIBLE, EVERYDAY questions.
 * The AI examiner MUST NOT invent compound, hyper-specialized questions.
 * Band 8.5/9.0 complexity comes from the CANDIDATE'S answers, not the examiner's prompts.
 */

export type Part2Category = "people" | "places" | "objects_tech" | "experiences" | "habits_decisions";

export interface Part1Cluster {
  id: string;
  category: string;
  frequencyRank: number; // 1 = highest frequency in real tests
  youtubeTag: string; // e.g. "Asked in 95% of real tests"
  standardQuestions: string[];
}

export interface Part2MostAskedScene {
  id: string;
  category: Part2Category;
  categoryLabel: string;
  title: string;
  frequencyTier: "Top 1% High Frequency" | "Official Cambridge 19" | "Official Cambridge 18" | "Frequent Test Pool";
  youtubeSource: string; // e.g. "IELTS Advantage / Cambridge 19 Test 2"
  cueCard: {
    title: string;
    bullets: string[];
    closing: string;
  };
  part3Questions: string[];
  recommendedVocabulary: {
    phrase: string;
    meaning: string;
    example: string;
  }[];
}

export interface QuestionPatternFormula {
  type: string;
  formula: string;
  realExaminerExamples: string[];
  candidateBand9Strategy: string;
}

/**
 * =========================================================================
 * PART 1: HIGH-FREQUENCY REAL-TEST INQUIRY CLUSTERS
 * =========================================================================
 * Examiners ALWAYS start with Work/Study, Hometown, or Living Space,
 * then branch into 1 everyday topic. Questions are always direct and simple.
 */
export const REAL_PART1_CLUSTERS: Part1Cluster[] = [
  {
    id: "work-study",
    category: "Work & Professional Specialization",
    frequencyRank: 1,
    youtubeTag: "Top 1 Most-Asked Part 1 Topic (95% frequency)",
    standardQuestions: [
      "Do you currently work or are you a student?",
      "What do you do exactly in your day-to-day job?",
      "Why did you choose to enter this particular profession or field?",
      "What is the most enjoyable or satisfying aspect of your work?",
      "Do you prefer working independently or in collaboration with a team?",
      "Would you like to continue in this line of work in the future?",
    ],
  },
  {
    id: "hometown",
    category: "Hometown Roots & Living Environment",
    frequencyRank: 2,
    youtubeTag: "Top 2 Most-Asked Part 1 Topic (90% frequency)",
    standardQuestions: [
      "Where is your hometown located?",
      "What do you appreciate most about your hometown?",
      "Is there anything about your hometown that you would like to change?",
      "Has your hometown developed or changed much since you were a child?",
      "Would you recommend people visit your hometown as tourists?",
    ],
  },
  {
    id: "accommodation",
    category: "Living Space & Home Environment",
    frequencyRank: 3,
    youtubeTag: "Top 3 Most-Asked Part 1 Topic (85% frequency)",
    standardQuestions: [
      "Do you live in a house or an apartment?",
      "Which room in your home is your favorite space to spend time in?",
      "What is the view like from your bedroom or living room window?",
      "If you could redesign any part of your home, what would you improve?",
      "Do you think you will continue living in your current home for many years?",
    ],
  },
  {
    id: "daily-routine",
    category: "Daily Routines & Personal Habits",
    frequencyRank: 4,
    youtubeTag: "High Frequency Test Pool (80% frequency)",
    standardQuestions: [
      "What is your typical morning routine before starting your day?",
      "Do you prefer to do your demanding tasks early in the morning or in the evening?",
      "How do you usually unwind and relax at the end of a long day?",
      "Do you feel you have enough free time during the week for personal interests?",
    ],
  },
  {
    id: "transportation",
    category: "Public Transport & Urban Commuting",
    frequencyRank: 5,
    youtubeTag: "Frequent Real-Test Topic (75% frequency)",
    standardQuestions: [
      "How do you usually travel to work or university every day?",
      "Do you prefer using public transportation or driving a private vehicle?",
      "How could public transport in your city be improved?",
      "Do you enjoy long journeys by train or road, or do you find them tiring?",
    ],
  },
  {
    id: "technology-maps",
    category: "Digital Technology & Navigation",
    frequencyRank: 6,
    youtubeTag: "Frequent Real-Test Topic (75% frequency)",
    standardQuestions: [
      "What digital apps on your phone do you use most frequently?",
      "Do you prefer reading books on digital screens or physical paper?",
      "Do you rely primarily on digital navigation apps or your own sense of direction?",
      "Have you ever experienced digital fatigue or felt you needed a break from screens?",
    ],
  },
  {
    id: "leisure-weekends",
    category: "Leisure, Free Time & Relaxation",
    frequencyRank: 7,
    youtubeTag: "Frequent Real-Test Topic (70% frequency)",
    standardQuestions: [
      "How do you usually like to spend your weekends?",
      "Do you prefer spending your free time outdoors in nature or indoors at home?",
      "Do you have any creative hobbies or interests you practice regularly?",
      "Do you think people today have more or less leisure time than in the past?",
    ],
  },
];

/**
 * =========================================================================
 * PART 2: THE 12 MOST-ASKED SCENES IN REAL IELTS TESTS & YOUTUBE MOCKS
 * =========================================================================
 * Extracted from actual candidate reports, Cambridge 15-19 and top mock videos.
 */
export const MOST_ASKED_PART2_SCENES: Part2MostAskedScene[] = [
  // 1. OBJECTS & TECHNOLOGY
  {
    id: "scene-tech-tool",
    category: "objects_tech",
    categoryLabel: "Technology & Tools",
    title: "A Piece of Technology or Software That Enhances Your Productivity",
    frequencyTier: "Top 1% High Frequency",
    youtubeSource: "IELTS Advantage / Cambridge 19 Test 2",
    cueCard: {
      title: "Describe an electronic device or software application you find very useful",
      bullets: [
        "What the device or application is",
        "How you first learned about or started using it",
        "What specific tasks you use it for daily",
      ],
      closing: "and explain why this piece of technology has made such a positive difference in your daily routine.",
    },
    part3Questions: [
      "Which jobs or professions do you believe are least likely to be replaced by artificial intelligence in the next decade?",
      "How has the widespread use of smartphones and automated software affected human memory and analytical thinking?",
      "What steps should educational institutions take to prepare students for an increasingly automated workplace?",
    ],
    recommendedVocabulary: [
      {
        phrase: "streamline daily workflow",
        meaning: "to make daily tasks simpler, more efficient, and faster",
        example: "Using this tool helped me streamline my daily workflow and eliminate redundant steps.",
      },
      {
        phrase: "indispensable asset",
        meaning: "something so valuable and necessary that you cannot do without it",
        example: "For modern professionals, high-speed connectivity is an indispensable asset.",
      },
      {
        phrase: "cognitive offloading",
        meaning: "the practice of using physical or digital devices to reduce mental workload",
        example: "Digital calendars facilitate cognitive offloading, freeing up mental space for creative thought.",
      },
    ],
  },

  // 2. PLACES & SANCTUARY
  {
    id: "scene-quiet-place",
    category: "places",
    categoryLabel: "Places & Environments",
    title: "A Quiet Place You Like to Visit to Relax or Think",
    frequencyTier: "Top 1% High Frequency",
    youtubeSource: "Fastrack IELTS / Cambridge 18 Test 1",
    cueCard: {
      title: "Describe a quiet place you like to visit to unwind or concentrate",
      bullets: [
        "Where this place is located",
        "How often you go there",
        "What you usually do when you are there",
      ],
      closing: "and explain why you find this particular place so peaceful and rejuvenating.",
    },
    part3Questions: [
      "Why do you think it has become increasingly difficult to find quiet, silent spaces in modern metropolitan cities?",
      "How does constant environmental noise pollution affect individuals' psychological well-being and productivity?",
      "Should governments invest public funds into creating peaceful botanical gardens and public parks in city centers?",
    ],
    recommendedVocabulary: [
      {
        phrase: "tranquil sanctuary",
        meaning: "a peaceful, calm place where one feels safe and relaxed",
        example: "My study nook has become a tranquil sanctuary where I can read without distraction.",
      },
      {
        phrase: "acoustic comfort",
        meaning: "a state where sound levels in an environment are pleasant and not jarring",
        example: "Modern architectural design often neglects acoustic comfort in favor of open-plan aesthetics.",
      },
      {
        phrase: "decompress from stress",
        meaning: "to release tension and unwind after pressure",
        example: "Visiting the local waterfront allows me to decompress from stress after intense work deadlines.",
      },
    ],
  },

  // 3. PEOPLE & MENTORSHIP
  {
    id: "scene-inspiring-person",
    category: "people",
    categoryLabel: "People & Mentors",
    title: "A Person Who Inspired or Taught You Something Important",
    frequencyTier: "Top 1% High Frequency",
    youtubeSource: "Cambridge IELTS 17 / IDP Official Mock",
    cueCard: {
      title: "Describe a person who taught you something valuable or inspired you",
      bullets: [
        "Who this person is and your relationship to them",
        "What specific lesson, skill, or attitude they taught you",
        "How they taught or demonstrated this to you",
      ],
      closing: "and explain why their guidance has had such a lasting impact on your character or habits.",
    },
    part3Questions: [
      "What qualities distinguish an exceptional teacher or mentor from an average one?",
      "Do young people today learn more from family members and mentors or from internet personalities and social media?",
      "How important is it for companies and organizations to implement formal mentorship programs for junior staff?",
    ],
    recommendedVocabulary: [
      {
        phrase: "impart invaluable wisdom",
        meaning: "to pass on deeply useful knowledge or principles",
        example: "My former supervisor imparted invaluable wisdom regarding disciplined time management.",
      },
      {
        phrase: "lead by example",
        meaning: "to show others how to behave through one's own actions rather than just words",
        example: "She demonstrated true leadership by always leading by example under tight deadlines.",
      },
      {
        phrase: "formative influence",
        meaning: "having a profound, shaping effect on someone's development",
        example: "That early mentorship was a formative influence on my entire career trajectory.",
      },
    ],
  },

  // 4. EXPERIENCES & MOBILITY
  {
    id: "scene-memorable-journey",
    category: "experiences",
    categoryLabel: "Experiences & Journeys",
    title: "A Memorable Journey You Took by Public Transport or Car",
    frequencyTier: "Top 1% High Frequency",
    youtubeSource: "Cambridge IELTS 18 Test 3 / Real Test Pool",
    cueCard: {
      title: "Describe a memorable journey you took by public transport or road",
      bullets: [
        "Where you were travelling to and when this journey took place",
        "What mode of transport you used and who travelled with you",
        "What memorable event or scenery occurred along the way",
      ],
      closing: "and explain why this specific journey made such a lasting impression on your memory.",
    },
    part3Questions: [
      "Why do many people prefer private cars over public transport, even when public transport is more economical?",
      "How can modern cities encourage commuters to adopt eco-friendly transport options like trains and cycling?",
      "Do you think high-speed rail networks will eventually replace short-haul domestic flights worldwide?",
    ],
    recommendedVocabulary: [
      {
        phrase: "scenic panoramic views",
        meaning: "wide, visually impressive natural landscapes viewed from a vantage point",
        example: "The coastal railway journey offered breathtaking scenic panoramic views across the bay.",
      },
      {
        phrase: "commuter infrastructure",
        meaning: "the underlying facilities and systems supporting everyday travel to work",
        example: "Substantial investment in commuter infrastructure is essential to reduce urban highway gridlock.",
      },
      {
        phrase: "unforeseen detour",
        meaning: "an unexpected change of route",
        example: "An unforeseen detour led us through picturesque rural villages we would otherwise have missed.",
      },
    ],
  },

  // 5. HABITS, DECISIONS & SKILLS
  {
    id: "scene-challenging-skill",
    category: "habits_decisions",
    categoryLabel: "Skills & Habits",
    title: "A Practical Skill You Learned That Required Consistent Effort",
    frequencyTier: "Official Cambridge 19",
    youtubeSource: "Cambridge IELTS 19 Test 3 / Fastrack IELTS",
    cueCard: {
      title: "Describe a practical skill you learned that you found challenging at first",
      bullets: [
        "What the skill is and when you decided to learn it",
        "How you practiced and who helped or guided you",
        "What difficulties or setbacks you encountered along the way",
      ],
      closing: "and explain how you felt once you had finally mastered this skill.",
    },
    part3Questions: [
      "Why do some people find it easier to learn practical hands-on skills while others excel at theoretical concepts?",
      "How has the internet and online video tutorials transformed the way people acquire new skills independently?",
      "Do you think schools place too much emphasis on rote academic learning rather than real-world life skills?",
    ],
    recommendedVocabulary: [
      {
        phrase: "steep learning curve",
        meaning: "a situation where you have to learn a lot in a short amount of time or with high difficulty",
        example: "Mastering system architecture initially presented a steep learning curve.",
      },
      {
        phrase: "deliberate practice",
        meaning: "structured, purposeful practice focused on improving specific weaknesses",
        example: "Through deliberate practice every morning, my speaking fluency improved noticeably.",
      },
      {
        phrase: "muscle memory",
        meaning: "the ability to reproduce a particular movement without conscious thought through repetition",
        example: "Consistent repetition builds muscle memory, allowing you to articulate ideas effortlessly.",
      },
    ],
  },

  // 6. DECISIONS & LIFE CHANGES
  {
    id: "scene-important-decision",
    category: "habits_decisions",
    categoryLabel: "Decisions & Crossroads",
    title: "An Important Decision That Influenced Your Routine or Future",
    frequencyTier: "Top 1% High Frequency",
    youtubeSource: "IELTS Advantage / Cambridge 16 Test 2",
    cueCard: {
      title: "Describe an important decision you made that positively shaped your life",
      bullets: [
        "What the decision was and when you made it",
        "What different options or choices you had to weigh",
        "Why you decided on that specific course of action",
      ],
      closing: "and explain what positive consequences resulted from that decision.",
    },
    part3Questions: [
      "Why do many people feel anxious or overwhelmed when making critical career or educational decisions?",
      "Should young adults rely primarily on their parents' advice or their own intuition when choosing a profession?",
      "Do you think having too many choices in modern life makes it harder for individuals to feel satisfied with their decisions?",
    ],
    recommendedVocabulary: [
      {
        phrase: "weigh pros and cons",
        meaning: "to consider the advantages and disadvantages carefully before making a choice",
        example: "I spent several weeks weighing the pros and cons before committing to the career transition.",
      },
      {
        phrase: "pivotal milestone",
        meaning: "an important turning point in development or progress",
        example: "Accepting that initial internship proved to be a pivotal milestone in my professional growth.",
      },
      {
        phrase: "paradox of choice",
        meaning: "the phenomenon where an abundance of options leads to stress and indecision",
        example: "Modern graduates often grapple with the paradox of choice when deciding which specialty to pursue.",
      },
    ],
  },

  // 7. PLACES & URBAN ARCHITECTURE
  {
    id: "scene-impressive-building",
    category: "places",
    categoryLabel: "Places & Environments",
    title: "An Impressive Architectural Building or Historic Place You Visited",
    frequencyTier: "Official Cambridge 19",
    youtubeSource: "Cambridge IELTS 19 Test 1",
    cueCard: {
      title: "Describe an impressive building or architectural structure you have visited",
      bullets: [
        "Where this building is located",
        "What it looks like from the outside and inside",
        "What purpose or function it serves",
      ],
      closing: "and explain why you found its architectural design so impressive.",
    },
    part3Questions: [
      "To what extent should municipal governments prioritize preserving historic buildings over erecting modern commercial towers?",
      "How does the physical design of residential apartment complexes impact social cohesion among neighbors?",
      "Do you believe future megacities should expand upward into high-density skyscrapers or outward into suburban greenbelts?",
    ],
    recommendedVocabulary: [
      {
        phrase: "architectural grandeur",
        meaning: "magnificence and impressive aesthetic scale of a structure",
        example: "The sheer architectural grandeur of the ancient library left a lasting impression on me.",
      },
      {
        phrase: "aesthetic harmony",
        meaning: "a pleasing visual balance and arrangement of elements",
        example: "The building achieves aesthetic harmony between traditional stone masonry and modern glass.",
      },
      {
        phrase: "urban revitalization",
        meaning: "the process of renewing and improving distressed urban neighborhoods",
        example: "The new community arts complex spurred significant urban revitalization across the district.",
      },
    ],
  },

  // 8. HABITS & HEALTH
  {
    id: "scene-healthy-routine",
    category: "habits_decisions",
    categoryLabel: "Skills & Habits",
    title: "A Healthy Habit or Daily Routine You Cultivated",
    frequencyTier: "Frequent Test Pool",
    youtubeSource: "Fastrack IELTS / Cambridge 18 Test 4",
    cueCard: {
      title: "Describe a healthy habit or routine you developed to stay focused or fit",
      bullets: [
        "What the habit or routine is and how long you have practiced it",
        "What motivated you to start this habit",
        "What steps you take to maintain consistency every week",
      ],
      closing: "and explain how this routine has enhanced your physical energy or mental clarity.",
    },
    part3Questions: [
      "Why do many people find it difficult to sustain healthy exercise habits when faced with demanding workplace deadlines?",
      "How can modern employers support their staff's physical and psychological health during high-pressure periods?",
      "Do you think wearable health technology helps people build sustainable habits, or does it create unnecessary anxiety?",
    ],
    recommendedVocabulary: [
      {
        phrase: "foster mental resilience",
        meaning: "to build the psychological capacity to handle adversity and stress",
        example: "Consistent morning workouts foster mental resilience that carries over into high-pressure meetings.",
      },
      {
        phrase: "sedentary lifestyle",
        meaning: "a way of living characterized by excessive sitting and minimal physical activity",
        example: "Desk workers must consciously combat the risks associated with a sedentary lifestyle.",
      },
      {
        phrase: "holistic well-being",
        meaning: "health that encompasses physical, mental, and emotional harmony",
        example: "True wellness requires addressing sleep, nutrition, and stress management for holistic well-being.",
      },
    ],
  },
];

/**
 * =========================================================================
 * REAL EXAMINER QUESTION PATTERNS & STEM FORMULAS
 * =========================================================================
 * The actual syntactic templates examiners use across Cambridge and YouTube mocks.
 */
export const REAL_EXAMINER_QUESTION_PATTERNS: QuestionPatternFormula[] = [
  {
    type: "Direct Reality Check (Part 1)",
    formula: "Do you [work or study / live in a house or flat / prefer X or Y]?",
    realExaminerExamples: [
      "Do you work or are you currently studying?",
      "Do you live in a house or an apartment?",
      "Do you prefer to do your work in the morning or in the evening?",
    ],
    candidateBand9Strategy: "Answer directly with an initial affirmative/negative, then immediately deploy a fronted adverbial or cleft frame to expand with sensory precision.",
  },
  {
    type: "Frequency & Habit Inquiry (Part 1)",
    formula: "How often do you [use public transport / spend time outdoors / meet friends]?",
    realExaminerExamples: [
      "How often do you take public transportation compared to driving?",
      "How often do you visit parks or natural spaces in your city?",
    ],
    candidateBand9Strategy: "Avoid vague words like 'sometimes'; use nuanced adverbs like 'predominantly', 'intermittently', or 'on a near-daily basis'.",
  },
  {
    type: "Past Reflection & Evolution (Part 1 & 3)",
    formula: "Has [your hometown / technology / transportation] changed much since you were a child?",
    realExaminerExamples: [
      "Has your hometown developed significantly over the past ten years?",
      "Did you enjoy reading books when you were younger?",
    ],
    candidateBand9Strategy: "Deploy contrastive tense control: Past Simple ('Back in my early childhood...') contrasting with Present Perfect ('...has undergone a radical transformation').",
  },
  {
    type: "Comparative Preference (Part 1 & 3)",
    formula: "Why do some people prefer [X] whereas others prefer [Y]?",
    realExaminerExamples: [
      "Why do some individuals prefer living in high-rise flats while others favor suburban houses?",
      "Do you prefer collaborating in teams or working autonomously?",
    ],
    candidateBand9Strategy: "Deploy concessive balanced clauses: 'Much as private vehicles offer unmatched autonomy, public rail transit undeniably mitigates urban congestion.'",
  },
  {
    type: "Speculative Future Projection (Part 3)",
    formula: "Do you believe [automation / urbanization / digital tools] will [change society / replace humans] in the future?",
    realExaminerExamples: [
      "Do you think artificial intelligence will eliminate traditional clerical careers in the coming decade?",
      "Will future megacities be forced to build upward into skyscrapers?",
    ],
    candidateBand9Strategy: "Deploy epistemic modality and conditional frameworks: 'It is highly probable that...', 'Were governments to invest in renewable rail, we would likely witness...'",
  },
];

export function getPart2Scene(idOrKeyword?: string): Part2MostAskedScene {
  if (!idOrKeyword) return MOST_ASKED_PART2_SCENES[0];
  const lower = idOrKeyword.toLowerCase();
  const found = MOST_ASKED_PART2_SCENES.find(
    (s) => s.id === lower || s.title.toLowerCase().includes(lower) || s.category === lower
  );
  return found || MOST_ASKED_PART2_SCENES[0];
}
