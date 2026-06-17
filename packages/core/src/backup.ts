import type { HealthStoryBackup } from "./types";

export function createBackup(data: HealthStoryBackup["data"], source: "web" | "extension" = "web"): HealthStoryBackup {
  return {
    app: "HealthStory AI",
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    source,
    data
  };
}

export function validateBackup(value: unknown): { ok: true; backup: HealthStoryBackup } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Backup file is not a JSON object." };
  const backup = value as Partial<HealthStoryBackup>;
  if (backup.app !== "HealthStory AI") return { ok: false, error: "This is not a HealthStory AI backup." };
  if (!backup.version) return { ok: false, error: "Backup version is missing." };
  if (!backup.data || typeof backup.data !== "object") return { ok: false, error: "Backup data is missing." };

  const required = [
    "bodySignals",
    "healthEntries",
    "stressEntries",
    "medications",
    "supplements",
    "allergies",
    "appointments",
    "privacySettings",
    "userPreferences"
  ] as const;

  for (const key of required) {
    if (!Array.isArray(backup.data[key])) return { ok: false, error: `Backup data array "${key}" is missing.` };
  }

  return { ok: true, backup: backup as HealthStoryBackup };
}

export function backupCounts(backup: HealthStoryBackup) {
  return {
    bodySignals: backup.data.bodySignals.length,
    healthEntries: backup.data.healthEntries.length,
    stressEntries: backup.data.stressEntries.length,
    medications: backup.data.medications.length,
    supplements: backup.data.supplements.length,
    allergies: backup.data.allergies.length,
    appointments: backup.data.appointments.length
  };
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
