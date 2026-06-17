import type { PrivacyBucket } from "./types";

export const privacyBuckets: Record<PrivacyBucket, { label: string; tone: string }> = {
  shareable: { label: "Shareable", tone: "green" },
  ask_each_time: { label: "Ask me each time", tone: "blue" },
  not_at_this_time: { label: "Not at this time", tone: "amber" },
  never_share: { label: "Never share", tone: "purple" },
  emergency_only: { label: "Emergency-only", tone: "orange" }
};

export const privateBuckets: PrivacyBucket[] = [
  "ask_each_time",
  "not_at_this_time",
  "never_share",
  "emergency_only"
];
