import { C } from "./theme";

export type Axis = "X" | "Y";
export type Raw = -3 | -1 | 1 | 3;
export type Kind = "today" | "target";

export type Item = {
  id: number;
  axis: Axis;
  theme: string;
  /** The HIGH pole is rendered on the LEFT (anti position-bias). */
  flip: boolean;
  stem: string;
  /** Low pole of the axis — X: collectivism · Y: integration */
  low: string;
  /** High pole of the axis — X: individualism · Y: fragmentation */
  high: string;
};

export const ITEMS: Item[] = [
  // ── AXIS X — Collectivism ↔ Individualism
  {
    id: 1,
    axis: "X",
    theme: "Recognition",
    flip: true,
    stem: "When we present a project's results outside the team, what we mainly highlight is…",
    low: "The team as a whole, even if individual contributions are less visible.",
    high: "The people who led the topic, even if the other contributions are less visible.",
  },
  {
    id: 2,
    axis: "X",
    theme: "Helping out",
    flip: false,
    stem: "A colleague is stuck and needs several hours of my help. I need those same hours to meet my own commitment. Usually, I…",
    low: "Give that colleague the time needed to move forward, even if I have to postpone my own delivery.",
    high: "Finish my own work, even if that colleague stays blocked longer.",
  },
  {
    id: 3,
    axis: "X",
    theme: "Versatility and specialisation",
    flip: false,
    stem: "To develop the team's skills, we favour…",
    low: "Versatility: everyone can do a bit of everything, the team holds when someone is away, but nobody has time to go very deep in one field.",
    high: "Specialisation: everyone builds real expertise, even if a topic slows down when the person who owns it is away.",
  },
  {
    id: 4,
    axis: "X",
    theme: "Accountability",
    flip: true,
    stem: "When a project does not deliver the expected results, what usually happens is…",
    low: "The team reviews the decisions together and agrees on adjustments, even if nobody has to personally answer for what went wrong.",
    high: "The person who led the topic takes responsibility in front of the others, even if that is uncomfortable.",
  },
  {
    id: 5,
    axis: "X",
    theme: "Quality",
    flip: false,
    stem: "Before a piece of work leaves the team, we favour…",
    low: "A review by a colleague, even if it delays sending it out.",
    high: "Sending it out under the responsibility of the person who prepared it, with a review on request, even if some oversights are harder to catch.",
  },
  {
    id: 6,
    axis: "X",
    theme: "Unpopular tasks",
    flip: true,
    stem: "When a necessary task is unpopular and nobody is in charge of it, it is usually…",
    low: "Picked up by someone who volunteers, even if it is often the same people.",
    high: "Assigned after looking at how to share the workload, even if that delays the start of the task.",
  },

  // ── AXIS Y — Integration ↔ Fragmentation
  {
    id: 7,
    axis: "Y",
    theme: "Group tools",
    flip: false,
    stem: "When a Group tool or practice meets a team need badly, our first reflex is to…",
    low: "Raise the need so that the common solution evolves, even if we have to live with its limits in the meantime.",
    high: "Adapt the way we work to meet the need right away, even if our practice then differs from the other teams'.",
  },
  {
    id: 8,
    axis: "Y",
    theme: "Pace",
    flip: true,
    stem: "A project could start, but the expert we need to inform the first choices is unavailable. Usually, we…",
    low: "Wait until that expert is available, even if we lose several weeks on the schedule.",
    high: "Start on the basis of assumptions, even if we have to revisit some choices when that expert joins.",
  },
  {
    id: 9,
    axis: "Y",
    theme: "Reuse",
    flip: false,
    stem: "When we create a solution that could also serve other teams, we build it…",
    low: "So that other teams can reuse it later — a template, a documented method, a component — even if it takes far more time than our own need justifies.",
    high: "For our own need right now, which is much faster, even if the next team starts again from scratch.",
  },
  {
    id: 10,
    axis: "Y",
    theme: "Right to fail",
    flip: true,
    stem: "When a misjudgement has had significant consequences, we tend to…",
    low: "Change our shared practices, even if it adds a step to projects where the risk is low.",
    high: "Adjust how we work on that project and share the lesson, even if it is then applied differently from one project to the next.",
  },
  {
    id: 11,
    axis: "Y",
    theme: "How finished",
    flip: false,
    stem: "A delivery is 80 % ready. The rest still needs time. We…",
    low: "Wait until it is complete, even if the people waiting for it keep working without it for weeks.",
    high: "Make it available right away, even if some of them hit problems in the first weeks.",
  },
  {
    id: 12,
    axis: "Y",
    theme: "Stopping",
    flip: true,
    stem: "A project has been running for several months. The expected benefits have dropped significantly, but the business team is still counting on the delivery. Usually, we…",
    low: "See the project through to keep our commitment, even if it takes time that could serve other priorities.",
    high: "Propose to the business team that we stop the project to free up time, even if that means revisiting a commitment they were counting on.",
  },
];

/**
 * Rendering order only — never affects scoring.
 * Interleaved so the two axes are not perceptible as consecutive runs.
 * Change the order here and nowhere else.
 */
export const DISPLAY_ORDER = [1, 7, 2, 8, 3, 9, 4, 10, 5, 11, 6, 12];

export const ORDERED_ITEMS: Item[] = DISPLAY_ORDER.map((id) => {
  const item = ITEMS.find((i) => i.id === id);
  if (!item) throw new Error(`DISPLAY_ORDER references unknown item ${id}`);
  return item;
});

export const SCALE: { v: Raw; label: string }[] = [
  { v: -3, label: "◀ Strongly" },
  { v: -1, label: "◀ Somewhat" },
  { v: 1, label: "Somewhat ▶" },
  { v: 3, label: "Strongly ▶" },
];

export const RAW_VALUES: Raw[] = [-3, -1, 1, 3];

export type ZoneKey = "water" | "fire" | "earth" | "air";

export const WORLDS: Record<
  ZoneKey,
  {
    emoji: string;
    name: string;
    tagline: string;
    sub: string;
    color: string;
    axes: string;
    desc: string;
  }
> = {
  water: {
    emoji: "💧",
    name: "Water",
    tagline: "The world that nurtures and connects",
    sub: "Humans Come First",
    color: C.water,
    axes: "Collectivism · Fragmentation",
    desc: "A culture built on collective meaning, solidarity and agile structures. The team as a community first, an organisation second.",
  },
  fire: {
    emoji: "🔥",
    name: "Fire",
    tagline: "The world that burns the rules",
    sub: "Innovation Rules",
    color: C.fire,
    axes: "Individualism · Fragmentation",
    desc: "A culture of individual autonomy in a lightly constrained environment. Expertise, initiative and fast experimentation drive it.",
  },
  earth: {
    emoji: "🌍",
    name: "Earth",
    tagline: "The world that anchors and protects",
    sub: "Companies Care",
    color: C.earth,
    axes: "Collectivism · Integration",
    desc: "A culture combining collective responsibility with institutional solidity. A trusted team with lasting, dependable impact.",
  },
  air: {
    emoji: "💨",
    name: "Air",
    tagline: "The world that is invisible yet everywhere",
    sub: "Corporate is King",
    color: C.air,
    axes: "Individualism · Integration",
    desc: "A culture of individual performance inside a strong, structured organisation. Excellence and institutional strength drive it.",
  },
};

/** √(4² + 4²) — the longest possible change vector on a 1–5 × 1–5 grid. */
export const MAX_VECTOR = Math.hypot(4, 4);
