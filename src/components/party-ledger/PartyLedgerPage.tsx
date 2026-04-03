"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  useParty,
  usePartyLedger,
  usePartyBalance,
  usePartyStatement,
  useRecordPartyAdvancePayment,
} from "@/hooks/use-parties";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import PartyLedgerSkeleton from "@/components/skeletons/PartyLedgerSkeleton";
import { BalanceSummaryCards } from "@/components/party-ledger/BalanceSummaryCards";
import { LedgerEntriesTable } from "@/components/party-ledger/LedgerEntriesTable";
import { StatementPanel } from "@/components/party-ledger/StatementPanel";
import { AdvancePaymentForm } from "@/components/party-ledger/AdvancePaymentForm";
import { requiredPriceString, optionalString } from "@/lib/validation-schemas";
import { PAYMENT_METHOD_OPTIONS } from "@/constants";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import type { PaymentMethod } from "@/types/invoice";

const advanceSchema = z.object({
  amount: requiredPriceString,
  paymentMethod: z.enum(["CASH", "CHEQUE", "UPI", "BANK_TRANSFER", "CARD"]),
  referenceNumber: optionalString,
  notes: optionalString,
});

type AdvanceFormData = {
  amount: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
};

export default function PartyLedgerPage() {
  const router = useRouter();
  const params = useParams<{ partyId?: string | string[] }>();
  const pathname = usePathname();
  const partyIdParam = Array.isArray(params?.partyId) ? params.partyId[0] : params?.partyId;
  const numPartyId = partyIdParam ? parseInt(partyIdParam, 10) : undefined;

  const routeHintsVendor = pathname?.startsWith("/vendors/");
  const fallbackBackTo = routeHintsVendor ? "/vendors" : "/parties";
  const fallbackBackLabel = routeHintsVendor ? "Back to Vendors" : "Back to Customers";

  const [tab, setTab] = useState("ledger");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const partyQuery = useParty(numPartyId);
  const party = partyQuery.data;

  const ledgerQuery = usePartyLedger(numPartyId);
  const balanceQuery = usePartyBalance(numPartyId);
  const statementJson = usePartyStatement({
    partyId: numPartyId,
    format: "json",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    enabled: tab === "statement",
  });
  const statementPdf = usePartyStatement({
    partyId: numPartyId,
    format: "pdf",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    enabled: false,
  });

  const advanceMutation = useRecordPartyAdvancePayment(numPartyId ?? 0);

  const form = useForm<AdvanceFormData>({
    resolver: zodResolver(advanceSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    },
  });
  const {
    reset,
    formState: { isSubmitting },
  } = form;

  useEffect(() => {
    setTab("ledger");
    setStartDate("");
    setEndDate("");
    reset({ amount: "", paymentMethod: "CASH", referenceNumber: "", notes: "" });
  }, [partyIdParam, reset]);

  const balanceSummary = useMemo(() => {
    return {
      current: balanceQuery.data?.currentBalance ?? "0",
      receivable: balanceQuery.data?.receivable ?? "0",
      advance: balanceQuery.data?.advance ?? "0",
    };
  }, [balanceQuery.data]);

  const handleLoadStatement = async () => {
    try {
      await statementJson.refetch();
    } catch (err) {
      showErrorToast(err, "Failed to load statement");
    }
  };

  const handleGeneratePdf = async () => {
    try {
      await statementPdf.refetch();
    } catch (err) {
      showErrorToast(err, "Failed to generate PDF");
    }
  };

  const onAdvanceSubmit = async (data: AdvanceFormData) => {
    if (!numPartyId) return;
    try {
      const res = await advanceMutation.mutateAsync({
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || undefined,
        notes: data.notes || undefined,
      });
      const receiptNo =
        res.receipt?.receiptNumber ??
        res.receiptNumber ??
        (typeof res.receiptId === "number" ? `Receipt #${res.receiptId}` : null);
      showSuccessToast(
        receiptNo
          ? `Receipt ${receiptNo} recorded — allocate this payment from the Receipts page.`
          : "Advance payment recorded",
      );
      reset({ amount: "", paymentMethod: "CASH", referenceNumber: "", notes: "" });
      ledgerQuery.refetch();
      balanceQuery.refetch();
    } catch (err) {
      showErrorToast(err, "Failed to record payment");
    }
  };

  if (partyQuery.isPending) {
    return <PartyLedgerSkeleton />;
  }

  if (!party) {
    const isLoadError = partyQuery.isError;
    return (
      <div className="page-container">
        <PageHeader
          title="Ledger"
          description="View account details"
          action={
            <Button variant="ghost" onClick={() => router.push(fallbackBackTo)} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {fallbackBackLabel}
            </Button>
          }
        />
        <ErrorBanner
          error={isLoadError ? partyQuery.error : { message: "Record not found" }}
          fallbackMessage={
            isLoadError
              ? "Failed to load party details. Check your connection and try again."
              : "The customer or vendor you're looking for does not exist."
          }
        />
      </div>
    );
  }

  const partyLabelTitle = party.type === "SUPPLIER" ? "Vendor" : "Customer";
  const partyLabel = party.type === "SUPPLIER" ? "vendor" : "customer";
  const backTo = party.type === "SUPPLIER" ? "/vendors" : "/parties";
  const backLabel = party.type === "SUPPLIER" ? "Back to Vendors" : "Back to Customers";

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={`${partyLabelTitle} Ledger - ${party.name}`}
        description={`Accounting details for this ${partyLabel}`}
        action={
          <Button variant="ghost" onClick={() => router.push(backTo)} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
        }
      />

      <ErrorBanner
        error={ledgerQuery.error ?? balanceQuery.error}
        fallbackMessage="Failed to load ledger"
      />

      <BalanceSummaryCards summary={balanceSummary} partyType={party.type} />

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="statement">Statement</TabsTrigger>
          <TabsTrigger value="advance">Advance Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="mt-4">
          <LedgerEntriesTable
            isPending={ledgerQuery.isPending}
            entries={ledgerQuery.data?.entries}
          />
        </TabsContent>

        <TabsContent value="statement" className="mt-4">
          <StatementPanel
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onLoadStatement={handleLoadStatement}
            onGeneratePdf={handleGeneratePdf}
            isFetching={statementJson.isFetching}
            statement={
              statementJson.data && "entries" in statementJson.data ? statementJson.data : null
            }
            pdf={statementPdf.data && "format" in statementPdf.data ? statementPdf.data : null}
          />
        </TabsContent>

        <TabsContent value="advance" className="mt-4">
          <AdvancePaymentForm
            form={form}
            paymentMethods={PAYMENT_METHOD_OPTIONS}
            isSubmitting={isSubmitting}
            isSaving={advanceMutation.isPending}
            onSubmit={onAdvanceSubmit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
