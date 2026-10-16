/**
 * Authentic IELTS Speaking test question banks derived from Cambridge IELTS 15-19
 * and recent official test pools (2024-2026).
 */

export interface RealIeltsTopic {
  theme: string;
  part1Questions: string[];
  part2CueCard: {
    title: string;
    bullets: string[];
    closing: string;
  };
  part3Questions: string[];
}

export const REAL_IELTS_TOPIC_BANK: RealIeltsTopic[] = [
  {
    theme: "Technology & Artificial Intelligence",
    part1Questions: [
      "What kinds of technology or digital apps do you use most frequently every day?",
      "Do you think artificial intelligence will change how you study or do your work?",
      "Have you ever experienced digital fatigue or felt you spent too much time in front of screens?",
    ],
    part2CueCard: {
      title: "Describe an electronic device or application you found surprisingly useful",
      bullets: [
        "What the device or application is",
        "When and how you first started using it",
        "What specific functions or features you rely on",
      ],
      closing: "and explain why this technology has made a substantial difference to your routine.",
    },
    part3Questions: [
      "In what ways has rapid technological advancement reshaped personal communication among different generations?",
      "Do you believe automation will eliminate more jobs than it creates in the coming decades?",
      "How can governments ensure older citizens are not socially isolated by rapid digitization?",
    ],
  },
  {
    theme: "Home, Living Environment & Neighborhoods",
    part1Questions: [
      "Do you currently live in a house or an apartment, and what do you appreciate most about it?",
      "Which room in your home do you find the most relaxing to spend time in?",
      "How has your local neighborhood evolved since you were a child?",
    ],
    part2CueCard: {
      title: "Describe an ideal home or living space you would like to live in one day",
      bullets: [
        "Where this home would be located",
        "What architectural style and interior layout it would have",
        "Who you would like to live there with",
      ],
      closing: "and explain why this particular environment appeals so strongly to your lifestyle.",
    },
    part3Questions: [
      "Why are so many younger individuals moving into densely populated urban centers rather than rural areas?",
      "What are the main consequences of rising housing costs on social well-being?",
      "Do you think modern residential buildings sacrifice aesthetic character for economic efficiency?",
    ],
  },
  {
    theme: "Travel, Mobility & Global Exploration",
    part1Questions: [
      "Do you prefer visiting bustling modern cities or quiet natural landscapes when you travel?",
      "What is the most memorable mode of transport you have ever taken on a journey?",
      "How do you usually pass the time during long journeys or daily commutes?",
    ],
    part2CueCard: {
      title: "Describe a memorable journey you took that did not go completely as planned",
      bullets: [
        "Where you were travelling to and who was with you",
        "What unforeseen challenge or disruption occurred along the way",
        "How you managed to resolve the unexpected situation",
      ],
      closing: "and explain what valuable lesson you took away from that entire journey.",
    },
    part3Questions: [
      "How has international mass tourism influenced the preservation of cultural heritage around the globe?",
      "To what extent should eco-friendly sustainable tourism be promoted over conventional leisure travel?",
      "Will advancements in virtual reality ever diminish people's desire to physically travel abroad?",
    ],
  },
  {
    theme: "Work, Professional Ambitions & Career Choices",
    part1Questions: [
      "What profession or field of study are you currently pursuing, and why did you select it?",
      "What is one skill in your daily work or studies that required significant practice to master?",
      "Do you prefer collaborating closely in teams or working independently with autonomy?",
    ],
    part2CueCard: {
      title: "Describe a challenging decision you made regarding your education or career path",
      bullets: [
        "What the decision was and when you faced it",
        "What alternative paths or opinions you had to weigh",
        "Who helped or advised you while considering your options",
      ],
      closing: "and explain whether you believe it was ultimately the right choice in retrospect.",
    },
    part3Questions: [
      "Why are modern professionals increasingly switching career paths multiple times throughout their lives?",
      "Do employers value academic credentials or practical hands-on problem-solving skills more today?",
      "How can societies achieve a healthier work-life equilibrium in an always-connected digital economy?",
    ],
  },
  {
    theme: "Environmental Sustainability & Daily Habits",
    part1Questions: [
      "How do you manage household waste, recycling, or energy conservation at home?",
      "Did you learn about wildlife protection and environmental stewardship at school?",
      "Are you conscious of single-use plastics when you purchase groceries or takeout meals?",
    ],
    part2CueCard: {
      title: "Describe an environmental initiative or law that has improved your local area",
      bullets: [
        "What the initiative or regulation involved",
        "When and why it was introduced",
        "How people in your community reacted and adjusted to it",
      ],
      closing: "and explain what positive ecological impact it has generated over time.",
    },
    part3Questions: [
      "Should the responsibility for reversing climate damage lie primarily with individuals or large corporations?",
      "How effective are international summits in implementing enforceable environmental policies?",
      "In what ways can school curricula inspire genuine environmental responsibility in the younger generation?",
    ],
  },
  {
    theme: "Human Relationships, Mentors & Society",
    part1Questions: [
      "Do you maintain long-standing friendships from childhood, or do your circles evolve quickly?",
      "What qualities do you cherish most in a trustworthy confidant or close colleague?",
      "How do you prefer to resolve misunderstandings with people you care about?",
    ],
    part2CueCard: {
      title: "Describe an experienced person whose guidance or character you deeply respect",
      bullets: [
        "Who this individual is and how you know them",
        "What particular philosophy, wisdom, or habit they demonstrated",
        "A specific situation where their mentorship guided you",
      ],
      closing: "and explain why their personal example left such an enduring impression on your worldview.",
    },
    part3Questions: [
      "Why is intergenerational dialogue between seniors and youth frequently strained in modern societies?",
      "Can online communities foster authentic emotional intimacy comparable to face-to-face interaction?",
      "How has the societal perception of family responsibilities shifted over the past generation?",
    ],
  },
];
