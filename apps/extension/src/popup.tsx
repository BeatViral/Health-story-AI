import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { PrivacyBucket, privacyBuckets } from "@healthstory/core";
import { addCapture, exportCaptures, getCaptures, QuickCapture } from "./shared";
import "./styles.css";

const tabs: Array<[QuickCapture["kind"], string]> = [
  ["body_signal", "Body Signal"],
  ["stress", "Stress"],
  ["medication", "Medication"],
  ["appointment_question", "Question"],
  ["private_note", "Private Note"]
];

function App() {
  const [tab, setTab] = useState<QuickCapture["kind"]>("body_signal");
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getCaptures().then((items) => setCount(items.length));
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await addCapture({
      id: crypto.randomUUID(),
      kind: tab,
      title: String(form.get("title") || form.get("mood") || "Quick capture"),
      note: String(form.get("note") || ""),
      severity: Number(form.get("severity") || 0),
      stressLevel: Number(form.get("stressLevel") || 0),
      helpedBy: String(form.get("helpedBy") || ""),
      worsenedBy: String(form.get("worsenedBy") || ""),
      privacyBucket: form.get("privacyBucket") as PrivacyBucket,
      createdAt: new Date().toISOString()
    });
    event.currentTarget.reset();
    setCount((value) => value + 1);
    setStatus("Saved locally in this extension. Export a backup to move entries into the full HealthStory app.");
  };

  const defaultPrivacy = tab === "stress" || tab === "private_note" ? "never_share" : "shareable";

  return <main><header><strong>HealthStory Quick Capture</strong><p>Anything your body wants you to notice right now?</p></header><nav>{tabs.map(([value, label]) => <button className={tab === value ? "active" : ""} onClick={() => setTab(value)} key={value}>{label}</button>)}</nav><form onSubmit={submit}>{tab === "body_signal" && <><Input name="title" label="Body Signal title" /><Input name="severity" label="Severity 0-10" type="range" min="0" max="10" defaultValue="5" /><Input name="note" label="What changed?" /><Input name="helpedBy" label="What helped?" /><Input name="worsenedBy" label="What made it worse?" /></>}{tab === "stress" && <><Input name="stressLevel" label="Stress 0-10" type="range" min="0" max="10" defaultValue="5" /><Input name="mood" label="Mood" /><Input name="note" label="Quick note" /></>}{tab === "medication" && <><Input name="title" label="Name" /><Input name="note" label="Dose or note" /></>}{tab === "appointment_question" && <><Input name="title" label="Related Body Signal" /><Input name="note" label="Question" /></>}{tab === "private_note" && <Input name="note" label="Private note" />}<label>Privacy bucket<select name="privacyBucket" defaultValue={defaultPrivacy}>{Object.entries(privacyBuckets).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label><button className="primary">Save to HealthStory</button></form><footer><p>{count} local captures</p><button onClick={exportCaptures}>Export to main app</button><a href="options.html" target="_blank">Backup settings</a></footer>{status && <p className="status">{status}</p>}<p className="privacy">The extension does not read your browsing history or page content. It only saves what you type.</p></main>;
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label>{label}<input {...props} /></label>;
}

createRoot(document.getElementById("root")!).render(<App />);
