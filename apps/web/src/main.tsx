import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import Dexie, { Table } from "dexie";
import { Activity, Archive, Bell, CalendarDays, Download, FileText, HeartPulse, Home, Lock, Pill, Plus, Printer, RefreshCw, ShieldCheck, Sparkles, Trash2, Upload } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Allergy,
  Appointment,
  BodySignal,
  HealthEntry,
  HealthStoryBackup,
  Medication,
  PrivacyBucket,
  StressEntry,
  Supplement,
  backupCounts,
  createBackup,
  demoAllergies,
  demoAppointments,
  demoBodySignal,
  demoHealthEntries,
  demoMedications,
  demoPreferences,
  demoStressEntries,
  demoSupplements,
  downloadJson,
  generateBodySignalSummary,
  generateEntrySummary,
  privacyBuckets,
  validateBackup
} from "@healthstory/core";
import "./styles.css";

type Store = {
  bodySignals: BodySignal[];
  healthEntries: HealthEntry[];
  stressEntries: StressEntry[];
  medications: Medication[];
  supplements: Supplement[];
  allergies: Allergy[];
  appointments: Appointment[];
};

class HealthStoryDb extends Dexie {
  bodySignals!: Table<BodySignal, string>;
  healthEntries!: Table<HealthEntry, string>;
  stressEntries!: Table<StressEntry, string>;
  medications!: Table<Medication, string>;
  supplements!: Table<Supplement, string>;
  allergies!: Table<Allergy, string>;
  appointments!: Table<Appointment, string>;
  userPreferences!: Table<typeof demoPreferences, string>;

  constructor() {
    super("HealthStoryAI");
    this.version(1).stores({
      bodySignals: "id, title, status, createdAt",
      healthEntries: "id, bodySignalId, entryDate, privacyBucket",
      stressEntries: "id, entryDate, privacyBucket",
      medications: "id, active, privacyBucket",
      supplements: "id, active, privacyBucket",
      allergies: "id, privacyBucket",
      appointments: "id, date, privacyBucket",
      userPreferences: "id"
    });
  }
}

const db = new HealthStoryDb();
const blankStore: Store = { bodySignals: [], healthEntries: [], stressEntries: [], medications: [], supplements: [], allergies: [], appointments: [] };
const id = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);

