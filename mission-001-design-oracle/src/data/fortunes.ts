export type Topic = "work" | "love" | "life"
export type TopicMode = Topic | "surprise"
export type Tone = "roast" | "wisdom" | "hype"

export interface Fortune {
  id: string
  topic: Topic
  tone: Tone
  text: string
}

export const TOPICS: { value: TopicMode; label: string; short: string }[] = [
  { value: "work", label: "Work & Ambition", short: "Work" },
  { value: "love", label: "Love & Relationships", short: "Love" },
  { value: "life", label: "Life & Adulting", short: "Life" },
  { value: "surprise", label: "Surprise Me", short: "Surprise" },
]

export const TONES: { value: Tone; label: string; stamp: string; color: string }[] = [
  { value: "roast", label: "Roast Me", stamp: "ROASTED", color: "#db2777" },
  { value: "wisdom", label: "Give Me Wisdom", stamp: "WISDOM", color: "#7c3aed" },
  { value: "hype", label: "Hype Me Up", stamp: "HYPE", color: "#0d9488" },
]

export const TOPIC_NAMES: Record<Topic, string> = {
  work: "Work & Ambition",
  love: "Love & Relationships",
  life: "Life & Adulting",
}

export const TONE_META: Record<Tone, (typeof TONES)[number]> = Object.fromEntries(TONES.map((t) => [t.value, t])) as Record<
  Tone,
  (typeof TONES)[number]
>

/** What Tikku says in each part of the ritual. */
export const LINES = {
  idle: [
    "Step right up, traveller.",
    "What's weighing on you today?",
    "One coin. Unlimited opinions.",
    "I've seen things. Mostly receipts.",
  ],
  coin: ["Ooh, a coin!", "Ah. A customer.", "Payment accepted. Probably."],
  thinking: ["Consulting the gears...", "Hmm. Interesting.", "Crunching your destiny..."],
  delivered: {
    roast: ["Sorry. Not sorry.", "The machine never lies.", "I'd frame that one."],
    wisdom: ["Keep that one close.", "Ancient railway wisdom.", "Read it twice."],
    hype: ["GO GET 'EM!", "That's a winning ticket!", "You heard the machine!"],
  } satisfies Record<Tone, string[]>,
}

type Entry = [Topic, Tone, string[]]

