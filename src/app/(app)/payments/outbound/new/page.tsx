"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { OutboundPaymentCreateForm } from "@/components/outbound-payments/OutboundPaymentCreateForm";

export default function NewOutboundPaymentPage() {
  return (
    <div className="page-container max-w-3xl animate-fade-in">
      <PageHeader
        title="New outbound payment"
        description="Refund a sale return, pay a party, or log an expense."
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/payments/outbound">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to list
            </Link>
          </Button>
        }
      />
      <OutboundPaymentCreateForm />
    </div>
  );
}
