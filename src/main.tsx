import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

async function bootstrap() {
  // Helps diagnose and also ensures the React module is initialized before loading the app chunk
  console.info("[Boot] React", {
    version: (React as any)?.version,
    hasCreateContext: typeof (React as any)?.createContext === "function",
  });

  const { default: App } = await import("./App.tsx");
  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
