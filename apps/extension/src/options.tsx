import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { exportCaptures, getCaptures, importBackupFile, setCaptures } from "./shared";
import "./styles.css";

function Options() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const refresh = () => getCaptures().then((items) => setCount(items.length));
  useEffect(() => {
    void refresh();
  }, []);

  const importFile = async (file: File) => {
    try {
      const imported = await importBackupFile(file);
      setMessage(`Imported ${imported} entries into extension storage.`);
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    }
  };

  return <main className="options"><header><strong>HealthStory Quick Capture Settings</strong><p>Extension entries stay inside the extension until you export them.</p></header><section><h2>Backup / Export</h2><p>{count} captures saved locally in this extension.</p><button className="primary" onClick={exportCaptures}>Export to main app</button><label>Import HealthStory backup<input type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && importFile(event.target.files[0])} /></label><button className="danger" onClick={async () => { await setCaptures([]); setMessage("Extension data cleared."); refresh(); }}>Clear extension data</button></section><section><h2>Privacy</h2><p>HealthStory Quick Capture does not request host permissions. It does not read browsing history or page content. It only stores what you type into the popup.</p><p>HealthStory does not automatically sync because your journal is not stored in our cloud. Use Backup & Export to move your journal between devices or from the extension into the main app.</p></section>{message && <p className="status">{message}</p>}</main>;
}

createRoot(document.getElementById("root")!).render(<Options />);
