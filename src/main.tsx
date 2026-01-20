import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderBootError(title: string, details?: unknown) {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;

  const detailText =
    typeof details === "string"
      ? details
      : details instanceof Error
        ? `${details.name}: ${details.message}\n${details.stack ?? ""}`
        : JSON.stringify(details, null, 2);

  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; background:#0b0b0c; color:#eaeaea;">
      <div style="max-width:860px;width:100%;">
        <div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;opacity:.7;margin-bottom:10px;">Infostack Runtime</div>
        <h1 style="margin:0 0 10px;font-size:22px;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 16px;opacity:.75;">This page hit a runtime error while loading. Open DevTools Console for the full stack.</p>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#141416;border:1px solid #26262a;border-radius:10px;padding:14px;overflow:auto;max-height:55vh;">${escapeHtml(detailText || "(no details)")}</pre>
      </div>
    </div>
  `;
}

function installGlobalErrorHandlers() {
  window.addEventListener("error", (event) => {
    // event.error can be undefined for resource errors; keep payload anyway
    console.error("[Boot] window.error", event.error ?? event.message, event);
    renderBootError("Uncaught error", event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[Boot] unhandledrejection", event.reason);
    renderBootError("Unhandled promise rejection", event.reason);
  });
}

async function bootstrap() {
  installGlobalErrorHandlers();

  // Helps diagnose and also ensures the React module is initialized before loading the app chunk
  console.info("[Boot] React", {
    version: (React as any)?.version,
    hasCreateContext: typeof (React as any)?.createContext === "function",
    hasInjectedFunnelData: typeof window !== "undefined" && !!(window as any).__INFOSTACK_FUNNEL__,
    host: typeof window !== "undefined" ? window.location.host : "(server)",
  });

  try {
    const { default: App } = await import("./App.tsx");

    try {
      createRoot(document.getElementById("root")!).render(<App />);
    } catch (err) {
      console.error("[Boot] render failed", err);
      renderBootError("React render failed", err);
    }
  } catch (err) {
    console.error("[Boot] bootstrap import failed", err);
    renderBootError("App bootstrap failed", err);
  }
}

bootstrap();
