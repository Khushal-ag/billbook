"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParty, usePartyLedger, usePartyBalance, usePartyStatement } from "@/hooks/use-parties";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import PartyLedgerSkeleton from "@/components/skeletons/PartyLedgerSkeleton";
import { BalanceSummaryCards } from "@/components/party-ledger/BalanceSummaryCards";
import { LedgerEntriesTable } from "@/components/party-ledger/LedgerEntriesTable";
import { StatementPanel } from "@/components/party-ledger/StatementPanel";
import { showErrorToast } from "@/lib/toast-helpers";

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

  useEffect(() => {
    setTab("ledger");
    setStartDate("");
    setEndDate("");
  }, [partyIdParam]);

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

  const paymentHref =
    party.type === "CUSTOMER" ? "/receipts?openNewReceipt=1" : "/payments/outbound/new";
  const paymentLabel = party.type === "CUSTOMER" ? "New receipt" : "Outbound payment";

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={`${partyLabelTitle} ledger — ${party.name}`}
        description={`Activity and balance for this ${partyLabel}`}
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

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-red-600 dark:text-red-400">Debit</span> and{" "}
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Credit</span> show
          which way the balance runs; the rupee figure is always positive.
        </p>
        <Button variant="outline" size="sm" className="shrink-0 self-start sm:self-auto" asChild>
          <Link href={paymentHref}>{paymentLabel}</Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="statement">Statement</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
