"use client";

import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OutboundPaymentCreateForm } from "@/components/outbound-payments/OutboundPaymentCreateForm";

export default function NewOutboundPaymentPage() {
  return (
    <div className="page-container max-w-2xl animate-fade-in pb-10">
      <PageHeader
        title="Record payout"
        description="Create a voucher for a refund, supplier payment, or expense."
        backHref="/payments/outbound"
        backLabel="Back to payouts"
      />

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="space-y-1 border-b border-border/60 pb-4">
          <CardTitle className="text-lg">Payout details</CardTitle>
          <CardDescription>
            Choose the payout type, then fill in the party or payee and amount. You can download a
            PDF voucher after saving.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <OutboundPaymentCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
