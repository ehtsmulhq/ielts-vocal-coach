export interface CambridgeTestModule {
  id: string;
  book: string; // e.g. "Cambridge 19"
  testNumber: number; // 1, 2, 3, 4
  title: string;
  theme: string;
  part1Topics: string[];
  part1Questions: string[];
  part2CueCard: {
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

export const CAMBRIDGE_TEST_MODULES: CambridgeTestModule[] = [
  {
    id: "cam-19-test-1",
    book: "Cambridge IELTS 19",
    testNumber: 1,
    title: "Urban Spaces, Modern Architecture & Community Living",
    theme: "Urbanization, Architectural Heritage & Living Ergonomics",
    part1Topics: ["Hometown", "Neighborhoods", "Public Parks"],
    part1Questions: [
      "Let's talk about your hometown. What is the most scenic or attractive part of your town?",
      "Do people in your country prefer living in modern high-rise apartments or traditional detached houses?",
      "How important are public parks and green spaces in residential urban areas?",
    ],
    part2CueCard: {
      title: "Describe an impressive building or architectural structure you have visited",
      bullets: [
        "Where this building is situated",
        "What it looks like from the outside and inside",
        "What purpose or function it serves",
      ],
      closing: "and explain why you found this particular architectural design so impressive.",
    },
    part3Questions: [
      "To what extent should governments preserve historical architecture rather than demolishing it to build modern infrastructure?",
      "How does the physical design of residential apartment complexes influence social interaction among neighbors?",
      "Do you believe future megacities will be forced to build upward into skyscrapers, or outward into rural suburbs?",
    ],
    recommendedVocabulary: [
      {
        phrase: "architectural grandeur",
        meaning: "splendor and impressive scale of a building",
        example: "The architectural grandeur of the cathedral immediately caught my attention.",
      },
      {
        phrase: "urban sprawl",
        meaning: "the uncontrolled expansion of urban areas",
        example: "Rapid urban sprawl has swallowed up much of the surrounding green belt.",
      },
      {
        phrase: "ergonomic residential design",
        meaning: "living spaces designed for human comfort and efficiency",
        example: "Modern apartments prioritize ergonomic residential design to maximize limited square footage.",
      },
    ],
  },
  {
    id: "cam-19-test-2",
    book: "Cambridge IELTS 19",
    testNumber: 2,
    title: "Artificial Intelligence, Automation & Workplace Evolution",
    theme: "Technological Transformation, Digital Ergonomics & Future Careers",
    part1Topics: ["Work & Study", "Computer Usage", "Screen Time & Focus"],
    part1Questions: [
      "Do you work or are you currently studying?",
      "What digital tools or software do you rely on most heavily in your daily routine?",
      "Do you find it difficult to maintain deep focus when working in front of digital screens?",
    ],
    part2CueCard: {
      title: "Describe an artificial intelligence tool or computer program that enhances your productivity",
      bullets: [
        "What kind of tool or program it is",
        "How you first discovered or started using it",
        "What specific tasks or workflows you use it for",
      ],
      closing: "and explain how this technology has influenced your efficiency and daily workflow.",
    },
    part3Questions: [
      "Which professions or skill sets do you think are least susceptible to being automated by artificial intelligence in the next decade?",
      "How can educational institutions adapt their curricula to ensure young graduates remain competitive in an AI-driven economy?",
      "Is there a genuine risk that reliance on automated cognitive tools will erode human analytical thinking and memory?",
    ],
    recommendedVocabulary: [
      {
        phrase: "paradigm shift",
        meaning: "a fundamental change in approach or underlying assumptions",
        example: "Generative AI represents a paradigm shift in how knowledge workers create content.",
      },
      {
        phrase: "streamline complex workflows",
        meaning: "make complicated processes simpler and more efficient",
        example: "These software pipelines streamline complex workflows that previously took days.",
      },
      {
        phrase: "human-in-the-loop oversight",
        meaning: "retaining human supervision over automated systems",
        example: "High-stakes medical and legal decisions will always require human-in-the-loop oversight.",
      },
    ],
  },
  {
    id: "cam-18-test-1",
    book: "Cambridge IELTS 18",
    testNumber: 1,
    title: "Environmental Sustainability & Climate Solutions",
    theme: "Ecological Conservation, Renewable Energy & Public Policy",
    part1Topics: ["Weather Patterns", "Recycling Habits", "Outdoor Recreation"],
    part1Questions: [
      "What is your favorite type of weather, and how does it influence your daily routine?",
      "Do you consciously recycle household waste or try to minimize single-use plastics?",
      "Have you noticed any noticeable changes in local weather patterns over the past several years?",
    ],
    part2CueCard: {
      title: "Describe an environmental initiative, law, or campaign that you believe is effective",
      bullets: [
        "What the initiative or campaign involves",
        "Where and how it was introduced",
        "What actions individuals or organizations must take",
      ],
      closing: "and explain why you think this initiative has succeeded in protecting the natural environment.",
    },
    part3Questions: [
      "Do you believe the primary responsibility for curbing global emissions lies with large corporations or individual citizens?",
      "How can governments incentivize private businesses to invest in renewable clean energy rather than fossil fuels?",
      "To what extent can technological innovation alone solve environmental crises without fundamental lifestyle changes?",
    ],
    recommendedVocabulary: [
      {
        phrase: "ecological footprint",
        meaning: "the impact of human activities measured in natural resources consumed",
        example: "Urban citizens are striving to reduce their ecological footprint through public transit.",
      },
      {
        phrase: "carbon neutrality",
        meaning: "achieving a balance between carbon emissions and carbon absorption",
        example: "Several progressive nations have pledged to achieve carbon neutrality by 2040.",
      },
      {
        phrase: "collective stewardship",
        meaning: "shared responsible management of resources",
        example: "Preserving marine biodiversity demands collective international stewardship.",
      },
    ],
  },
  {
    id: "cam-18-test-2",
    book: "Cambridge IELTS 18",
    testNumber: 2,
    title: "Health, Nutrition & Stress Inoculation",
    theme: "Physical Well-being, Work-Life Cadence & Mental Resilience",
    part1Topics: ["Morning Habits", "Physical Exercise", "Home Cooking"],
    part1Questions: [
      "What do you typically do in the first hour after waking up in the morning?",
      "Do you prefer exercising alone or taking part in group sports with friends?",
      "How often do you cook meals at home from fresh ingredients compared to ordering takeaway?",
    ],
    part2CueCard: {
      title: "Describe a positive health habit or wellness routine you adopted in recent times",
      bullets: [
        "What the habit or routine involves",
        "When and why you decided to start doing it",
        "How difficult or easy it was to establish into your schedule",
      ],
      closing: "and explain the physical and psychological benefits you have experienced from this habit.",
    },
    part3Questions: [
      "Why do you think so many modern professionals struggle to maintain a balanced sleep schedule and healthy diet?",
      "Should municipal governments impose higher taxes on ultra-processed junk foods to promote public health?",
      "What role does psychological stress play in physical illness, and how can workplaces mitigate burnout?",
    ],
    recommendedVocabulary: [
      {
        phrase: "sedentary lifestyle",
        meaning: "a way of living that involves little to no physical activity",
        example: "Desk-bound knowledge jobs often inadvertently foster a sedentary lifestyle.",
      },
      {
        phrase: "mental clarity and cognitive vigor",
        meaning: "sharp mental focus and physical alertness",
        example: "Consistent morning cardiovascular exercise dramatically boosts cognitive vigor.",
      },
      {
        phrase: "workplace burnout",
        meaning: "state of chronic physical and emotional exhaustion caused by work",
        example: "Establishing clear boundaries after working hours is paramount to combat workplace burnout.",
      },
    ],
  },
  {
    id: "cam-17-test-1",
    book: "Cambridge IELTS 17",
    testNumber: 1,
    title: "Travel, Global Mobility & Cross-Cultural Immersion",
    theme: "International Relocation, Eco-Tourism & Cultural Heritage",
    part1Topics: ["Public Transit", "Maps & Navigation", "Visiting Unfamiliar Places"],
    part1Questions: [
      "How often do you take public transportation in your city compared to private vehicles?",
      "Do you rely primarily on digital map apps on your phone or your sense of direction when exploring new areas?",
      "What do you enjoy most about traveling to destinations with cultures distinctly different from your own?",
    ],
    part2CueCard: {
      title: "Describe a quiet or remote destination you would like to retreat to for relaxation",
      bullets: [
        "Where this destination is located",
        "How you first heard about or discovered it",
        "What natural landscape or surroundings it features",
      ],
      closing: "and explain why you feel this particular destination would provide genuine mental peace.",
    },
    part3Questions: [
      "How has the phenomenon of overtourism impacted the daily quality of life for residents of popular historical cities?",
      "What are the major psychological benefits and personal growth opportunities associated with living abroad for several years?",
      "Will the expansion of virtual reality ever reduce the human desire to travel physically to foreign landmarks?",
    ],
    recommendedVocabulary: [
      {
        phrase: "unspoiled natural scenery",
        meaning: "landscape untouched or undamaged by human commercial development",
        example: "The coastal highlands boast miles of unspoiled natural scenery.",
      },
      {
        phrase: "broaden one's worldview",
        meaning: "expand one's perspective on life and foreign cultures",
        example: "Living independently overseas is the quickest way to broaden one's worldview.",
      },
      {
        phrase: "sustainable eco-tourism",
        meaning: "tourism directed toward natural environments to support conservation",
        example: "Local communities thrive when sustainable eco-tourism replaces commercial resort chains.",
      },
    ],
  },
  {
    id: "cam-17-test-2",
    book: "Cambridge IELTS 17",
    testNumber: 2,
    title: "Creative Expression, Arts & Cultural Preservation",
    theme: "Traditional Crafts, Literary Arts & Aesthetic Education",
    part1Topics: ["Reading Habits", "Cinema & Movies", "Music & Relaxation"],
    part1Questions: [
      "Do you prefer reading printed physical books or digital e-books on a tablet screen?",
      "What genre of film or documentary do you find most intellectually stimulating?",
      "How does listening to instrumental music influence your mood and concentration?",
    ],
    part2CueCard: {
      title: "Describe a creative person (an author, artist, filmmaker, or craftsman) whose work you admire",
      bullets: [
        "Who this person is and what medium they work in",
        "What kind of artistic creations or works they produce",
        "When you first became acquainted with their work",
      ],
      closing: "and explain why their creative vision leaves such a lasting impression on you.",
    },
    part3Questions: [
      "Should state education systems place equal financial emphasis on creative arts and STEM subjects?",
      "In an era of mass industrial factory manufacturing, what is the enduring value of traditional handmade crafts?",
      "Can artificial intelligence truly possess authentic creative originality, or does it merely recombine human precedents?",
    ],
    recommendedVocabulary: [
      {
        phrase: "artistic ingenuity",
        meaning: "cleverness, originality, and skill in creative work",
        example: "The director's artistic ingenuity transformed a simple script into a masterpiece.",
      },
      {
        phrase: "cultural heritage preservation",
        meaning: "protecting historical monuments, folklore, and indigenous crafts",
        example: "UNESCO initiatives play a crucial role in cultural heritage preservation.",
      },
      {
        phrase: "evocative prose",
        meaning: "writing that brings strong images and emotions to mind",
        example: "Her novels are celebrated globally for their evocative prose and character depth.",
      },
    ],
  },
  {
    id: "cam-16-test-1",
    book: "Cambridge IELTS 16",
    testNumber: 1,
    title: "Interpersonal Communication & Mentorship",
    theme: "Social Cohesion, Advice-Giving & Generational Dialogue",
    part1Topics: ["Social Gatherings", "Phone Conversations", "Friendship Dynamics"],
    part1Questions: [
      "Do you prefer communicating with close friends via instant text messages or voice/video calls?",
      "How do you usually spend time when catching up with long-time friends?",
      "Is it easy for you to strike up conversations with people you have never met before?",
    ],
    part2CueCard: {
      title: "Describe an occasion when you gave valuable advice to a friend, colleague, or family member",
      bullets: [
        "Who you gave the advice to and what their situation was",
        "What specific counsel or recommendations you shared with them",
        "Why you felt qualified or compelled to help them",
      ],
      closing: "and explain what the outcome was after they acted upon your advice.",
    },
    part3Questions: [
      "Why do young adults often feel more comfortable seeking guidance from online peers rather than older family members?",
      "What distinguishes constructive, empathetic feedback from unhelpful criticism in a professional workplace?",
      "Has the rise of digital social media enriched human friendships or made interpersonal connections more superficial?",
    ],
    recommendedVocabulary: [
      {
        phrase: "empathic listening",
        meaning: "paying attention to someone with genuine compassion and emotional understanding",
        example: "Effective mentorship begins with empathic listening rather than rushed solutions.",
      },
      {
        phrase: "intergenerational dialogue",
        meaning: "meaningful conversation between older and younger generations",
        example: "Fostering intergenerational dialogue bridges cultural divides inside modern families.",
      },
      {
        phrase: "nurture lasting relationships",
        meaning: "care for and sustain close bonds over many years",
        example: "Despite geographical distances, genuine friends make conscious efforts to nurture lasting relationships.",
      },
    ],
  },
];

/**
 * Functional spoken language for higher bands (written for this app, Cambridge-style)
 */
export const CAMBRIDGE_FUNCTIONAL_FRAMES = [
  {
    category: "Cleft Sentences (Information Packaging & Emphasis)",
    formula: "What strikes me / fascinates me about [X] is...",
    examples: [
      "What strikes me most about urban infrastructure is how rapidly digital mobility is reshaping city centers.",
      "What I find particularly compelling about my current field is the balance between abstract mathematics and real-world implementation.",
      "What primarily drives this societal shift is the desire for greater autonomy and work-life flexibility.",
    ],
  },
  {
    category: "Fronted Adverbial Participle Clauses (Syntactic Flexibility)",
    formula: "Having [verb-ed] / Given the demands of [X], ...",
    examples: [
      "Having grown up in a bustling coastal seaport, I have always possessed an innate affinity for maritime trade.",
      "Given the relentless pace of software modernization, one must cultivate continuous learning as a daily habit.",
      "Having navigated both traditional corporate offices and remote work, I firmly believe hybrid arrangements offer the best balance.",
    ],
  },
  {
    category: "Concessive & Contrast Structures (Sophisticated Nuance)",
    formula: "Much as I appreciate [X], it cannot be denied that [Y]...",
    examples: [
      "Much as I appreciate the undeniable convenience of fast food delivery, the long-term nutritional consequences are troubling.",
      "Notwithstanding the initial steep learning curve, mastering cloud architecture has been immensely fulfilling.",
      "Albeit an expensive endeavor, investing in high-speed rail invariably catalyzes regional economic revitalization.",
    ],
  },
  {
    category: "Speculative & Hypothesis Discourse Markers (Part 3 Analytical Depth)",
    formula: "It is entirely conceivable that in the foreseeable future, ...",
    examples: [
      "It is entirely conceivable that within the coming decade, automated diagnostic algorithms will outpace human triage.",
      "Looking at current consumer trajectories, one could plausibly hypothesize that physical brick-and-mortar storefronts will become boutique showrooms.",
      "While it is difficult to forecast with absolute precision, the prevailing evidence strongly points toward decentralized energy grids.",
    ],
  },
];
