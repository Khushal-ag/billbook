import { useBusinessProfile } from "@/hooks/use-business";
import { isDocumentCreationAllowed } from "@/lib/business-document-gate";

/**
 * After GET /business/profile loads: `true` when the account allows document creation
 * (`profileCompletion.canCreateInvoice` when present, plus active `validityEnd`).
 * `undefined` while loading (keep CTAs off); `false` on error with no data.
 */
export function useCanCreateInvoice() {
  const { data: businessProfile, isPending, isError } = useBusinessProfile();

  const canCreateInvoice: boolean | undefined = (() => {
    if (isPending && !businessProfile) return undefined;
    if (isError && !businessProfile) return false;
    if (!businessProfile) return undefined;
    return isDocumentCreationAllowed(businessProfile);
  })();

  return {
    businessProfile,
    canCreateInvoice,
    isPending,
  };
}
