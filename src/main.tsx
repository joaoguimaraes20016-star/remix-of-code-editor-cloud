// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { runSampleAutomationDev } from "./lib/automations/devRunner";

// Run a sample automation once when the app boots,
// just so we can verify the engine works end-to-end.
runSampleAutomationDev().catch((err) => {
  console.error("[Automation DEV] Error running sample automation:", err);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
