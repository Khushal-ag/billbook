import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  useParties,
  usePartyLedger,
  usePartyBalance,
  usePartyStatement,
  useRecordPartyAdvancePayment,
} from "@/hooks/use-parties";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import SettingsSkeleton from "@/components/skeletons/SettingsSkeleton";
import { BalanceSummaryCards } from "@/components/party-ledger/BalanceSummaryCards";
import { LedgerEntriesTable } from "@/components/party-ledger/LedgerEntriesTable";
import { StatementPanel } from "@/components/party-ledger/StatementPanel";
import { AdvancePaymentForm } from "@/components/party-ledger/AdvancePaymentForm";
import { requiredPriceString, optionalString } from "@/lib/validation-schemas";
import type { PaymentMethod } from "@/types/invoice";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";

const advanceSchema = z.object({
  amount: requiredPriceString,
  paymentMethod: z.enum(["CASH", "CHEQUE", "UPI", "BANK_TRANSFER", "CARD"]),
  referenceNumber: optionalString,
  notes: optionalString,
});

type AdvanceFormData = z.infer<typeof advanceSchema>;

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
];

export default function PartyLedger() {
  const navigate = useNavigate();
  const { partyId } = useParams<{ partyId: string }>();
  const numPartyId = partyId ? parseInt(partyId, 10) : undefined;

  const [tab, setTab] = useState("ledger");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch party details
  const partiesQuery = useParties({ type: "CUSTOMER" });
  const party = partiesQuery.data?.parties?.find((p) => p.id === numPartyId);

  // Fetch ledger data
  const ledgerQuery = usePartyLedger(numPartyId);
  const balanceQuery = usePartyBalance(numPartyId);
  const statementJson = usePartyStatement({
    partyId: numPartyId,
    format: "json",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    enabled: false,
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
  }, [partyId, reset]);

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
      await advanceMutation.mutateAsync({
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || undefined,
        notes: data.notes || undefined,
      });
      showSuccessToast("Advance payment recorded");
      reset({ amount: "", paymentMethod: "CASH", referenceNumber: "", notes: "" });
      ledgerQuery.refetch();
      balanceQuery.refetch();
    } catch (err) {
      showErrorToast(err, "Failed to record payment");
    }
  };

  if (partiesQuery.isPending) {
    return <SettingsSkeleton />;
  }

  if (!party) {
    return (
      <div className="page-container">
        <PageHeader
          title="Party Ledger"
          description="View party accounting details"
          action={
            <Button variant="ghost" onClick={() => navigate("/parties")} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          }
        />
        <ErrorBanner
          error={{ message: "Party not found" }}
          fallbackMessage="The party you're looking for does not exist."
        />
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={`Party Ledger - ${party.name}`}
        description={`Accounting details for ${party.name}`}
        action={
          <Button variant="ghost" onClick={() => navigate("/parties")} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Parties
          </Button>
        }
      />

      <ErrorBanner error={ledgerQuery.error} fallbackMessage="Failed to load ledger" />

      <BalanceSummaryCards summary={balanceSummary} />

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
            paymentMethods={paymentMethods}
            isSubmitting={isSubmitting}
            isSaving={advanceMutation.isPending}
            onSubmit={onAdvanceSubmit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