function useHealthStory() {
  const [store, setStore] = useState<Store>(blankStore);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");

  const refresh = async () => {
    setStore({
      bodySignals: await db.bodySignals.toArray(),
      healthEntries: await db.healthEntries.orderBy("entryDate").reverse().toArray(),
      stressEntries: await db.stressEntries.orderBy("entryDate").reverse().toArray(),
      medications: await db.medications.toArray(),
      supplements: await db.supplements.toArray(),
      allergies: await db.allergies.toArray(),
      appointments: await db.appointments.orderBy("date").toArray()
    });
    setReady(true);
  };

  useEffect(() => {
    refresh();
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const resetDemo = async () => {
    await db.transaction("rw", [db.bodySignals, db.healthEntries, db.stressEntries, db.medications, db.supplements, db.allergies, db.appointments, db.userPreferences], async () => {
      await Promise.all([db.bodySignals.clear(), db.healthEntries.clear(), db.stressEntries.clear(), db.medications.clear(), db.supplements.clear(), db.allergies.clear(), db.appointments.clear(), db.userPreferences.clear()]);
      await db.bodySignals.put(demoBodySignal);
      await db.healthEntries.bulkPut(demoHealthEntries);
      await db.stressEntries.bulkPut(demoStressEntries);
      await db.medications.bulkPut(demoMedications);
      await db.supplements.bulkPut(demoSupplements);
      await db.allergies.bulkPut(demoAllergies);
      await db.appointments.bulkPut(demoAppointments);
      await db.userPreferences.put(demoPreferences);
    });
    await refresh();
    notify("Demo HealthStory restored.");
  };

  const exportBackup = async () => {
    const prefs = await db.userPreferences.toArray();
    const backup = createBackup({ ...store, privacySettings: [], userPreferences: prefs });
    downloadJson(`healthstory-backup-${today()}.json`, backup);
    localStorage.setItem("healthstory:lastBackupAt", new Date().toISOString());
    notify("Full HealthStory backup downloaded.");
  };

  const importBackup = async (backup: HealthStoryBackup, mode: "merge" | "replace") => {
    await db.transaction("rw", [db.bodySignals, db.healthEntries, db.stressEntries, db.medications, db.supplements, db.allergies, db.appointments, db.userPreferences], async () => {
      if (mode === "replace") {
        await Promise.all([db.bodySignals.clear(), db.healthEntries.clear(), db.stressEntries.clear(), db.medications.clear(), db.supplements.clear(), db.allergies.clear(), db.appointments.clear(), db.userPreferences.clear()]);
      }
      await db.bodySignals.bulkPut(backup.data.bodySignals);
      await db.healthEntries.bulkPut(backup.data.healthEntries);
      await db.stressEntries.bulkPut(backup.data.stressEntries);
      await db.medications.bulkPut(backup.data.medications);
      await db.supplements.bulkPut(backup.data.supplements);
      await db.allergies.bulkPut(backup.data.allergies);
      await db.appointments.bulkPut(backup.data.appointments);
      await db.userPreferences.bulkPut(backup.data.userPreferences);
    });
    await refresh();
    notify(mode === "replace" ? "Backup restored into this browser." : "Backup merged into this browser.");
  };

  const deleteAll = async () => {
    await db.transaction("rw", [db.bodySignals, db.healthEntries, db.stressEntries, db.medications, db.supplements, db.allergies, db.appointments, db.userPreferences], async () => {
      await Promise.all([db.bodySignals.clear(), db.healthEntries.clear(), db.stressEntries.clear(), db.medications.clear(), db.supplements.clear(), db.allergies.clear(), db.appointments.clear(), db.userPreferences.clear()]);
    });
    await refresh();
    notify("Local HealthStory data deleted.");
  };

  return { store, ready, toast, refresh, notify, resetDemo, exportBackup, importBackup, deleteAll };
}

function Button({ children, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button className={`button ${variant}`} {...props}>{children}</button>;
}

function Card({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <section className={`card ${className}`}>{children}</section>;
}

function PrivacyBadge({ bucket }: { bucket: PrivacyBucket }) {
  const meta = privacyBuckets[bucket];
  return <span className={`privacy-badge ${meta.tone}`}>{meta.label}</span>;
}

function PrivacySelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}>
      {Object.entries(privacyBuckets).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
    </select>
  );
}

function LandingPage() {
  return (
    <main className="landing">
      <nav className="landing-nav"><strong>HealthStory AI</strong><Link to="/app" className="button primary">Start your HealthStory</Link></nav>
      <section className="hero">
        <div>
          <p className="eyebrow">A personal record of your body's signals over time</p>
          <h1>Capture what your body is trying to tell you.</h1>
          <p className="emotional">Because your health story should not depend on memory.</p>
          <p className="subhead">A private, guided health journal that helps you track symptoms, stress, medications, allergies, appointments and body changes over time, then export clear summaries when you choose.</p>
          <div className="actions"><Link to="/app" className="button primary">Start your HealthStory</Link><a href="#backup" className="button secondary">See how backup works</a></div>
          <p className="trust">No login. No cloud database. Your health story stays on your device.</p>
          <p className="micro">Not a diagnosis app. Not an AI doctor. A personal record of your body's signals over time.</p>
        </div>
        <ProductMockup />
      </section>
      <Section title="Your body sends signals. Life scatters the story." copy="You forget when something started. You forget what made it worse. You forget what helped. You forget what the doctor said last time. HealthStory AI helps you keep the record.">
        <div className="grid four">{["I forgot when it started.", "I froze at the appointment.", "I don't know what changed.", "I'm not ready to share everything."].map((text) => <Card key={text}><h3>{text}</h3><p>Capture the detail while it is still fresh, then decide what belongs in the story.</p></Card>)}</div>
      </Section>
      <section id="backup" className="band privacy-band">
        <div><h2>Your data is yours. Literally.</h2><p>HealthStory AI is built local-first. Your journal lives on your device, not in our cloud database. There is no login, account, central health database, hidden doctor portal or company dashboard where your private notes are sitting.</p></div>
        <ul className="check-list"><li>Export a doctor-ready PDF</li><li>Back up your full HealthStory file</li><li>Move your journal to another device</li><li>Delete all local data instantly</li></ul>
        <p className="honesty">Because your HealthStory is stored on your device, back it up regularly before switching devices, clearing browser data or uninstalling the app.</p>
      </section>
      <Section title="From scattered memory to a clear health story.">
        <div className="flow">{["Notice", "Capture", "Track", "Understand", "Share"].map((step) => <div key={step}><Sparkles size={20} /><strong>{step}</strong><p>{flowText[step]}</p></div>)}</div>
      </Section>
      <Section title="Track the signals that matter to you.">
        <div className="pill-grid">{["Symptoms", "Stress", "Sleep", "Mood", "Medications", "Supplements", "Allergies", "Appointments", "Questions", "Private reflections"].map((item) => <span key={item}>{item}</span>)}</div>
      </Section>
      <Section title="Your story. Your control." copy="Not every note belongs in a doctor summary. HealthStory AI lets you choose the sharing bucket for every entry.">
        <div className="bucket-demo">{Object.keys(privacyBuckets).map((bucket) => <PrivacyBadge key={bucket} bucket={bucket as PrivacyBucket} />)}<Card><p>Note: anxious thought before appointment</p><PrivacyBadge bucket="ask_each_time" /></Card></div>
      </Section>
      <Section title={'One day, doctors may ask: "Do you have a HealthStory AI journal I could look at?"'} copy="A doctor does not need a messy diary. They need a clear, patient-approved summary: timeline, symptoms, severity, medications, allergies, stress context if shared, what helped, what made things worse, and the questions the patient wants to ask.">
        <DoctorMock />
      </Section>
      <Section title="Stress belongs in the story too." copy="Stress, sleep, mood and emotional load can change how people experience symptoms and how they move through healthcare. Mental health notes default to Never share.">
        <div className="metric-row"><Card><h3>Daily stress</h3><strong>7/10</strong></Card><Card><h3>Weekly average</h3><strong>5.8</strong></Card><Card><h3>Monthly trend</h3><strong>Down gently</strong></Card></div>
      </Section>
      <Section title="Quick capture from your browser." copy="HealthStory Quick Capture lets you quickly record a Body Signal, stress snapshot, medication note, appointment question or private reflection while using the browser. It does not read your browsing history.">
        <Card><p>Because there is no cloud account, extension entries stay inside the extension until you export them. Export from the extension and import into the full HealthStory app anytime.</p><button className="button secondary">Add Quick Capture</button></Card>
      </Section>
      <Section title="Built for clarity, not diagnosis." copy="HealthStory AI does not diagnose, prescribe or replace medical care. It helps users organise their own information and prepare for better conversations with qualified professionals.">
        <p className="emergency">If you are experiencing urgent or severe symptoms, contact emergency services immediately.</p>
      </Section>
      <Section title="Start local. Upgrade only if it serves privacy.">
        <div className="grid two"><Card><h3>Free Local App</h3><ul><li>No login</li><li>Local journal</li><li>Body Signals</li><li>Doctor summary preview</li><li>Backup/export/import</li></ul><Link to="/app" className="button primary">Start free</Link></Card><Card><h3>Pro Later</h3><ul><li>Encrypted backups</li><li>Advanced exports</li><li>Family profiles</li><li>Optional private sync if users request it</li></ul></Card></div>
      </Section>
      <section className="final-cta"><h2>Your body remembers. Now your journal does too.</h2><Link to="/app" className="button primary">Start your HealthStory</Link></section>
    </main>
  );
}

const flowText: Record<string, string> = {
  Notice: "Something changes in your body, mood, stress, sleep or medication.",
  Capture: "Add a guided check-in as a Body Signal.",
  Track: "Build a timeline across days, weeks and months.",
  Understand: "See patterns and changes over time.",
  Share: "Generate a summary for yourself, a carer or your doctor."
};

function Section({ title, copy, children }: React.PropsWithChildren<{ title: string; copy?: string }>) {
  return <section className="section"><h2>{title}</h2>{copy && <p className="section-copy">{copy}</p>}{children}</section>;
}

function ProductMockup() {
  return <div className="mockup"><div className="mockup-header"><span />Today&apos;s Body Signal</div><h3>Burning feet</h3><div className="meter"><span style={{ width: "70%" }} /></div><p>Stress level 7/10</p><div className="timeline-line"><i /><i /><i /></div><div className="mockup-actions"><button>Doctor summary</button><button>Backup</button></div><PrivacyBadge bucket="ask_each_time" /></div>;
}

function DoctorMock() {
  return <Card className="summary-card"><h3>HealthStory AI Summary</h3><p>Main Body Signal: Burning feet</p><p>Date range: Last 8 weeks</p><p>Severity trend: 4-7/10</p><p>Worse after: poor sleep, stress, long sitting</p><p>Helped by: walking, magnesium, rest</p><p>Private notes excluded</p></Card>;
}

function AppShell({ children, toast }: React.PropsWithChildren<{ toast: string }>) {
  const nav = [
    ["Dashboard", "/app", Home],
    ["Body Signals", "/app/body-signals", HeartPulse],
    ["Check-in", "/app/check-in", Plus],
    ["Stress", "/app/stress", Activity],
    ["Medications", "/app/medications", Pill],
    ["Allergies", "/app/allergies", ShieldCheck],
    ["Appointments", "/app/appointments", CalendarDays],
    ["Doctor Summary", "/app/doctor-summary", FileText],
    ["Private Vault", "/app/private-vault", Lock],
    ["Backup & Export", "/app/backup", Archive],
    ["Settings", "/app/settings", Bell]
  ] as const;
  return <div className="app-shell"><aside><Link to="/" className="brand">HealthStory AI</Link>{nav.map(([label, to, Icon]) => <NavLink key={to} to={to} end={to === "/app"}><Icon size={18} />{label}</NavLink>)}</aside><main className="app-main">{children}</main><nav className="mobile-nav">{nav.slice(0, 5).map(([label, to, Icon]) => <NavLink key={to} to={to} end={to === "/app"}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>{toast && <div className="toast">{toast}</div>}</div>;
}

function Dashboard({ store, actions }: { store: Store; actions: ReturnType<typeof useHealthStory> }) {
  const stressAvg = store.stressEntries.length ? (store.stressEntries.reduce((sum, entry) => sum + entry.stressLevel, 0) / store.stressEntries.length).toFixed(1) : "0";
  return <Page title="Good morning. Anything your body wants you to notice today?"><div className="quick-actions"><Link to="/app/body-signals/new" className="button primary"><Plus size={18} />Add Body Signal</Link><Link to="/app/check-in" className="button secondary">Add Check-in</Link><Link to="/app/stress" className="button secondary">Log Stress</Link><Link to="/app/doctor-summary" className="button secondary">Prepare Doctor Summary</Link><button onClick={actions.exportBackup} className="button secondary">Backup Data</button></div><div className="grid three"><Card><h3>Active Body Signals</h3><strong>{store.bodySignals.length}</strong></Card><Card><h3>Stress this week</h3><strong>{stressAvg}/10</strong></Card><Card><h3>Upcoming appointment</h3><p>{store.appointments[0]?.providerName || "No appointments yet"}</p></Card><Card><h3>Medication/allergy record</h3><p>{store.medications.length + store.supplements.length} meds/supplements, {store.allergies.length} allergies</p></Card><Card><h3>Private notes excluded</h3><p>{store.stressEntries.filter((entry) => entry.privacyBucket !== "shareable").length} private stress notes</p></Card><Card><h3>Local data status</h3><p>Saved locally in this browser.</p></Card></div><Card className="ownership"><h3>Your journal is stored on this device</h3><p>HealthStory AI does not store your health data in the cloud. Your entries are saved locally in this browser.</p><div className="actions"><button className="button secondary" onClick={actions.exportBackup}><Download size={17} />Back up data</button><Link to="/app/backup" className="button secondary"><Upload size={17} />Import backup</Link><Link to="/app/doctor-summary" className="button secondary"><Printer size={17} />Export doctor PDF</Link></div><small>Back up regularly if you want to move your HealthStory to another device.</small></Card></Page>;
}

function Page({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return <><header className="page-header"><p className="eyebrow">Private by design</p><h1>{title}</h1></header>{children}</>;
}

function BodySignals({ store }: { store: Store }) {
  return <Page title="Track the signals"><Link to="/app/body-signals/new" className="button primary"><Plus size={18} />New Body Signal</Link>{store.bodySignals.length === 0 ? <Empty text="Start by capturing one thing your body has been trying to tell you." /> : <div className="grid two">{store.bodySignals.map((signal) => <Link to={`/app/body-signals/${signal.id}`} className="card link-card" key={signal.id}><h3>{signal.title}</h3><p>{signal.category} · {signal.bodyArea}</p><PrivacyBadge bucket={signal.defaultPrivacy} /><p>Worry level {signal.worryLevel}/10</p></Link>)}</div>}</Page>;
}

function NewBodySignal({ refresh, notify }: { refresh: () => Promise<void>; notify: (message: string) => void }) {
  const navigate = useNavigate();
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const signal: BodySignal = { id: id(), title: String(form.get("title")), category: String(form.get("category")), bodyArea: String(form.get("bodyArea")), startDate: String(form.get("startDate")), status: form.get("status") as BodySignal["status"], worryLevel: Number(form.get("worryLevel")), defaultPrivacy: form.get("defaultPrivacy") as PrivacyBucket, notes: String(form.get("notes") || ""), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await db.bodySignals.put(signal);
    await refresh();
    notify("Body Signal saved.");
    navigate(`/app/body-signals/${signal.id}`);
  };
  return <Page title="Create a Body Signal"><Form onSubmit={submit}><Input name="title" label="Body Signal name" placeholder="Burning feet" required /><Input name="category" label="Category" placeholder="Nerve-like sensation" /><Input name="bodyArea" label="Body area" placeholder="Feet / lower legs" /><Input name="startDate" label="Start date" type="date" defaultValue={today()} /><label>Status<select name="status" defaultValue="ongoing"><option value="ongoing">Ongoing</option><option value="occasional">Occasional</option><option value="resolved">Resolved</option></select></label><Input name="worryLevel" label="Worry level 0-10" type="range" min="0" max="10" defaultValue="5" /><label>Default privacy bucket<PrivacySelect name="defaultPrivacy" defaultValue="shareable" /></label><label>Notes<textarea name="notes" /></label><Button>Save Body Signal</Button></Form></Page>;
}

function BodySignalDetail({ store }: { store: Store }) {
  const { id: signalId } = useParams();
  const signal = store.bodySignals.find((item) => item.id === signalId);
  const entries = store.healthEntries.filter((entry) => entry.bodySignalId === signalId);
  if (!signal) return <Page title="Body Signal not found"><Empty text="This Body Signal could not be found in local data." /></Page>;
  return <Page title={signal.title}><div className="grid two"><Card><h3>Signal details</h3><p>{signal.category} · {signal.bodyArea}</p><p>Started {signal.startDate}</p><PrivacyBadge bucket={signal.defaultPrivacy} /></Card><Card><h3>Local summary</h3><p>{generateBodySignalSummary(signal, entries, store.stressEntries)}</p></Card></div>{entries.length === 0 ? <Empty text="No timeline yet. Add a check-in when this signal changes." /> : <Timeline entries={entries} />}</Page>;
}

function CheckIn({ store, refresh, notify }: { store: Store; refresh: () => Promise<void>; notify: (message: string) => void }) {
  const navigate = useNavigate();
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entry = { id: id(), bodySignalId: String(form.get("bodySignalId")), entryDate: String(form.get("entryDate")), symptom: String(form.get("symptom")), severity: Number(form.get("severity")), changeStatus: form.get("changeStatus") as HealthEntry["changeStatus"], location: String(form.get("location")), duration: String(form.get("duration")), timeOfDay: String(form.get("timeOfDay")), trigger: String(form.get("trigger")), helpedBy: String(form.get("helpedBy")), worsenedBy: String(form.get("worsenedBy")), notes: String(form.get("notes")), privacyBucket: form.get("privacyBucket") as PrivacyBucket, createdAt: new Date().toISOString(), localStructuredSummary: "" };
    entry.localStructuredSummary = generateEntrySummary(entry);
    await db.healthEntries.put(entry);
    await refresh();
    notify("Check-in saved locally.");
    navigate(`/app/body-signals/${entry.bodySignalId}`);
  };
  return <Page title="Anything your body wants you to notice today?"><Form onSubmit={submit}><label>Select Body Signal<select name="bodySignalId" required>{store.bodySignals.map((signal) => <option key={signal.id} value={signal.id}>{signal.title}</option>)}</select></label><Input name="entryDate" label="Date" type="date" defaultValue={today()} /><Input name="symptom" label="What changed today?" /><Input name="severity" label="Severity 0-10" type="range" min="0" max="10" defaultValue="5" /><label>Better / worse / same<select name="changeStatus"><option value="same">Same</option><option value="better">Better</option><option value="worse">Worse</option><option value="new">New</option></select></label><Input name="location" label="Body location" /><Input name="timeOfDay" label="Time of day" /><Input name="duration" label="Duration" /><Input name="trigger" label="What may have triggered it?" /><Input name="helpedBy" label="What helped?" /><Input name="worsenedBy" label="What made it worse?" /><label>Notes<textarea name="notes" /></label><label>Privacy bucket<PrivacySelect name="privacyBucket" defaultValue="shareable" /></label><Button>Save check-in</Button></Form></Page>;
}

function Stress({ store, refresh, notify }: { store: Store; refresh: () => Promise<void>; notify: (message: string) => void }) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await db.stressEntries.put({ id: id(), entryDate: String(form.get("entryDate")), stressLevel: Number(form.get("stressLevel")), mood: String(form.get("mood")), anxietyLevel: Number(form.get("anxietyLevel")), sleepQuality: Number(form.get("sleepQuality")), energyLevel: Number(form.get("energyLevel")), lifeEventNotes: String(form.get("lifeEventNotes")), privateNotes: String(form.get("privateNotes")), privacyBucket: form.get("privacyBucket") as PrivacyBucket, createdAt: new Date().toISOString() });
    await refresh();
    notify("Stress check-in saved.");
  };
  const chart = [...store.stressEntries].reverse();
  return <Page title="Stress belongs in the story too."><p className="section-copy">Mental health notes are private by default. You decide whether stress context is included in any shared summary.</p><div className="grid two"><Form onSubmit={submit}><Input name="entryDate" label="Date" type="date" defaultValue={today()} /><Input name="stressLevel" label="Stress level 0-10" type="range" min="0" max="10" defaultValue="5" /><Input name="mood" label="Mood" /><Input name="anxietyLevel" label="Anxiety level 0-10" type="range" min="0" max="10" defaultValue="4" /><Input name="sleepQuality" label="Sleep quality 0-10" type="range" min="0" max="10" defaultValue="5" /><Input name="energyLevel" label="Energy level 0-10" type="range" min="0" max="10" defaultValue="5" /><label>Life event notes<textarea name="lifeEventNotes" /></label><label>Private notes<textarea name="privateNotes" /></label><label>Privacy bucket<PrivacySelect name="privacyBucket" defaultValue="never_share" /></label><Button>Save stress log</Button></Form><Card><h3>Daily stress chart</h3>{chart.length ? <ResponsiveContainer width="100%" height={260}><AreaChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="entryDate" /><YAxis domain={[0, 10]} /><Tooltip /><Area dataKey="stressLevel" stroke="#155E63" fill="#D8EFE8" /></AreaChart></ResponsiveContainer> : <Empty text="Your stress story is part of your health story. Add your first check-in." />}</Card></div></Page>;
}

function ListsPage({ type, store, refresh, notify }: { type: "medications" | "allergies" | "appointments"; store: Store; refresh: () => Promise<void>; notify: (message: string) => void }) {
  if (type === "medications") return <Medications store={store} refresh={refresh} notify={notify} />;
  if (type === "allergies") return <Allergies store={store} refresh={refresh} notify={notify} />;
  return <Appointments store={store} refresh={refresh} notify={notify} />;
}

function Medications({ store, refresh, notify }: { store: Store; refresh: () => Promise<void>; notify: (message: string) => void }) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const base = { id: id(), name: String(form.get("name")), dose: String(form.get("dose")), frequency: String(form.get("frequency")), startDate: String(form.get("startDate")), stopDate: String(form.get("stopDate") || ""), reason: String(form.get("reason")), active: form.get("active") === "on", privacyBucket: form.get("privacyBucket") as PrivacyBucket, createdAt: new Date().toISOString() };
    if (form.get("kind") === "supplement") await db.supplements.put({ ...base, noticedEffect: String(form.get("effect")) });
    else await db.medications.put({ ...base, sideEffects: String(form.get("effect")) });
    await refresh(); notify("Medication record saved.");
  };
  return <Page title="Medications and supplements"><div className="grid two"><Form onSubmit={submit}><label>Type<select name="kind"><option value="medication">Medication</option><option value="supplement">Supplement</option></select></label><Input name="name" label="Name" required /><Input name="dose" label="Dose" /><Input name="frequency" label="Frequency" /><Input name="startDate" label="Start date" type="date" defaultValue={today()} /><Input name="stopDate" label="Stop date" type="date" /><Input name="reason" label="Reason" /><Input name="effect" label="Side effects / noticed effect" /><label className="checkbox"><input name="active" type="checkbox" defaultChecked /> Active</label><label>Privacy bucket<PrivacySelect name="privacyBucket" defaultValue="shareable" /></label><Button>Save</Button></Form><Card><h3>Current record</h3>{[...store.medications, ...store.supplements].map((item) => <p key={item.id}><strong>{item.name}</strong> {item.dose} <PrivacyBadge bucket={item.privacyBucket} /></p>)}</Card></div></Page>;
}

