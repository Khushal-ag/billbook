import { useUIMode } from "@/contexts/UIModeContext";

/**
 * Hook to check if in simple mode
 */
export function useIsSimpleMode(): boolean {
  const { mode } = useUIMode();
  return mode === "simple";
}

/**
 * Hook to get the appropriate label for a concept based on UI mode
 */
export function useSimpleLabel(advancedLabel: string, simpleLabel: string): string {
  const { mode } = useUIMode();
  return mode === "simple" ? simpleLabel : advancedLabel;
}
