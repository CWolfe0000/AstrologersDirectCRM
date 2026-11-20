import type { IntakeForm, IntakeSection, IntakeSectionKind } from "@/lib/data/types";
import { uid } from "@/lib/utils";

/** The built-in parts of a form: their default heading and what they ask. */
export const SECTION_INFO: Record<Exclude<IntakeSectionKind, "question">, { label: string; help: string; describe: string }> = {
  birth: {
    label: "Your Birth Details",
    help: "Date, time and place of birth. If you’re not sure of the time, say how you know it or choose “I don’t know”.",
    describe: "Date, time (with how sure they are and where it comes from) and place of birth.",
  },
  contact: { label: "Contact Details", help: "", describe: "Preferred name, pronouns and phone number." },
  goals: { label: "What Would You Like to Explore?", help: "A few sentences is plenty.", describe: "An open question about what they’d like from the session." },
  lifeEvents: {
    label: "Significant Life Events",
    help: "Add the moments that shaped your life: a single date for events like a marriage or a death in the family, or a start and end for periods like living somewhere or a job.",
    describe: "Dated events (marriage, a death in the family) and periods (where they lived, a job, a relationship). These appear on your timeline.",
  },
  horary: {
    label: "Your Question",
    help: "Write the question as it came to you. The chart is cast for the moment you understood the question, so we’ve filled in now; change it if you asked it earlier.",
    describe: "The question, and the moment and place it was asked. A horary chart is created when they send it.",
  },
};

export const sectionLabel = (s: IntakeSection) => (s.kind === "question" ? s.label || "Question" : s.label || SECTION_INFO[s.kind].label);

const sec = (kind: IntakeSectionKind, extra: Partial<IntakeSection> = {}): IntakeSection => ({ id: uid("s"), kind, ...extra });
const q = (label: string, answer: IntakeSection["answer"], extra: Partial<IntakeSection> = {}): IntakeSection => ({ id: uid("s"), kind: "question", label, answer, ...extra });

/** Starting points. Each becomes the astrologer's own form, to change as they like. */
export const STARTER_FORMS: { key: string; title: string; description: string; build: () => Omit<IntakeForm, "id" | "updatedAt"> }[] = [
  {
    key: "new-client",
    title: "New Client",
    description: "Birth details, what they’d like to explore, and optional life events.",
    build: () => ({
      title: "New Client Intake",
      intro: "Thank you for booking. These few questions help me prepare so we can make the most of our time.",
      sections: [sec("birth", { required: true }), sec("contact"), sec("goals", { required: true }), sec("lifeEvents"), q("How did you hear about me?", "short")],
    }),
  },
  {
    key: "career",
    title: "Career Reading",
    description: "Their work situation, the decisions in front of them, and career milestones.",
    build: () => ({
      title: "Career Reading",
      intro: "A little about your working life helps me focus your reading.",
      sections: [
        sec("birth", { required: true }),
        sec("goals", { label: "What’s happening in your work life right now?", required: true }),
        q("Are you facing a particular decision?", "long"),
        q("What would you most like to know?", "choice", { options: ["Timing for a change", "Which direction suits me", "How to handle a current situation", "My vocation and strengths", "Something else"] }),
        sec("lifeEvents", { label: "Career Milestones", help: "Jobs, promotions, layoffs, graduations, businesses started or closed. A single date for an event, or a start and end for a job or a period." }),
      ],
    }),
  },
  {
    key: "relationship",
    title: "Relationship Reading",
    description: "Their question, their partner’s birth details if known, and relationship history.",
    build: () => ({
      title: "Relationship Reading",
      sections: [
        sec("birth", { required: true }),
        sec("goals", { label: "What would you like to understand about your relationship?", required: true }),
        q("Your partner’s birth date, time and place (if you have them)", "long"),
        sec("lifeEvents", { label: "Relationship History", help: "When you met, moved in, married, separated: a single date for an event, or a start and end for a relationship." }),
      ],
    }),
  },
  {
    key: "horary",
    title: "Horary Question",
    description: "The question and the moment it was asked. No birth details needed.",
    build: () => ({
      title: "Horary Question",
      intro: "Horary answers one specific question from the moment it’s asked.",
      sections: [sec("horary", { required: true }), q("Any background I should know?", "long")],
    }),
  },
  {
    key: "rectification",
    title: "Birth Time Rectification",
    description: "What they know of their birth time and as many dated events as they can give.",
    build: () => ({
      title: "Birth Time Rectification",
      intro: "Rectification works backward from the dates of your life’s turning points, so exact dates help most.",
      sections: [
        sec("birth", { required: true }),
        q("Where does the birth time you have come from?", "choice", { options: ["Birth certificate", "Hospital record", "A parent’s memory", "Baby book or family record", "I’m not sure"] }),
        q("Anything about the birth itself? (C-section, induced, premature, long labor)", "long"),
        sec("lifeEvents", { required: true, help: "As many as you can, with exact dates where you know them: marriages, children born, moves, accidents or surgeries, career changes, deaths of parents." }),
      ],
    }),
  },
  {
    key: "life-story",
    title: "Life Story",
    description: "Life events only, to send any time for more history.",
    build: () => ({ title: "Your Life Story", intro: "The moments that shaped your life help me read your chart in context.", sections: [sec("lifeEvents", { required: true })] }),
  },
];

export const newSection = sec;

const NO_FORMS: IntakeForm[] = [];
/** Store selector for the practice's forms (a stable empty list, so components don't re-render forever). */
export const selectIntakeForms = (s: { practitioner: { intakeForms?: IntakeForm[] } }) => s.practitioner.intakeForms ?? NO_FORMS;
