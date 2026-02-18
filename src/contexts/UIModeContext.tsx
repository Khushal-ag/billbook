import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type UIMode = "simple" | "advanced";

interface UIModeContextValue {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
}

const UIModeContext = createContext<UIModeContextValue | null>(null);

const UI_MODE_KEY = "billbook_ui_mode";
const DEFAULT_MODE: UIMode = "simple";

export function UIModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UIMode>(DEFAULT_MODE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(UI_MODE_KEY);
    if (stored === "advanced" || stored === "simple") {
      setModeState(stored);
    }
    setIsInitialized(true);
  }, []);

  const setMode = useCallback((newMode: UIMode) => {
    setModeState(newMode);
    localStorage.setItem(UI_MODE_KEY, newMode);
  }, []);

  // Don't render children until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return null;
  }

  return <UIModeContext.Provider value={{ mode, setMode }}>{children}</UIModeContext.Provider>;
}

export function useUIMode() {
  const context = useContext(UIModeContext);
  if (!context) {
    throw new Error("useUIMode must be used within UIModeProvider");
  }
  return context;
}
