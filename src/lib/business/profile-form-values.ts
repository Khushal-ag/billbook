import type { ProfileForm } from "@/components/settings/profileSchema";
import { REGISTRATION_TYPES } from "@/constants";

/** Map API / free-text values onto known select option values (match value or label, any case). */
function coalesceToKnownOption(
  raw: string | null | undefined,
  options: readonly { value: string; label: string }[],
): string {
  if (raw == null) return "";
  const s = raw.trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  const hit = options.find(
    (o) => o.value === s || o.value.toLowerCase() === lower || o.label.toLowerCase() === lower,
  );
  return hit?.value ?? s;
}

export type ProfileFormSource = Partial<{
  name: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  businessType: string | null;
  industryType: string | null;
  registrationType: string | null;
  street: string | null;
  area: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  accountHolderName: string | null;
  bankAccountNumber: string | null;
  confirmAccountNumber: string | null;
  bankName: string | null;
  branchName: string | null;
  bankCity: string | null;
  bankState: string | null;
  ifscCode: string | null;
  transferAmount: string | null;
  transferCurrency: string | null;
  transferType: "NEFT" | "RTGS" | "IMPS" | "UPI" | null;
  gstin: string | null;
  pan: string | null;
  financialYearStart: number | null;
  extraDetails: Array<{ key: string; value: string }> | null;
  taxType: "GST" | "NON_GST" | null;
  logoUrl: string | null;
  signatureUrl: string | null;
}> | null;

export function getProfileFormValues(business?: ProfileFormSource): ProfileForm {
  const fy = Number(business?.financialYearStart);
  const financialYearStart = Number.isFinite(fy) && fy >= 1 && fy <= 12 ? Math.trunc(fy) : 4;

  const taxRaw = business?.taxType;
  const taxType: ProfileForm["taxType"] = taxRaw === "NON_GST" ? "NON_GST" : "GST";

  return {
    name: (business?.name ?? "").trim() || "",
    country: (business?.country ?? "").trim() || "India",
    email: (business?.email ?? "").trim(),
    phone: (business?.phone ?? "").replace(/\D/g, "").slice(0, 10),
    businessType: (business?.businessType ?? "").trim(),
    industryType: (business?.industryType ?? "").trim(),
    registrationType: coalesceToKnownOption(business?.registrationType, REGISTRATION_TYPES),
    street: (business?.street ?? "").trim(),
    area: (business?.area ?? "").trim(),
    city: (business?.city ?? "").trim(),
    state: (business?.state ?? "").trim(),
    pincode: (business?.pincode ?? "").trim(),
    accountHolderName: (business?.accountHolderName ?? "").trim(),
    bankAccountNumber: (business?.bankAccountNumber ?? "").trim(),
    confirmAccountNumber: (
      business?.confirmAccountNumber ??
      business?.bankAccountNumber ??
      ""
    ).trim(),
    bankName: (business?.bankName ?? "").trim(),
    branchName: (business?.branchName ?? "").trim(),
    bankCity: (business?.bankCity ?? "").trim(),
    bankState: (business?.bankState ?? "").trim(),
    ifscCode: (business?.ifscCode ?? "").trim().toUpperCase(),
    transferAmount: (business?.transferAmount ?? "").trim(),
    transferCurrency: (business?.transferCurrency ?? "").trim(),
    transferType: (business?.transferType ?? "") as ProfileForm["transferType"],
    gstin: (business?.gstin ?? "").trim(),
    pan: (business?.pan ?? "").trim(),
    financialYearStart,
    extraDetails: business?.extraDetails?.length ? business.extraDetails : [],
    taxType,
    logoUrl: business?.logoUrl ?? null,
    signatureUrl: business?.signatureUrl ?? null,
  };
}
