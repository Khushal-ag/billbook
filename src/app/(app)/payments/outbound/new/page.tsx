"use client";

import { Wallet } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OutboundPaymentCreateForm } from "@/components/outbound-payments/OutboundPaymentCreateForm";

export default function NewOutboundPaymentPage() {
  return (
    <div className="page-container max-w-3xl animate-fade-in pb-10">
      <PageHeader
        title="Record payment"
        description="Pick payment type, customer or vendor, then link returns or bills if needed. Each save creates a voucher you can open as PDF."
        backHref="/payments/outbound"
        backLabel="Back to payments"
      />

      <Card className="overflow-hidden rounded-2xl border-border/70 shadow-md ring-1 ring-border/50">
        <CardHeader className="border-b border-border/60 bg-gradient-to-br from-muted/40 via-card to-card pb-5 sm:pb-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Wallet className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-xl tracking-tight">Payment details</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Amount updates when you pick documents in the popup. Choosing several rows creates
                one payment per document (same method, reference, and notes).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <OutboundPaymentCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
