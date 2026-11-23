export type Category = "wisdom" | "roast" | "boost"
export type Mode = Category | "surprise"

export interface Fortune {
  id: string
  category: Category
  text: string
}

export interface CategoryMeta {
  label: string
  short: string
  /** Main accent used for the category's label, frame and particles. */
  color: string
  /** Lines the Oracle says in the dialogue box when this category is revealed. */
  dialogue: string[]
  /** Small reaction printed at the bottom of the fortune card. */
  reactions: string[]
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  wisdom: {
    label: "WISDOM UNLOCKED",
    short: "WISDOM",
    color: "#BBA3FF",
    dialogue: ["The pixels have spoken.", "Ancient truth, freshly rendered.", "Write that on a sticky note, mortal."],
    reactions: ["The Oracle strokes his beard knowingly.", "Old as the grid. Still true.", "+10 design sense acquired."],
  },
  roast: {
    label: "YOU'VE BEEN ROASTED",
    short: "ROAST",
    color: "#FF9D86",
    dialogue: ["This one might hurt a little.", "Brace your artboards.", "I say this with love. Mostly."],
    reactions: ["The Oracle is not sorry.", "Critical hit. -2 ego.", "Too real? Too real."],
  },
  boost: {
    label: "CREATIVE BOOST",
    short: "BOOST",
    color: "#C9FF70",
    dialogue: ["The creative gods approve.", "Go forth and prototype.", "Your cursor tingles with power."],
    reactions: ["+1 courage. Go make the weird thing.", "The pixels believe in you.", "Ship it before you overthink it."],
  },
}

export const THINKING_LINES = [
  "Interesting choice, mortal.",
  "The Figma spirits are restless.",
  "I have consulted the sacred layers.",
  "Hmm. So many unnamed frames...",
]

export const IDLE_LINE = "The pixels have spoken. Are you listening?"

export const FORTUNES: Fortune[] = [
  { id: "W-01", category: "wisdom", text: "Clarity is a feature. Decoration is a choice." },
  { id: "W-02", category: "wisdom", text: "A screen is finished when the next step feels obvious." },
  { id: "W-03", category: "wisdom", text: "Good hierarchy tells a story before anyone reads." },
  { id: "W-04", category: "wisdom", text: "Whitespace isn't empty. It's doing crowd control." },
  { id: "W-05", category: "wisdom", text: "Friction is sometimes a bug and sometimes a seatbelt." },
  { id: "W-06", category: "wisdom", text: "If the user needs a tour guide, revisit the map." },
  { id: "W-07", category: "wisdom", text: "Every extra choice asks the user to do more work." },
  { id: "W-08", category: "wisdom", text: "A beautiful dead end is still a dead end." },
  { id: "W-09", category: "wisdom", text: "Consistency makes exceptions worth noticing." },
  { id: "W-10", category: "wisdom", text: "A prototype is a question you can click." },
  { id: "W-11", category: "wisdom", text: "Don't design for the screenshot. Design for the moment after." },
  { id: "W-12", category: "wisdom", text: "The best microinteraction confirms, not distracts." },
  { id: "W-13", category: "wisdom", text: "Accessibility is part of the experience, not a setting." },
  { id: "W-14", category: "wisdom", text: "Error states are part of the happy path of real life." },
  { id: "W-15", category: "wisdom", text: "Sometimes the boldest design decision is removing something." },
  { id: "R-01", category: "roast", text: "Your button has three shadows and zero click handlers." },
  { id: "R-02", category: "roast", text: "Figma says Untitled because naming things is a premium skill." },
  { id: "R-03", category: "roast", text: "The client asked for minimal. Then sent 14 logos." },
  { id: "R-04", category: "roast", text: "One more variant and this button gets its own passport." },
  { id: "R-05", category: "roast", text: "You adjusted the padding by 2px. The universe noticed." },
  { id: "R-06", category: "roast", text: "Your design system has rules. Your newest screen has opinions." },
  { id: "R-07", category: "roast", text: "Auto layout is fine. It's your relationship with it that's complicated." },
  { id: "R-08", category: "roast", text: "User flow: Home → Confusion → Back button." },
  { id: "R-09", category: "roast", text: "Your stakeholder says Make it pop. The pixels have unionized." },
  { id: "R-10", category: "roast", text: "You opened the file for one quick fix. It's tomorrow." },
  { id: "R-11", category: "roast", text: "Your wireframe is clean because the real content hasn't arrived." },
  { id: "R-12", category: "roast", text: "Four designers, six comments, one innocent corner radius." },
  { id: "R-13", category: "roast", text: "That hero section is fighting the footer for main character." },
  { id: "R-14", category: "roast", text: "Your prototype works beautifully, unless somebody clicks it." },
  { id: "R-15", category: "roast", text: "Your layer is called Rectangle 284. It knows what it did." },
  { id: "B-01", category: "boost", text: "Make one brave version before the safe version." },
  { id: "B-02", category: "boost", text: "Ship the small thing. Let reality critique it." },
  { id: "B-03", category: "boost", text: "Your taste improves when you make things, not just save them." },
  { id: "B-04", category: "boost", text: "Start ugly. Make it honest. Then make it good." },
  { id: "B-05", category: "boost", text: "A weird idea deserves at least one prototype." },
  { id: "B-06", category: "boost", text: "Try the direction you're slightly scared to show." },
  { id: "B-07", category: "boost", text: "One finished experiment beats twelve perfect moodboards." },
  { id: "B-08", category: "boost", text: "Your next idea is hiding behind the first bad draft." },
  { id: "B-09", category: "boost", text: "Borrow a constraint. Build a personality." },
  { id: "B-10", category: "boost", text: "Curiosity is a better starting point than certainty." },
  { id: "B-11", category: "boost", text: "The interface doesn't need to be loud to be memorable." },
  { id: "B-12", category: "boost", text: "If you're stuck, change the question, not just the color." },
  { id: "B-13", category: "boost", text: "Build the version that makes you want to click twice." },
  { id: "B-14", category: "boost", text: "Make something for one real person before everyone." },
  { id: "B-15", category: "boost", text: "You don't need a new tool. You need a new attempt." },
]
