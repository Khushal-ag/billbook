import type { ReactNode } from "react";
import { useUIMode } from "@/contexts/UIModeContext";

interface SimpleModeProps {
  children: ReactNode;
}

interface AdvancedModeProps {
  children: ReactNode;
}

interface DualModeProps {
  simple: ReactNode;
  advanced: ReactNode;
}

/**
 * Render content only in Simple mode
 */
export function SimpleMode({ children }: SimpleModeProps) {
  const { mode } = useUIMode();
  if (mode !== "simple") return null;
  return children;
}

/**
 * Render content only in Advanced mode
 */
export function AdvancedMode({ children }: AdvancedModeProps) {
  const { mode } = useUIMode();
  if (mode !== "advanced") return null;
  return children;
}

/**
 * Render different content based on mode
 */
export function DualMode({ simple, advanced }: DualModeProps) {
  const { mode } = useUIMode();
  return mode === "simple" ? simple : advanced;
}
