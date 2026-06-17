export type PrivacyBucket =
  | "shareable"
  | "ask_each_time"
  | "not_at_this_time"
  | "never_share"
  | "emergency_only";

export interface UserPreferences {
  id: string;
  name: string;
  timezone: string;
  onboardingComplete: boolean;
  lastBackupAt?: string;
  createdAt: string;
}

export interface BodySignal {
  id: string;
  title: string;
  category: string;
  bodyArea: string;
  startDate: string;
  status: "ongoing" | "occasional" | "resolved";
  worryLevel: number;
  defaultPrivacy: PrivacyBucket;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthEntry {
  id: string;
  bodySignalId: string;
  entryDate: string;
  symptom: string;
  severity: number;
  changeStatus: "better" | "worse" | "same" | "new";
  location: string;
  duration: string;
  timeOfDay: string;
  trigger: string;
  helpedBy: string;
  worsenedBy: string;
  notes: string;
  localStructuredSummary: string;
  privacyBucket: PrivacyBucket;
  createdAt: string;
}

export interface StressEntry {
  id: string;
  entryDate: string;
  stressLevel: number;
  mood: string;
  anxietyLevel: number;
  sleepQuality: number;
  energyLevel: number;
  lifeEventNotes: string;
  privateNotes: string;
  privacyBucket: PrivacyBucket;
  createdAt: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  startDate: string;
  stopDate?: string;
  reason: string;
  sideEffects: string;
  active: boolean;
  privacyBucket: PrivacyBucket;
  createdAt: string;
}

export interface Supplement {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  startDate: string;
  stopDate?: string;
  reason: string;
  noticedEffect: string;
  active: boolean;
  privacyBucket: PrivacyBucket;
  createdAt: string;
}

export interface Allergy {
  id: string;
  allergen: string;
  allergyType: "medication" | "food" | "environmental" | "other";
  reaction: string;
  severity: "mild" | "moderate" | "severe" | "unknown";
  notes: string;
  privacyBucket: PrivacyBucket;
  createdAt: string;
}

export interface Appointment {
  id: string;
  date: string;
  providerName: string;
  clinicName: string;
  appointmentType: string;
  reason: string;
  questionsToAsk: string;
  thingsNotToForget: string;
  worriedAbout: string;
  outcomeNotes: string;
  testsOrdered: string;
  medicationChanges: string;
  referrals: string;
  followUpDate: string;
  privacyBucket: PrivacyBucket;
  createdAt: string;
}

export interface ShareReport {
  id: string;
  title: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  includedSections: string[];
  excludedSections: string[];
  format: "pdf" | "preview";
  createdAt: string;
}

export interface HealthStoryBackup {
  app: "HealthStory AI";
  version: string;
  exportedAt: string;
  source: "web" | "extension";
  data: {
    bodySignals: BodySignal[];
    healthEntries: HealthEntry[];
    stressEntries: StressEntry[];
    medications: Medication[];
    supplements: Supplement[];
    allergies: Allergy[];
    appointments: Appointment[];
    privacySettings: unknown[];
    userPreferences: UserPreferences[];
  };
}
