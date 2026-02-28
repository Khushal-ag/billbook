import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProfileCompletion } from "@/types/auth";

const PROFILE_REQUIRED_FOR_INVOICE = 75;

interface ProfileCompletionCardProps {
  profileCompletion: ProfileCompletion;
}

export function ProfileCompletionCard({ profileCompletion }: ProfileCompletionCardProps) {
  const { percentage, canCreateInvoice } = profileCompletion;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Profile completeness</CardTitle>
        <CardDescription>
          At least {PROFILE_REQUIRED_FOR_INVOICE}% required to create invoices.
          {canCreateInvoice
            ? " Your profile meets this requirement."
            : " Complete the details below to unlock invoice creation."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center gap-4">
          <Progress value={percentage} className="h-2 flex-1" />
          <span className="text-sm font-medium tabular-nums">{percentage}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