function Allergies({ store, refresh, notify }: { store: Store; refresh: () => Promise<void>; notify: (message: string) => void }) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await db.allergies.put({ id: id(), allergen: String(form.get("allergen")), allergyType: form.get("allergyType") as Allergy["allergyType"], reaction: String(form.get("reaction")), severity: form.get("severity") as Allergy["severity"], notes: String(form.get("notes")), privacyBucket: form.get("privacyBucket") as PrivacyBucket, createdAt: new Date().toISOString() });
    await refresh(); notify("Allergy saved.");
  };
  return <Page title="Allergies"><div className="grid two"><Form onSubmit={submit}><Input name="allergen" label="Allergen" required /><label>Allergy type<select name="allergyType"><option value="medication">Medication</option><option value="food">Food</option><option value="environmental">Environmental</option><option value="other">Other</option></select></label><Input name="reaction" label="Reaction" /><label>Severity<select name="severity"><option>unknown</option><option>mild</option><option>moderate</option><option>severe</option></select></label><label>Notes<textarea name="notes" /></label><label>Privacy bucket<PrivacySelect name="privacyBucket" defaultValue="shareable" /></label><Button>Save allergy</Button></Form><Card><h3>Allergy record</h3>{store.allergies.length ? store.allergies.map((item) => <p key={item.id}><strong>{item.allergen}</strong> · {item.reaction} <PrivacyBadge bucket={item.privacyBucket} /></p>) : <Empty text="No allergies recorded yet." />}</Card></div></Page>;
}

