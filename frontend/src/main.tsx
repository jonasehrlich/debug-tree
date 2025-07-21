import "@/lib/logging.ts";
import { ReactFlowProvider } from "@xyflow/react";
import React from "react";
import { createRoot } from "react-dom/client";
import { HotkeysProvider } from "react-hotkeys-hook";
import { App } from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider";
import "./index.css";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" storageKey="app-theme" enableSystem>
      <HotkeysProvider>
        <ReactFlowProvider>
          <App />
        </ReactFlowProvider>
      </HotkeysProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
