"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import EmptyState from "@/components/EmptyState";
import { ReceiptsTable } from "@/components/receipts/ReceiptSections";
import { NewReceiptDialog } from "@/components/dialogs/NewReceiptDialog";
import { useReceipts } from "@/hooks/use-receipts";

export default function ReceiptsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newReceiptOpen, setNewReceiptOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, isPending, error } = useReceipts({ page, pageSize });

  useEffect(() => {
    if (searchParams.get("openNewReceipt") === "1") {
      setNewReceiptOpen(true);
      router.replace("/receipts", { scroll: false });
    }
  }, [searchParams, router]);

  const receipts = data?.receipts ?? [];
  const total = data?.count ?? receipts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page-container max-w-[96rem] animate-fade-in">
      <PageHeader
        title="Receipts"
        description="Money received from parties — allocate unapplied balance to invoices."
        action={
          <Button type="button" onClick={() => setNewReceiptOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New receipt
          </Button>
        }
      />

      <NewReceiptDialog open={newReceiptOpen} onOpenChange={setNewReceiptOpen} />

      <ErrorBanner error={error} fallbackMessage="Failed to load receipts" />

      {isPending ? (
        <TableSkeleton rows={8} />
      ) : receipts.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-8 w-8" />}
          title="No receipts yet"
          description="Create a receipt here, record payment on an invoice, or record a party advance."
          action={
            <Button type="button" onClick={() => setNewReceiptOpen(true)}>
              New receipt
            </Button>
          }
        />
      ) : (
        <ReceiptsTable
          receipts={receipts}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
