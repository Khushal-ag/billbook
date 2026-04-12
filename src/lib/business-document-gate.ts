import type { BusinessProfile } from "@/types/auth";
import { isValidityPeriodEnded } from "@/lib/trial";

/** Minimum weighted profile score used in UI checklist (matches server bundle for invoices). */
export const INVOICE_PROFILE_MIN_PERCENT = 75;

/**
 * Whether the business profile allows creating documents that depend on this gate,
 * when `businessProfile` is loaded. Mirrors GET /business/profile completion + validity.
 */
export function isDocumentCreationAllowed(profile: BusinessProfile): boolean {
  const pc = profile.profileCompletion;
  const profileOk = !pc || pc.canCreateInvoice === true;
  return profileOk && !isValidityPeriodEnded(profile.validityEnd);
}

export function getProfileGateFlags(profile: BusinessProfile | null | undefined) {
  const pc = profile?.profileCompletion;
  return {
    profileBlocked: pc != null && pc.canCreateInvoice !== true,
    validityBlocked: isValidityPeriodEnded(profile?.validityEnd),
  };
}
