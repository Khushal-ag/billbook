import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProfileCompletion, ProfileCompletionSection } from "@/types/auth";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { INVOICE_PROFILE_MIN_PERCENT } from "@/lib/business/business-document-gate";

interface ProfileCompletionCardProps {
  profileCompletion: ProfileCompletion;
  business?: {
    name?: string | null;
    country?: string | null;
    street?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    accountHolderName?: string | null;
    bankAccountNumber?: string | null;
    bankName?: string | null;
    branchName?: string | null;
    ifscCode?: string | null;
    bankCity?: string | null;
    bankState?: string | null;
  };
}

function isFilled(value: string | null | undefined) {
  return (value ?? "").trim() !== "";
}

function sectionComplete(
  section: ProfileCompletionSection | undefined,
  fieldFallback: boolean,
): boolean {
  if (section) return section.complete;
  return fieldFallback;
}

function missingOrHint(missing: string[], hint: string) {
  return missing.length > 0 ? missing : [hint];
}

function ChecklistRow({
  complete,
  label,
  missing,
}: {
  complete: boolean;
  label: string;
  missing: string[];
}) {
  return (
    <li className="text-sm">
      <div className="flex items-start gap-2">
        {complete ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        ) : (
          <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        )}
        <div className="min-w-0">
          <p className="font-medium">{label}</p>
          {!complete && missing.length > 0 ? (
            <p className="text-xs text-muted-foreground">{missing.join(" · ")}</p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function ProfileCompletionCard({ profileCompletion, business }: ProfileCompletionCardProps) {
  const { percentage, canCreateInvoice, breakdown = {} } = profileCompletion;

  const registrationMissing: string[] = [];
  if (!isFilled(business?.name)) registrationMissing.push("Business name");
  if (!isFilled(business?.country)) registrationMissing.push("Country");

  const addressMissing: string[] = [];
  if (!isFilled(business?.street)) addressMissing.push("Street");
  if (!isFilled(business?.city)) addressMissing.push("City");
  if (!isFilled(business?.state)) addressMissing.push("State");
  if (!isFilled(business?.pincode)) addressMissing.push("Pincode");

  const bankMissing: string[] = [];
  if (!isFilled(business?.accountHolderName)) bankMissing.push("Account holder name");
  if (!isFilled(business?.bankAccountNumber)) bankMissing.push("Bank account number");
  if (!isFilled(business?.bankName)) bankMissing.push("Bank name");
  if (!isFilled(business?.branchName)) bankMissing.push("Branch name");
  if (!isFilled(business?.ifscCode)) bankMissing.push("IFSC code");
  if (!isFilled(business?.bankCity)) bankMissing.push("Bank city");
  if (!isFilled(business?.bankState)) bankMissing.push("Bank state");

  const weightedOk = percentage >= INVOICE_PROFILE_MIN_PERCENT;
  const regComplete = sectionComplete(breakdown.registration, registrationMissing.length === 0);
  const addrComplete = sectionComplete(breakdown.address, addressMissing.length === 0);
  const bankComplete = sectionComplete(breakdown.bank, bankMissing.length === 0);

  const gateRows = [
    {
      label: `Overall score (at least ${INVOICE_PROFILE_MIN_PERCENT}%)`,
      complete: weightedOk,
      missing: weightedOk ? [] : [`Currently ${percentage}%`],
    },
    {
      label: "Business name and country",
      complete: regComplete,
      missing: regComplete ? [] : missingOrHint(registrationMissing, "Review name and country"),
    },
    {
      label: "Address — Street · City · State · Pincode (Area optional)",
      complete: addrComplete,
      missing: addrComplete ? [] : missingOrHint(addressMissing, "Review address"),
    },
    {
      label:
        "Bank — Account holder name · Bank account number · Bank name · Branch name · IFSC code · Bank city · Bank state",
      complete: bankComplete,
      missing: bankComplete ? [] : missingOrHint(bankMissing, "Review bank details"),
    },
  ] as const;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Invoices and your profile</CardTitle>
        <CardDescription>
          Invoices need enough overall completion (including name and country), a full address, and
          full bank details. Fill anything still open below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center gap-4">
          <Progress value={percentage} className="h-2 flex-1" />
          <span className="text-sm font-medium tabular-nums">{percentage}%</span>
        </div>

        <div className="flex items-start gap-2 rounded-md border bg-muted/20 px-3 py-2.5">
          {canCreateInvoice ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          )}
          <div>
            <p className="text-sm font-medium">
              {canCreateInvoice ? "You can create invoices" : "You cannot create invoices yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              Use the checklist below for score, address, and bank.
            </p>
          </div>
        </div>

        <div className="rounded-md border bg-muted/30 p-3">
          <p className="mb-2 text-sm font-medium text-foreground">Checklist</p>
          <ul className="space-y-2">
            {gateRows.map((item) => (
              <ChecklistRow key={item.label} {...item} />
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