function Appointments({ store, refresh, notify }: { store: Store; refresh: () => Promise<void>; notify: (message: string) => void }) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await db.appointments.put({ id: id(), date: String(form.get("date")), providerName: String(form.get("providerName")), clinicName: String(form.get("clinicName")), appointmentType: String(form.get("appointmentType")), reason: String(form.get("reason")), questionsToAsk: String(form.get("questionsToAsk")), thingsNotToForget: String(form.get("thingsNotToForget")), worriedAbout: String(form.get("worriedAbout")), outcomeNotes: String(form.get("outcomeNotes")), testsOrdered: String(form.get("testsOrdered")), medicationChanges: String(form.get("medicationChanges")), referrals: String(form.get("referrals")), followUpDate: String(form.get("followUpDate")), privacyBucket: form.get("privacyBucket") as PrivacyBucket, createdAt: new Date().toISOString() });
    await refresh(); notify("Appointment saved.");
  };
  return <Page title="Appointments"><div className="grid two"><Form onSubmit={submit}><Input name="date" label="Appointment date" type="date" defaultValue={today()} /><Input name="providerName" label="Provider" /><Input name="clinicName" label="Clinic" /><Input name="appointmentType" label="Appointment type" /><Input name="reason" label="Reason" /><label>Questions to ask<textarea name="questionsToAsk" /></label><label>Things not to forget<textarea name="thingsNotToForget" /></label><label>What are you worried about?<textarea name="worriedAbout" /></label><label>What provider said<textarea name="outcomeNotes" /></label><Input name="testsOrdered" label="Tests ordered" /><Input name="medicationChanges" label="Medication changes" /><Input name="referrals" label="Referrals" /><Input name="followUpDate" label="Follow-up date" type="date" /><label>Privacy bucket<PrivacySelect name="privacyBucket" defaultValue="shareable" /></label><Button>Save appointment</Button></Form><Card><h3>Appointment list</h3>{store.appointments.length ? store.appointments.map((item) => <p key={item.id}><strong>{item.date}</strong> · {item.providerName} · {item.reason}</p>) : <Empty text="Add an appointment to prepare questions and remember what was discussed." />}</Card></div></Page>;
}

