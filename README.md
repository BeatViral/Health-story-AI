# HealthStory AI

A local-first health journal for capturing body signals, stress, medications, allergies, appointments and private reflections over time.

HealthStory AI has no login, no backend and no cloud health database. Journal data is stored locally in the user's browser with IndexedDB. Users can export a doctor-ready summary, download a full JSON backup, import that backup on another device, or delete local data.

## Safety

HealthStory AI is not a diagnosis app, symptom checker, AI doctor or treatment tool. It helps people organise user-entered information so they can communicate more clearly with carers and healthcare professionals.

If you are experiencing urgent or severe symptoms, contact emergency services immediately.

## Run Locally

```bash
npm install
npm run dev:web
```

Open the Vite URL shown in your terminal.

## Build Web App

```bash
npm run build:web
```

The static site is generated in `apps/web/dist`.

## GitHub Pages

The Vite config uses `base: process.env.GITHUB_PAGES_BASE || "/"`. For a repository page, build with:

```bash
$env:GITHUB_PAGES_BASE="/your-repo-name/"
npm run build:web
```

Then publish `apps/web/dist` to GitHub Pages.

## Browser Extension

```bash
npm run build:extension
```

Load the unpacked extension from `apps/extension/dist` in Chrome or Edge:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select `apps/extension/dist`.

The extension stores captures locally in extension storage. It does not request host permissions and does not read browsing history or page content.

## Backup And Import

Full backups use a JSON object with app metadata and data arrays for body signals, health entries, stress entries, medications, supplements, allergies, appointments, privacy settings and preferences.

Extension entries can be exported as the same HealthStory backup format and imported into the main app. HealthStory does not automatically sync because your journal is not stored in our cloud.

## Local Data Warning

Because data stays on the user's device/browser, clearing browser data, uninstalling the PWA, changing browsers or losing a device can remove the journal unless the user has exported a backup.

## Roadmap

- Encrypted backups
- Optional user-controlled cloud sync
- Family profiles
- Advanced PDF exports
- Extension side panel
- Optional AI summaries with explicit consent
- Wearable import
- Clinic version
