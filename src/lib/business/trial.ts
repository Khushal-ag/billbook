import { ApiClientError } from "@/api/error";
import { showErrorToast } from "@/lib/ui/toast-helpers";

/** Client-side: trial is expired when validity end is strictly before now. Null/undefined = not limited by trial end. */
export function isValidityPeriodEnded(validityEndIso: string | null | undefined): boolean {
  if (validityEndIso == null || validityEndIso === "") return false;
  const end = Date.parse(validityEndIso);
  if (!Number.isFinite(end)) return false;
  return end < Date.now();
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Active trial: has an end date and it is still in the future. */
export function isTrialActive(validityEndIso: string | null | undefined): boolean {
  if (validityEndIso == null || validityEndIso === "") return false;
  const end = Date.parse(validityEndIso);
  if (!Number.isFinite(end)) return false;
  return end >= Date.now();
}

/**
 * Show the trial reminder banner only in the last `daysBefore` days before validity ends
 * (trial still active, but end date is soon).
 */
export function shouldShowTrialBanner(
  validityEndIso: string | null | undefined,
  daysBefore = 5,
): boolean {
  if (validityEndIso == null || validityEndIso === "") return false;
  const end = Date.parse(validityEndIso);
  if (!Number.isFinite(end)) return false;
  const now = Date.now();
  if (end <= now) return false;
  const msLeft = end - now;
  return msLeft <= daysBefore * MS_PER_DAY;
}

export function isTrialExpiredApiError(err: unknown): boolean {
  if (!(err instanceof ApiClientError) || err.status !== 403) return false;
  const d = err.details;
  if (d && typeof d === "object" && "code" in d) {
    return String((d as { code?: unknown }).code).toUpperCase() === "TRIAL_EXPIRED";
  }
  return false;
}

const TRIAL_EXPIRED_TITLE = "Trial ended";
const TRIAL_EXPIRED_DESCRIPTION =
  "Your organization’s trial period has ended. Contact your administrator or support to extend access before creating documents.";

/** If err is a trial-expired API response, show a clear toast and return true (caller should skip generic error). */
export function maybeShowTrialExpiredToast(err: unknown): boolean {
  if (!isTrialExpiredApiError(err)) return false;
  showErrorToast(TRIAL_EXPIRED_DESCRIPTION, TRIAL_EXPIRED_TITLE);
  return true;
}
