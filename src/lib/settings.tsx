/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type FontMode = "normal" | "high";

interface SettingsContextValue {
  fontMode: FontMode;
  setFontMode: (mode: FontMode) => void;
}

const STORAGE_KEY = "shopflow:font-mode";

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [fontMode, setFontMode] = useState<FontMode>(() => {
    if (typeof window === "undefined") return "normal";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "high" ? "high" : "normal";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, fontMode);
    document.documentElement.classList.toggle("font-high", fontMode === "high");
  }, [fontMode]);

  const value = useMemo(
    () => ({
      fontMode,
      setFontMode,
    }),
    [fontMode]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