const LIBRARY: Entry[] = [
  [
    "work",
    "roast",
    [
      "Your five-year plan currently depends on tomorrow's motivation.",
      "You have fourteen tabs open and the one you need is somehow none of them.",
      "You said \"quick call\" like you've never been on a call before.",
      "Your to-do list has become a museum of good intentions.",
      "You reply \"noted\" to things you will absolutely not remember.",
      "Your productivity system now needs its own productivity system.",
      "You've rewritten that email so many times it's become a different email.",
      "You're not procrastinating. You're \"building momentum.\" Since Tuesday.",
      "Your calendar is a game of Tetris and you are losing gracefully.",
    ],
  ],
  [
    "work",
    "wisdom",
    [
      "Being busy is not the same as moving forward.",
      "The task you keep avoiding is usually the one that matters.",
      "A clear \"no\" protects the \"yes\" that counts.",
      "Nobody remembers how long it took. They remember that it was good.",
      "Ask the obvious question. Half the room is hoping someone will.",
      "Reputations are built in the boring weeks.",
      "It's easier to improve something real than something imagined.",
      "Rest is part of the work, not a reward for finishing it.",
      "Small skills practised daily quietly turn into a career.",
    ],
  ],
  [
    "work",
    "hype",
    [
      "One small thing finished today is worth celebrating.",
      "You've solved harder problems than this one before lunch.",
      "Last year's version of you would be quietly impressed right now.",
      "Somewhere, an opportunity is looking for exactly your odd mix of skills.",
      "Send the idea. Worst case, it becomes a better idea.",
      "You're not behind. You're on a route with better scenery.",
      "Your first draft only needs to exist. Go make it exist.",
      "Learning slowly still beats everyone who never started.",
      "Today's tiny progress is tomorrow's \"how did you get so good at this?\"",
    ],
  ],
  [
    "love",
    "roast",
    [
      "You analysed that one-word reply like it was a government document.",
      "You've typed and deleted \"haha\" four times. Commit to the haha.",
      "You call it keeping your options open. Your options call it mixed signals.",
      "You checked who viewed your story, then pretended not to care. Twice.",
      "Your type is \"emotionally unavailable, but has great playlists.\"",
      "You've won shower arguments the other person doesn't know exist.",
      "You said \"I'm fine\" with the energy of a three-part documentary.",
      "Your group chat has heard this story more times than the person it's about.",
      "You're waiting for a sign. They've sent three. You left them on read.",
    ],
  ],
  [
    "love",
    "wisdom",
    [
      "Consistency tells you more than grand declarations.",
      "The right people won't make you audition for their attention.",
      "Say the kind thing out loud. Nobody can read appreciation through silence.",
      "A good relationship leaves room for both of you to keep growing.",
      "Clarity is uncomfortable for a moment. Confusion is uncomfortable for months.",
      "Notice how you feel after you see someone, not only during.",
      "Love isn't proven in big moments. It's maintained in small ones.",
      "You can't build trust with someone you're constantly decoding.",
      "Being chosen feels good. Choosing yourself feels steadier.",
    ],
  ],
  [
    "love",
    "hype",
    [
      "Your worth isn't waiting in somebody else's inbox.",
      "Someone out there would be lucky to hear your terrible jokes every day.",
      "You love loudly. That's a feature, not a flaw.",
      "The right person will find your \"too much\" exactly enough.",
      "Text a friend that you miss them. Make someone's whole afternoon.",
      "You're allowed to want a love that feels easy to breathe in.",
      "Your heart has had a few updates. It's running better than ever.",
      "Be the kind of person you're hoping to meet. It looks great on you.",
      "Every past heartbreak, you've survived. Your record is perfect.",
    ],
  ],
  [
    "life",
    "roast",
    [
      "You cleaned your room to avoid the task you were actually supposed to do.",
      "You bought a plant to feel responsible. The plant has concerns.",
      "Your sleep schedule is just vibes and a 2 a.m. video about octopuses.",
      "You own six water bottles and are still mildly dehydrated.",
      "You walked into the kitchen with purpose and left with a biscuit and no memory.",
      "Your \"quick nap\" had a season finale.",
      "You've saved 300 recipes and still eat the same three meals.",
      "Your budget spreadsheet is beautifully formatted and completely ignored.",
      "You'll start on Monday. Which Monday remains classified.",
    ],
  ],
  [
    "life",
    "wisdom",
    [
      "You are allowed to learn things after becoming an adult.",
      "Most problems shrink a little once you write them down.",
      "Future you is a real person. Be a bit kinder to them today.",
      "Nobody has it figured out. Some people are just better at folding laundry.",
      "Small routines carry you through big days.",
      "You may not need a new life. You might need a better Tuesday.",
      "Water, sleep and a short walk solve a surprising number of mysteries.",
      "It's okay to outgrow plans you made when you knew less.",
      "Ask for help early. It costs less than asking late.",
    ],
  ],
  [
    "life",
    "hype",
    [
      "You have survived every awkward first attempt so far.",
      "You paid a bill, replied to an email and drank water. Legend behaviour.",
      "Look at you, figuring out adulthood without a manual.",
      "Future you is already proud of the step you're about to take.",
      "Today counts, even if all you did was keep going.",
      "You're allowed to start over as many times as it takes.",
      "Your weird little routines are holding the whole operation together. Respect.",
      "The chai is hot, the day is new, and you're still the right person for it.",
      "Something good is on its way. Keep the platform clear.",
    ],
  ],
]

const TOPIC_CODE: Record<Topic, string> = { work: "W", love: "L", life: "A" }
const TONE_CODE: Record<Tone, string> = { roast: "R", wisdom: "W", hype: "H" }

export const FORTUNES: Fortune[] = LIBRARY.flatMap(([topic, tone, texts]) =>
  texts.map((text, i) => ({
    id: `${TOPIC_CODE[topic]}${TONE_CODE[tone]}-${String(i + 1).padStart(2, "0")}`,
    topic,
    tone,
    text,
  })),
)
