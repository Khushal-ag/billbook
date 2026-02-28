import { useUIMode } from "@/contexts/UIModeContext";

/**
 * Hook to check if the app is in simple (vs advanced) UI mode.
 */
export function useIsSimpleMode(): boolean {
  const { mode } = useUIMode();
  return mode === "simple";
}

/**
 * Hook to get the label for the current UI mode (e.g. for toggle or tooltips).
 * Returns simpleLabel when in simple mode, advancedLabel when in advanced mode.
 */
export function useSimpleLabel(advancedLabel: string, simpleLabel: string): string {
  const { mode } = useUIMode();
  return mode === "simple" ? simpleLabel : advancedLabel;
}
