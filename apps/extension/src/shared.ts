import { createBackup, HealthStoryBackup, PrivacyBucket, validateBackup } from "@healthstory/core";

export type QuickCapture = {
  id: string;
  kind: "body_signal" | "stress" | "medication" | "appointment_question" | "private_note";
  title: string;
  note: string;
  severity?: number;
  stressLevel?: number;
  helpedBy?: string;
  worsenedBy?: string;
  privacyBucket: PrivacyBucket;
  createdAt: string;
};

const storage = typeof chrome !== "undefined" && chrome.storage?.local;
const downloads = typeof chrome !== "undefined" && chrome.downloads;

export async function getCaptures(): Promise<QuickCapture[]> {
  if (!storage) return JSON.parse(localStorage.getItem("captures") || "[]");
  const value = await storage.get("captures");
  return Array.isArray(value.captures) ? (value.captures as QuickCapture[]) : [];
}

export async function setCaptures(captures: QuickCapture[]) {
  if (!storage) localStorage.setItem("captures", JSON.stringify(captures));
  else await storage.set({ captures });
}

export async function addCapture(capture: QuickCapture) {
  const captures = await getCaptures();
  captures.unshift(capture);
  await setCaptures(captures);
}

export function capturesToBackup(captures: QuickCapture[]): HealthStoryBackup {
  const now = new Date().toISOString();
  return createBackup({
    bodySignals: captures.filter((item) => item.kind === "body_signal").map((item) => ({
      id: item.id,
      title: item.title,
      category: "Quick capture",
      bodyArea: "",
      startDate: item.createdAt.slice(0, 10),
      status: "ongoing",
      worryLevel: item.severity ?? 0,
      defaultPrivacy: item.privacyBucket,
      notes: item.note,
      createdAt: item.createdAt,
      updatedAt: item.createdAt
    })),
    healthEntries: captures.filter((item) => item.kind === "body_signal").map((item) => ({
      id: `${item.id}-entry`,
      bodySignalId: item.id,
      entryDate: item.createdAt.slice(0, 10),
      symptom: item.title,
      severity: item.severity ?? 0,
      changeStatus: "new",
      location: "",
      duration: "",
      timeOfDay: "",
      trigger: "",
      helpedBy: item.helpedBy || "",
      worsenedBy: item.worsenedBy || "",
      notes: item.note,
      localStructuredSummary: `The user reported ${item.title} from a quick capture. This is not a diagnosis.`,
      privacyBucket: item.privacyBucket,
      createdAt: item.createdAt
    })),
    stressEntries: captures.filter((item) => item.kind === "stress" || item.kind === "private_note").map((item) => ({
      id: item.id,
      entryDate: item.createdAt.slice(0, 10),
      stressLevel: item.stressLevel ?? 0,
      mood: item.title,
      anxietyLevel: 0,
      sleepQuality: 0,
      energyLevel: 0,
      lifeEventNotes: item.kind === "stress" ? item.note : "",
      privateNotes: item.kind === "private_note" ? item.note : "",
      privacyBucket: item.privacyBucket,
      createdAt: item.createdAt
    })),
    medications: captures.filter((item) => item.kind === "medication").map((item) => ({
      id: item.id,
      name: item.title,
      dose: item.note,
      frequency: "",
      startDate: item.createdAt.slice(0, 10),
      reason: "Quick capture",
      sideEffects: "",
      active: true,
      privacyBucket: item.privacyBucket,
      createdAt: item.createdAt
    })),
    supplements: [],
    allergies: [],
    appointments: captures.filter((item) => item.kind === "appointment_question").map((item) => ({
      id: item.id,
      date: item.createdAt.slice(0, 10),
      providerName: "",
      clinicName: "",
      appointmentType: "Question",
      reason: item.title,
      questionsToAsk: item.note,
      thingsNotToForget: "",
      worriedAbout: "",
      outcomeNotes: "",
      testsOrdered: "",
      medicationChanges: "",
      referrals: "",
      followUpDate: "",
      privacyBucket: item.privacyBucket,
      createdAt: item.createdAt
    })),
    privacySettings: [],
    userPreferences: []
  }, "extension");
}

export async function exportCaptures() {
  const backup = capturesToBackup(await getCaptures());
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const filename = `healthstory-extension-backup-${new Date().toISOString().slice(0, 10)}.json`;
  if (downloads) await downloads.download({ url, filename, saveAs: true });
  else {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  }
}

export async function importBackupFile(file: File) {
  const result = validateBackup(JSON.parse(await file.text()));
  if (!result.ok) throw new Error(result.error);
  const imported: QuickCapture[] = [
    ...result.backup.data.bodySignals.map((item) => ({ id: item.id, kind: "body_signal" as const, title: item.title, note: item.notes || "", severity: item.worryLevel, privacyBucket: item.defaultPrivacy, createdAt: item.createdAt })),
    ...result.backup.data.stressEntries.map((item) => ({ id: item.id, kind: "stress" as const, title: item.mood, note: item.lifeEventNotes || item.privateNotes, stressLevel: item.stressLevel, privacyBucket: item.privacyBucket, createdAt: item.createdAt })),
    ...result.backup.data.medications.map((item) => ({ id: item.id, kind: "medication" as const, title: item.name, note: item.dose, privacyBucket: item.privacyBucket, createdAt: item.createdAt })),
    ...result.backup.data.appointments.map((item) => ({ id: item.id, kind: "appointment_question" as const, title: item.reason, note: item.questionsToAsk, privacyBucket: item.privacyBucket, createdAt: item.createdAt }))
  ];
  await setCaptures(imported);
  return imported.length;
}
