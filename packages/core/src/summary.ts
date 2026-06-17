import type { BodySignal, HealthEntry, StressEntry } from "./types";

const words = (values: string[]) =>
  values
    .flatMap((value) => value.split(/[,.;]/).map((part) => part.trim().toLowerCase()))
    .filter(Boolean);

const topTerms = (values: string[], fallback: string) => {
  const counts = new Map<string, number>();
  for (const term of words(values)) counts.set(term, (counts.get(term) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([term]) => term)
    .join(", ") || fallback;
};

export function generateEntrySummary(entry: HealthEntry) {
  return `The user reported ${entry.symptom || "a body signal"} with severity ${entry.severity}/10. They described it as ${entry.changeStatus}, with possible triggers including ${entry.trigger || "not specified"}. Helped by: ${entry.helpedBy || "not specified"}. Worse with: ${entry.worsenedBy || "not specified"}. This is not a diagnosis.`;
}

export function generateBodySignalSummary(signal: BodySignal | undefined, entries: HealthEntry[], stressEntries: StressEntry[]) {
  if (!signal || entries.length === 0) {
    return "No shareable entries were found for this period. This is not a diagnosis or medical advice.";
  }

  const severities = entries.map((entry) => entry.severity);
  const min = Math.min(...severities);
  const max = Math.max(...severities);
  const highStressDates = new Set(stressEntries.filter((entry) => entry.stressLevel >= 7).map((entry) => entry.entryDate));
  const stressOverlap = entries.filter((entry) => highStressDates.has(entry.entryDate)).length;
  const triggers = topTerms(entries.map((entry) => entry.trigger), "not consistently recorded");
  const helped = topTerms(entries.map((entry) => entry.helpedBy), "not consistently recorded");
  const worsened = topTerms(entries.map((entry) => entry.worsenedBy), "not consistently recorded");

  return `Across the selected period, the user reported ${signal.title} with severity ranging from ${min}/10 to ${max}/10 across ${entries.length} entries. Entries suggest symptoms were often connected with ${triggers}, sometimes improved with ${helped}, and were described as worse with ${worsened}. ${stressOverlap > 0 ? `${stressOverlap} entries occurred on days with stress at 7/10 or higher. ` : ""}This is not a diagnosis, but the pattern may be useful to discuss with a healthcare professional.`;
}