function PrivateVault({ store }: { store: Store }) {
  const grouped = [...store.healthEntries, ...store.stressEntries, ...store.appointments].filter((item) => item.privacyBucket !== "shareable");
  const textFor = (item: HealthEntry | StressEntry | Appointment) => {
    if ("privateNotes" in item) return item.privateNotes || item.lifeEventNotes || item.mood;
    if ("reason" in item) return item.reason || item.questionsToAsk;
    return item.notes || item.symptom;
  };
  return <Page title="Private Notes Vault"><p className="section-copy">Some thoughts are part of your health story, but not everything has to be shared.</p>{grouped.length ? <div className="grid two">{grouped.map((item) => <Card key={item.id}><PrivacyBadge bucket={item.privacyBucket} /><p>{textFor(item)}</p></Card>)}</div> : <Empty text="Private notes you choose not to share will appear here." />}</Page>;
}

function DoctorSummary({ store }: { store: Store }) {
  const [signalId, setSignalId] = useState(store.bodySignals[0]?.id || "");
  const [includeStress, setIncludeStress] = useState(true);
  const signal = store.bodySignals.find((item) => item.id === signalId);
  const entries = store.healthEntries.filter((entry) => entry.bodySignalId === signalId && entry.privacyBucket === "shareable");
  const summary = generateBodySignalSummary(signal, entries, includeStress ? store.stressEntries.filter((entry) => entry.privacyBucket === "shareable") : []);
  return <Page title="Doctor Summary Builder"><Card><p><strong>Private notes are excluded by default.</strong> You choose what to include. Your full journal is never shared automatically.</p><div className="form-grid"><label>Choose Body Signal<select value={signalId} onChange={(event) => setSignalId(event.target.value)}>{store.bodySignals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Date range start<input type="date" defaultValue="2026-04-20" /></label><label>Date range end<input type="date" defaultValue={today()} /></label><label className="checkbox"><input type="checkbox" checked={includeStress} onChange={(event) => setIncludeStress(event.target.checked)} /> Include shareable stress trend</label></div></Card><Card className="printable"><h2>HealthStory AI Summary</h2><p>Patient-approved summary based on user-entered information. Not a diagnosis or medical advice.</p><p>This summary is based on user-entered information. It is not a diagnosis or medical advice.</p><h3>Main Body Signal</h3><p>{signal?.title || "No Body Signal selected"}</p><h3>Short summary</h3><p>{summary}</p><h3>Timeline</h3>{entries.map((entry) => <p key={entry.id}><strong>{entry.entryDate}</strong>: {entry.symptom}, severity {entry.severity}/10. Helped by {entry.helpedBy || "not recorded"}.</p>)}<h3>Current medications</h3>{store.medications.filter((item) => item.active && item.privacyBucket === "shareable").map((item) => <p key={item.id}>{item.name} · {item.dose} · {item.frequency}</p>)}<h3>Supplements</h3>{store.supplements.filter((item) => item.active && item.privacyBucket === "shareable").map((item) => <p key={item.id}>{item.name} · {item.dose}</p>)}<h3>Allergies</h3>{store.allergies.filter((item) => item.privacyBucket === "shareable").map((item) => <p key={item.id}>{item.allergen}: {item.reaction}</p>)}<h3>Appointment questions</h3>{store.appointments.filter((item) => item.privacyBucket === "shareable").map((item) => <p key={item.id}>{item.questionsToAsk}</p>)}<h3>Private sections excluded</h3><p>Entries marked Ask me each time, Not at this time, Never share and Emergency-only are excluded unless the user chooses otherwise.</p><blockquote>One day, doctors may ask: "Do you have a HealthStory AI journal I could look at?"</blockquote></Card><button className="button primary" onClick={() => window.print()}><Printer size={17} />Export / print PDF</button></Page>;
}

function BackupCentre({ actions }: { actions: ReturnType<typeof useHealthStory> }) {
  const [pending, setPending] = useState<HealthStoryBackup | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState("");
  const readFile = async (file: File) => {
    const parsed = JSON.parse(await file.text());
    const result = validateBackup(parsed);
    if (!result.ok) return actions.notify(result.error);
    setPending(result.backup); setCounts(backupCounts(result.backup));
  };
  return <Page title="Your data is yours. Back it up when you choose."><div className="grid two"><Card><h3>1. Export Doctor Summary</h3><p>Choose what to include, review private sections, then export a printable PDF.</p><Link className="button secondary" to="/app/doctor-summary">Export doctor summary</Link></Card><Card><h3>2. Back Up Full HealthStory</h3><p>Downloads a backup file containing your Body Signals, entries, stress logs, medications, allergies, appointments and privacy settings.</p><button className="button primary" onClick={actions.exportBackup}>Back up full HealthStory</button></Card><Card><h3>3. Import Backup</h3><p>Select a HealthStory backup file. This will restore your journal into this browser only after confirmation.</p><input type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])} />{counts && <div><p>Backup preview: {Object.entries(counts).map(([key, value]) => `${key}: ${value}`).join(", ")}</p><button className="button secondary" onClick={() => pending && actions.importBackup(pending, "merge")}>Merge with current journal</button><button className="button danger" onClick={() => pending && actions.importBackup(pending, "replace")}>Replace current journal</button></div>}</Card><Card><h3>4. Delete Local Data</h3><p>This permanently removes your HealthStory from this browser/device. This cannot be undone unless you have a backup file.</p><input value={confirmDelete} onChange={(event) => setConfirmDelete(event.target.value)} placeholder="DELETE MY HEALTHSTORY" /><button className="button danger" disabled={confirmDelete !== "DELETE MY HEALTHSTORY"} onClick={actions.deleteAll}><Trash2 size={17} />Delete all local data</button></Card></div><Card><h3>How to move your HealthStory to another device</h3><ol><li>Open HealthStory AI on your current device.</li><li>Go to Backup & Export.</li><li>Click Back up full HealthStory.</li><li>Save the backup file somewhere safe.</li><li>Open HealthStory AI on your other device.</li><li>Go to Backup & Export.</li><li>Click Import HealthStory backup.</li><li>Select the backup file.</li><li>Confirm import.</li></ol><p><strong>Important:</strong> Your HealthStory does not automatically sync between devices because we do not store your journal in the cloud.</p></Card></Page>;
}

