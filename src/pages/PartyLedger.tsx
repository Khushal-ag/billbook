import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Download, RefreshCcw } from "lucide-react";
import {
  useParties,
  usePartyLedger,
  usePartyBalance,
  usePartyStatement,
  useRecordPartyAdvancePayment,
} from "@/hooks/use-parties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import SettingsSkeleton from "@/components/skeletons/SettingsSkeleton";
import DateRangePicker from "@/components/DateRangePicker";
import { formatCurrency, formatDate } from "@/lib/utils";
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdvanceFormData>({
    resolver: zodResolver(advanceSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    },
  });

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

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Current Balance</p>
          <p className="mt-1 text-sm font-semibold">{formatCurrency(balanceSummary.current)}</p>
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Receivable</p>
          <p className="mt-1 text-sm font-semibold">{formatCurrency(balanceSummary.receivable)}</p>
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Advance</p>
          <p className="mt-1 text-sm font-semibold">{formatCurrency(balanceSummary.advance)}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="statement">Statement</TabsTrigger>
          <TabsTrigger value="advance">Advance Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="mt-4">
          {ledgerQuery.isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading ledger...
            </div>
          ) : ledgerQuery.data?.entries?.length ? (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-right font-medium">Debit</th>
                    <th className="px-3 py-2 text-right font-medium">Credit</th>
                    <th className="px-3 py-2 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerQuery.data.entries.map((entry, idx) => (
                    <tr key={`${entry.entryType}-${idx}`} className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatDate(entry.entryDate)}
                      </td>
                      <td className="px-3 py-2">{entry.entryType}</td>
                      <td className="px-3 py-2 text-right">
                        {entry.debitAmount ? formatCurrency(entry.debitAmount) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {entry.creditAmount ? formatCurrency(entry.creditAmount) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-md border bg-muted/10 p-4 text-sm text-muted-foreground">
              No ledger entries yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="statement" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadStatement}
                className="w-full sm:w-auto"
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Load Statement
              </Button>
              <Button type="button" onClick={handleGeneratePdf} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" /> PDF
              </Button>
            </div>
          </div>

          {statementJson.isFetching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading statement...
            </div>
          )}

          {statementJson.data && "entries" in statementJson.data && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Opening:</span>{" "}
                  {formatCurrency(statementJson.data.openingBalance)}
                </div>
                <div>
                  <span className="text-muted-foreground">Closing:</span>{" "}
                  {formatCurrency(statementJson.data.closingBalance)}
                </div>
                <div>
                  <span className="text-muted-foreground">Debit:</span>{" "}
                  {formatCurrency(statementJson.data.totals.debit)}
                </div>
                <div>
                  <span className="text-muted-foreground">Credit:</span>{" "}
                  {formatCurrency(statementJson.data.totals.credit)}
                </div>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Type</th>
                      <th className="px-3 py-2 text-right font-medium">Debit</th>
                      <th className="px-3 py-2 text-right font-medium">Credit</th>
                      <th className="px-3 py-2 text-right font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementJson.data.entries.map((entry, idx) => (
                      <tr key={`${entry.entryType}-${idx}`} className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">
                          {formatDate(entry.entryDate)}
                        </td>
                        <td className="px-3 py-2">{entry.entryType}</td>
                        <td className="px-3 py-2 text-right">
                          {entry.debitAmount ? formatCurrency(entry.debitAmount) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {entry.creditAmount ? formatCurrency(entry.creditAmount) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatCurrency(entry.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {statementPdf.data && "format" in statementPdf.data && (
            <div className="rounded-md border bg-muted/20 p-3 text-sm">
              {statementPdf.data.storageConfigured ? (
                <div className="flex items-center justify-between gap-3">
                  <span>PDF ready.</span>
                  {statementPdf.data.downloadUrl && (
                    <Button asChild size="sm" variant="outline">
                      <a href={statementPdf.data.downloadUrl} target="_blank" rel="noreferrer">
                        Download PDF
                      </a>
                    </Button>
                  )}
                </div>
              ) : (
                <span>PDF storage is not configured.</span>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="advance" className="mt-4">
          <form onSubmit={handleSubmit(onAdvanceSubmit)} className="max-w-2xl space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input placeholder="0.00" {...register("amount")} />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={watch("paymentMethod")}
                  onValueChange={(v) => setValue("paymentMethod", v as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input placeholder="e.g. UPI / cheque" {...register("referenceNumber")} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input placeholder="Optional note" {...register("notes")} />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting || advanceMutation.isPending}>
                {advanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Advance
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
