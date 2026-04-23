"use client";

import { useMemo, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminBusinesses, useExtendBusinessValidity } from "@/hooks/use-admin-businesses";
import type { AdminBusinessListItem } from "@/types/admin";
import { showErrorToast, showSuccessToast } from "@/lib/ui/toast-helpers";
import { formatAppDateFromInstant } from "@/lib/core/date";
import { cn } from "@/lib/core/utils";

const PAGE_SIZE = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function contactDisplay(b: AdminBusinessListItem): string {
  const c = b.contactNo?.trim();
  return c || "—";
}

function ValidityCell({ validityEnd }: { validityEnd: string | null }) {
  if (!validityEnd) return <span className="text-muted-foreground">—</span>;
  const end = Date.parse(validityEnd);
  if (!Number.isFinite(end)) return <span>{validityEnd}</span>;
  const now = Date.now();
  const msLeft = end - now;
  const label = formatAppDateFromInstant(validityEnd);
  if (end < now) {
    return (
      <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <span className="tabular-nums text-muted-foreground">{label}</span>
        <Badge variant="destructive" className="text-[0.65rem] font-medium">
          Ended
        </Badge>
      </div>
    );
  }
  if (msLeft <= 7 * MS_PER_DAY) {
    return (
      <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <span className="tabular-nums text-muted-foreground">{label}</span>
        <Badge
          variant="outline"
          className="border-amber-500/40 bg-amber-500/10 text-[0.65rem] font-medium text-amber-950 dark:text-amber-100"
        >
          ≤ 7 days
        </Badge>
      </div>
    );
  }
  return <span className="tabular-nums text-muted-foreground">{label}</span>;
}

export default function AdminBusinessesPage() {
  const [offset, setOffset] = useState(0);
  const { data, isPending, error } = useAdminBusinesses(PAGE_SIZE, offset);
  const extendMutation = useExtendBusinessValidity();

  const [extendOpen, setExtendOpen] = useState(false);
  const [selected, setSelected] = useState<AdminBusinessListItem | null>(null);
  const [additionalDays, setAdditionalDays] = useState("30");
  const [remarks, setRemarks] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const items = data?.items ?? [];
  const total = data?.total ?? items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  const openExtend = (b: AdminBusinessListItem) => {
    setSelected(b);
    setAdditionalDays("30");
    setRemarks("");
    setFormError(null);
    setExtendOpen(true);
  };

  const submitExtend = async () => {
    if (!selected) return;
    const days = Number(additionalDays);
    if (!Number.isFinite(days) || days <= 0 || !Number.isInteger(days)) {
      setFormError("Enter a positive whole number of days.");
      return;
    }
    const r = remarks.trim();
    if (!r) {
      setFormError("Remarks are required.");
      return;
    }
    setFormError(null);
    try {
      await extendMutation.mutateAsync({
        businessId: selected.id,
        body: { additionalDays: days, remarks: r },
      });
      showSuccessToast("Validity extended");
      setExtendOpen(false);
      setSelected(null);
    } catch (e) {
      showErrorToast(e, "Failed to extend validity");
    }
  };

  const errMessage = useMemo(() => {
    if (!error) return null;
    return error instanceof Error ? error.message : "Failed to load businesses";
  }, [error]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Organizations"
        description="Review businesses on the platform and extend access when needed."
      />

      {errMessage && (
        <div
          className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {errMessage}
        </div>
      )}

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">All businesses</CardTitle>
              <CardDescription className="mt-1">
                {isPending ? "Loading…" : `${total} organization${total === 1 ? "" : "s"} total`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isPending ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-8 w-8" />}
              title="No businesses yet"
              description="When organizations sign up, they will appear in this list."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">Business</th>
                      <th className="px-4 py-3">Org code</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">Validity</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/25"
                      >
                        <td className="px-4 py-3.5 font-medium text-foreground">
                          {b.businessName}
                        </td>
                        <td className="px-4 py-3.5">
                          <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                            {b.organizationCode}
                          </code>
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-3.5 text-muted-foreground">
                          {b.ownerName?.trim() || "—"}
                        </td>
                        <td className="max-w-[160px] truncate px-4 py-3.5 text-muted-foreground">
                          {contactDisplay(b)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-muted-foreground">
                          {formatAppDateFromInstant(b.joiningDate)}
                        </td>
                        <td className="min-w-[200px] px-4 py-3.5">
                          <ValidityCell validityEnd={b.validityEnd} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="shadow-sm"
                            onClick={() => openExtend(b)}
                          >
                            Extend
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, total)} of {total}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canPrev}
                      onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                      className="gap-0.5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canNext}
                      onClick={() => setOffset((o) => o + PAGE_SIZE)}
                      className="gap-0.5"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend validity</DialogTitle>
            <DialogDescription>
              Add trial days for this organization. Remarks are stored for audit purposes.
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">{selected.businessName}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {selected.organizationCode}
              </p>
            </div>
          ) : null}
          <div className="space-y-3 pt-1">
            <div className="space-y-2">
              <Label htmlFor="add-days" required>
                Additional days
              </Label>
              <Input
                id="add-days"
                inputMode="numeric"
                value={additionalDays}
                onChange={(e) => setAdditionalDays(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks" required>
                Remarks
              </Label>
              <Textarea
                id="remarks"
                rows={3}
                placeholder="Reason for extension (required)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
            {formError && <FieldError>{formError}</FieldError>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setExtendOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void submitExtend()}
              disabled={extendMutation.isPending}
              className={cn(extendMutation.isPending && "opacity-80")}
            >
              {extendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply extension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