function Settings({ actions }: { actions: ReturnType<typeof useHealthStory> }) {
  return <Page title="Settings"><div className="grid two"><Card><h3>User display name</h3><input defaultValue="Demo User" /><p>HealthStory AI stores your journal locally on this device. We do not have access to your entries.</p></Card><Card><h3>Data controls</h3><button className="button secondary" onClick={actions.exportBackup}><Download size={17} />Export full backup</button><Link to="/app/backup" className="button secondary"><Upload size={17} />Import backup</Link><Link to="/app/doctor-summary" className="button secondary"><Printer size={17} />Export doctor summary</Link><button className="button secondary" onClick={actions.resetDemo}><RefreshCw size={17} />Reset demo data</button></Card><Card><h3>Safety disclaimer</h3><p>HealthStory AI is not a diagnosis app. It does not provide medical advice or treatment recommendations.</p><p>If you are experiencing urgent or severe symptoms, contact emergency services immediately.</p></Card><Card><h3>App version</h3><p>1.0.0 MVP</p><p>Last backup: {localStorage.getItem("healthstory:lastBackupAt") || "No backups yet"}</p></Card></div></Page>;
}

function Timeline({ entries }: { entries: HealthEntry[] }) {
  const chartData = [...entries].reverse();
  return <Card><h3>Timeline</h3><ResponsiveContainer width="100%" height={220}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="entryDate" /><YAxis domain={[0, 10]} /><Tooltip /><Line type="monotone" dataKey="severity" stroke="#155E63" strokeWidth={3} /></LineChart></ResponsiveContainer>{entries.map((entry) => <article className="timeline-item" key={entry.id}><strong>{entry.entryDate} · {entry.severity}/10</strong><p>{entry.localStructuredSummary}</p><PrivacyBadge bucket={entry.privacyBucket} /></article>)}</Card>;
}

