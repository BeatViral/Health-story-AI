import type { Allergy, Appointment, BodySignal, HealthEntry, Medication, StressEntry, Supplement, UserPreferences } from "./types";
import { generateEntrySummary } from "./summary";

const now = new Date().toISOString();

export const demoPreferences: UserPreferences = {
  id: "pref-demo-user",
  name: "Demo User",
  timezone: "Australia/Sydney",
  onboardingComplete: true,
  createdAt: now
};

export const demoBodySignal: BodySignal = {
  id: "signal-burning-feet",
  title: "Burning feet",
  category: "Nerve-like sensation",
  bodyArea: "Feet / lower legs",
  startDate: "2026-04-20",
  status: "ongoing",
  worryLevel: 7,
  defaultPrivacy: "shareable",
  notes: "Burning sensation in both feet with changes across sleep, stress and sitting.",
  createdAt: now,
  updatedAt: now
};

const entryBase = {
  bodySignalId: demoBodySignal.id,
  location: "Both feet",
  duration: "Several hours",
  timeOfDay: "Afternoon",
  privacyBucket: "shareable" as const,
  createdAt: now
};

const demoHealthEntryDrafts: Array<Omit<HealthEntry, "localStructuredSummary">> = [
  {
    ...entryBase,
    id: "entry-1",
    entryDate: "2026-05-05",
    symptom: "Burning sensation in both feet",
    severity: 6,
    changeStatus: "worse" as const,
    trigger: "sitting after lunch",
    helpedBy: "walking",
    worsenedBy: "long sitting",
    notes: "Pain 6/10 after lunch. Burning sensation in both feet."
  },
  {
    ...entryBase,
    id: "entry-2",
    entryDate: "2026-05-11",
    symptom: "Less sensitivity in feet",
    severity: 4,
    changeStatus: "better" as const,
    trigger: "not clear",
    helpedBy: "better sleep, magnesium",
    worsenedBy: "poor sleep",
    notes: "Pain 4/10 in morning. Slept better. Took magnesium."
  },
  {
    ...entryBase,
    id: "entry-3",
    entryDate: "2026-05-19",
    symptom: "Burning after high stress day",
    severity: 7,
    changeStatus: "worse" as const,
    trigger: "high stress, poor sleep",
    helpedBy: "rest",
    worsenedBy: "stress, poor sleep",
    notes: "Concerned about nerve irritation."
  },
  {
    ...entryBase,
    id: "entry-4",
    entryDate: "2026-06-02",
    symptom: "Warm feet with cold sensation",
    severity: 3,
    changeStatus: "better" as const,
    trigger: "not clear",
    helpedBy: "movement and rest",
    worsenedBy: "sitting",
    notes: "Feet warm, but sensation felt cold."
  }
];

export const demoHealthEntries: HealthEntry[] = demoHealthEntryDrafts.map((entry) => ({
  ...entry,
  localStructuredSummary: generateEntrySummary({ ...entry, localStructuredSummary: "" })
}));

export const demoStressEntries: StressEntry[] = [
  {
    id: "stress-1",
    entryDate: "2026-05-05",
    stressLevel: 8,
    mood: "Overloaded",
    anxietyLevel: 7,
    sleepQuality: 3,
    energyLevel: 4,
    lifeEventNotes: "Family pressure",
    privateNotes: "Felt stretched thin.",
    privacyBucket: "never_share",
    createdAt: now
  },
  {
    id: "stress-2",
    entryDate: "2026-05-11",
    stressLevel: 5,
    mood: "Steadier",
    anxietyLevel: 4,
    sleepQuality: 7,
    energyLevel: 6,
    lifeEventNotes: "Better after walking",
    privateNotes: "",
    privacyBucket: "never_share",
    createdAt: now
  },
  {
    id: "stress-3",
    entryDate: "2026-05-19",
    stressLevel: 7,
    mood: "Anxious",
    anxietyLevel: 8,
    sleepQuality: 3,
    energyLevel: 3,
    lifeEventNotes: "Symptoms felt stronger",
    privateNotes: "Private worry note.",
    privacyBucket: "never_share",
    createdAt: now
  }
];

export const demoMedications: Medication[] = [
  { id: "med-bcomplex", name: "B-complex", dose: "Stopped", frequency: "Previously daily", startDate: "2026-04-01", stopDate: "2026-05-01", reason: "Reviewing possible symptom relationship", sideEffects: "Unsure", active: false, privacyBucket: "shareable", createdAt: now }
];

export const demoSupplements: Supplement[] = [
  { id: "sup-magnesium", name: "Magnesium", dose: "Night", frequency: "Daily", startDate: "2026-05-01", reason: "Sleep and muscle support", noticedEffect: "May help sleep", active: true, privacyBucket: "shareable", createdAt: now },
  { id: "sup-ala", name: "Alpha lipoic acid", dose: "As directed", frequency: "Daily", startDate: "2026-05-10", reason: "Discussed for nerve-like symptoms", noticedEffect: "Still observing", active: true, privacyBucket: "shareable", createdAt: now },
  { id: "sup-turmeric", name: "Turmeric", dose: "Capsule", frequency: "Occasional", startDate: "2026-05-12", reason: "Inflammation support", noticedEffect: "Unsure", active: true, privacyBucket: "shareable", createdAt: now }
];

export const demoAllergies: Allergy[] = [
  { id: "allergy-penicillin", allergen: "Penicillin", allergyType: "medication", reaction: "Reaction unknown", severity: "unknown", notes: "Family/user record says avoid until clarified.", privacyBucket: "shareable", createdAt: now }
];

export const demoAppointments: Appointment[] = [
  {
    id: "appt-gp",
    date: "2026-06-24",
    providerName: "GP",
    clinicName: "Local clinic",
    appointmentType: "Review",
    reason: "Questions about nerve symptoms, blood sugar, B6, inflammation and circulation.",
    questionsToAsk: "Could blood sugar, B6, inflammation or circulation be relevant? What tests should be discussed?",
    thingsNotToForget: "Burning feet started around April 20 and changes with sleep, stress and sitting.",
    worriedAbout: "Nerve irritation",
    outcomeNotes: "",
    testsOrdered: "",
    medicationChanges: "",
    referrals: "",
    followUpDate: "",
    privacyBucket: "shareable",
    createdAt: now
  }
];