function Empty({ text }: { text: string }) {
  return <Card className="empty-state"><p>{text}</p></Card>;
}

function Form(props: React.FormHTMLAttributes<HTMLFormElement>) {
  return <form {...props} className="form-grid" />;
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label>{label}<input {...props} /></label>;
}

function Root() {
  const actions = useHealthStory();
  useEffect(() => {
    if (actions.ready && actions.store.bodySignals.length === 0 && localStorage.getItem("healthstory:seeded") !== "yes") {
      actions.resetDemo().then(() => localStorage.setItem("healthstory:seeded", "yes"));
    }
  }, [actions.ready]);
  return <BrowserRouter><Routes><Route path="/" element={<LandingPage />} /><Route path="/app/*" element={<AppShell toast={actions.toast}>{!actions.ready ? <Page title="Loading your local HealthStory..." /> : <Routes><Route index element={<Dashboard store={actions.store} actions={actions} />} /><Route path="body-signals" element={<BodySignals store={actions.store} />} /><Route path="body-signals/new" element={<NewBodySignal refresh={actions.refresh} notify={actions.notify} />} /><Route path="body-signals/:id" element={<BodySignalDetail store={actions.store} />} /><Route path="check-in" element={<CheckIn store={actions.store} refresh={actions.refresh} notify={actions.notify} />} /><Route path="stress" element={<Stress store={actions.store} refresh={actions.refresh} notify={actions.notify} />} /><Route path="medications" element={<ListsPage type="medications" store={actions.store} refresh={actions.refresh} notify={actions.notify} />} /><Route path="allergies" element={<ListsPage type="allergies" store={actions.store} refresh={actions.refresh} notify={actions.notify} />} /><Route path="appointments" element={<ListsPage type="appointments" store={actions.store} refresh={actions.refresh} notify={actions.notify} />} /><Route path="private-vault" element={<PrivateVault store={actions.store} />} /><Route path="doctor-summary" element={<DoctorSummary store={actions.store} />} /><Route path="backup" element={<BackupCentre actions={actions} />} /><Route path="settings" element={<Settings actions={actions} />} /></Routes>}</AppShell>} /></Routes></BrowserRouter>;
}

createRoot(document.getElementById("root")!).render(<Root />);
