"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createLine,
  formatQty,
  getCostFloorViolation,
  getEntryDateIso,
  getEntryTotalQty,
  getLineAmounts,
  getMaxAllowedDiscountPercent,
  itemFromStockEntry,
  toNum,
} from "@/lib/invoice-create";
import type { InvoiceLineDraft, StockChoice, StockLineIssue } from "@/types/invoice-create";
import { useCreateInvoice, useInvoice, useNextInvoiceNumber } from "@/hooks/use-invoices";
import {
  getStockEntryById,
  useItems,
  useStockEntries,
  useStockEntriesByIds,
} from "@/hooks/use-items";
import { useParties } from "@/hooks/use-parties";
import { useDebounce } from "@/hooks/use-debounce";
import { getInvoiceTypeCreateCopy, INVOICE_TYPE_OPTIONS, isSalesFamily } from "@/lib/invoice";
import { formatCurrency } from "@/lib/utils";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import type { Item, StockEntry } from "@/types/item";
import type { Party } from "@/types/party";
import type { InvoiceType } from "@/types/invoice";

export function useInvoiceCreateState(initialType: InvoiceType, sourceInvoiceId?: number) {
  const router = useRouter();
  const createInvoice = useCreateInvoice();
  const invoiceType = initialType;
  const hasHydratedSourceInvoice = useRef(false);

  const [party, setParty] = useState<Party | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [roundOffAmount, setRoundOffAmount] = useState("0");
  const [autoRoundOff, setAutoRoundOff] = useState(false);
  const [lines, setLines] = useState<InvoiceLineDraft[]>(() => [createLine()]);

  const [addPartyDialogOpen, setAddPartyDialogOpen] = useState(false);
  const [pendingPartyName, setPendingPartyName] = useState("");
  const [stockSearchOpen, setStockSearchOpen] = useState(false);
  const [stockSearchText, setStockSearchText] = useState("");
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [pendingItemName, setPendingItemName] = useState("");
  const [qtyAutoAdjusted, setQtyAutoAdjusted] = useState(false);
  const [stockLineIssues, setStockLineIssues] = useState<Record<string, StockLineIssue>>({});
  const [focusedIssueLineId, setFocusedIssueLineId] = useState<string | null>(null);

  const debouncedStockSearch = useDebounce(stockSearchText, 300);
  const stockSearchQuery = debouncedStockSearch.trim();
  const partyType: "CUSTOMER" | "SUPPLIER" = isSalesFamily(invoiceType) ? "CUSTOMER" : "SUPPLIER";
  const pageMeta =
    INVOICE_TYPE_OPTIONS.find((o) => o.type === invoiceType) ?? INVOICE_TYPE_OPTIONS[0];

  const { data: partiesData } = useParties({ type: partyType, includeInactive: false });
  /** Only while the batch popover is open; avoids /items + /stock-entries on every keystroke site-wide. */
  const { data: itemsData } = useItems(
    {
      includeInactive: false,
      search: stockSearchQuery || undefined,
      limit: 100,
    },
    {
      enabled: stockSearchOpen && stockSearchQuery.length > 0,
      staleTime: 30_000,
    },
  );
  const { data: stockEntriesData, error: stockEntriesError } = useStockEntries(
    {
      search: stockSearchQuery || undefined,
      limit: 100,
    },
    { enabled: stockSearchOpen, staleTime: 30_000 },
  );
  const { data: sourceInvoice } = useInvoice(sourceInvoiceId);
  const { data: nextInvoiceNumber, isPending: isNextInvoiceNumberPending } = useNextInvoiceNumber({
    invoiceDate,
  });
  const sourceEntryIds = useMemo(
    () => sourceInvoice?.items.map((line) => line.stockEntryId) ?? [],
    [sourceInvoice?.items],
  );
  const neededStockEntryIds = useMemo(() => {
    const s = new Set<number>();
    for (const id of sourceEntryIds) {
      if (Number.isFinite(id)) s.add(id);
    }
    for (const line of lines) {
      if (line.stockEntryId != null && Number.isFinite(line.stockEntryId)) {
        s.add(line.stockEntryId);
      }
    }
    return Array.from(s);
  }, [sourceEntryIds, lines]);
  const stockEntryByIdQuery = useStockEntriesByIds(neededStockEntryIds);

  const parties = useMemo(
    () => (partiesData?.parties ?? []).filter((p) => p.isActive),
    [partiesData],
  );
  const items = useMemo(() => (itemsData?.items ?? []).filter((i) => i.isActive), [itemsData]);
  const stockEntries = useMemo(() => {
    const byId = new Map<number, StockEntry>();
    if (stockEntryByIdQuery.data) {
      for (const e of Object.values(stockEntryByIdQuery.data)) {
        byId.set(e.id, e);
      }
    }
    for (const e of stockEntriesData?.entries ?? []) {
      byId.set(e.id, e);
    }
    return [...byId.values()];
  }, [stockEntryByIdQuery.data, stockEntriesData?.entries]);
  const itemMap = useMemo(() => {
    const map = new Map<number, Item>();
    for (const item of items) {
      map.set(item.id, item);
    }
    for (const entry of stockEntries) {
      if (!map.has(entry.itemId)) {
        map.set(entry.itemId, itemFromStockEntry(entry));
      }
    }
    return map;
  }, [items, stockEntries]);

  const draftLine = lines[0] ?? createLine();
  const addedLines = lines.slice(1);

  const usedQtyByEntryId = useMemo(() => {
    const map = new Map<number, number>();
    for (const line of addedLines) {
      if (line.stockEntryId == null) continue;
      const qty = Math.max(0, toNum(line.quantity));
      map.set(line.stockEntryId, (map.get(line.stockEntryId) ?? 0) + qty);
    }
    return map;
  }, [addedLines]);

  const stockChoices = useMemo(() => {
    const grouped = new Map<number, StockEntry[]>();
    for (const entry of stockEntries) {
      const item = itemMap.get(entry.itemId);
      if (!item || !item.isActive) continue;
      const list = grouped.get(entry.itemId) ?? [];
      list.push(entry);
      grouped.set(entry.itemId, list);
    }

    const result: StockChoice[] = [];
    for (const [itemId, entryList] of grouped.entries()) {
      const sorted = [...entryList].sort((a, b) => {
        const aTime = new Date(a.purchaseDate ?? a.createdAt).getTime();
        const bTime = new Date(b.purchaseDate ?? b.createdAt).getTime();
        return aTime - bTime;
      });
      const item = itemMap.get(itemId);
      if (!item) continue;
      const isService = item.type === "SERVICE";
      const firstAvailableIndex = sorted.findIndex((entry) => {
        if (isService) return true;
        const available = getEntryTotalQty(entry);
        const used = usedQtyByEntryId.get(entry.id) ?? 0;
        return available - used > 0;
      });

      for (let index = 0; index < sorted.length; index += 1) {
        const entry = sorted[index];
        const availableQty = getEntryTotalQty(entry);
        const usedQty = usedQtyByEntryId.get(entry.id) ?? 0;
        const remainingQty = Math.max(0, availableQty - usedQty);
        if (!isService && remainingQty <= 0) continue;
        const enabledForSelection =
          isService ||
          (firstAvailableIndex >= 0 && index === firstAvailableIndex && remainingQty > 0);

        result.push({
          entry,
          item,
          availableQty,
          usedQty,
          remainingQty,
          enabledForSelection,
        });
      }
    }

    result.sort((a, b) => {
      const itemCompare = a.item.name.localeCompare(b.item.name);
      if (itemCompare !== 0) return itemCompare;
      const aTime = new Date(a.entry.purchaseDate ?? a.entry.createdAt).getTime();
      const bTime = new Date(b.entry.purchaseDate ?? b.entry.createdAt).getTime();
      return aTime - bTime;
    });

    return result;
  }, [stockEntries, itemMap, usedQtyByEntryId]);

  const filteredStockChoices = useMemo(() => {
    const q = stockSearchText.trim().toLowerCase();
    if (!q) return stockChoices;
    return stockChoices.filter((choice) => {
      const text = [
        choice.item.name,
        String(choice.entry.id),
        choice.entry.supplierName ?? "",
        getEntryDateIso(choice.entry),
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [stockChoices, stockSearchText]);

  const itemsWithoutStockOptions = useMemo(() => {
    const itemIdsWithChoices = new Set(stockChoices.map((c) => c.item.id));
    const candidates = items.filter(
      (item) => item.type === "STOCK" && item.isActive && !itemIdsWithChoices.has(item.id),
    );
    const q = stockSearchText.trim().toLowerCase();
    if (!q) return candidates.slice(0, 20);
    return candidates.filter((item) => item.name.toLowerCase().includes(q)).slice(0, 20);
  }, [items, stockChoices, stockSearchText]);

  const exactItemMatch = useMemo(() => {
    const q = stockSearchText.trim().toLowerCase();
    if (!q) return false;
    return items.some((item) => item.name.trim().toLowerCase() === q);
  }, [items, stockSearchText]);

  const showAddItemOption =
    stockSearchText.trim().length > 0 &&
    !exactItemMatch &&
    filteredStockChoices.length === 0 &&
    itemsWithoutStockOptions.length === 0;

  const summary = useMemo(() => {
    const lineBreakup = addedLines.map((line) => getLineAmounts(line));
    const subTotal = lineBreakup.reduce((sum, x) => sum + x.gross, 0);
    const lineDiscountTotal = lineBreakup.reduce((sum, x) => sum + x.lineDiscount, 0);
    const taxableTotal = lineBreakup.reduce((sum, x) => sum + x.taxable, 0);
    const taxTotal = lineBreakup.reduce((sum, x) => sum + x.tax, 0);

    const invoiceDiscount = discountAmount.trim()
      ? Math.max(0, toNum(discountAmount))
      : (subTotal * Math.max(0, toNum(discountPercent))) / 100;

    const baseTotal = Math.max(0, taxableTotal + taxTotal - invoiceDiscount);
    const roundOff = autoRoundOff ? Math.round(baseTotal) - baseTotal : toNum(roundOffAmount);
    const grandTotal = Math.max(0, baseTotal + roundOff);

    return {
      subTotal,
      lineDiscountTotal,
      taxableTotal,
      invoiceDiscount,
      taxTotal,
      taxPercent: taxableTotal > 0 ? (taxTotal / taxableTotal) * 100 : 0,
      roundOff,
      grandTotal,
    };
  }, [addedLines, discountAmount, discountPercent, roundOffAmount, autoRoundOff]);

  const isLineValid = useCallback((line: InvoiceLineDraft) => {
    if (!line.item) return false;
    if (line.stockEntryId == null) return false;
    const qty = toNum(line.quantity);
    return Number.isFinite(qty) && qty > 0;
  }, []);

  const canSubmit = party != null && addedLines.length > 0;
  const roundOffInputValue = autoRoundOff ? summary.roundOff.toFixed(2) : roundOffAmount;

  useEffect(() => {
    const sourceConfigByReturnType: Record<
      InvoiceType,
      { sourceType: InvoiceType; partyType: "CUSTOMER" | "SUPPLIER"; notePrefix: string } | null
    > = {
      SALE_RETURN: {
        sourceType: "SALE_INVOICE",
        partyType: "CUSTOMER",
        notePrefix: "Sales return against",
      },
      PURCHASE_RETURN: {
        sourceType: "PURCHASE_INVOICE",
        partyType: "SUPPLIER",
        notePrefix: "Purchase return against",
      },
      SALE_INVOICE: null,
      PURCHASE_INVOICE: null,
    };

    const sourceConfig = sourceConfigByReturnType[invoiceType];
    if (!sourceConfig) return;
    if (!sourceInvoiceId) return;
    if (hasHydratedSourceInvoice.current) return;
    if (!sourceInvoice) return;
    if (sourceInvoice.invoiceType !== sourceConfig.sourceType) return;
    if (!stockEntryByIdQuery.data) return;

    const partyFromList = parties.find((p) => p.id === sourceInvoice.partyId);
    const fallbackParty: Party = {
      id: sourceInvoice.partyId,
      businessId: sourceInvoice.businessId,
      name:
        sourceInvoice.partyName ??
        (sourceConfig.partyType === "SUPPLIER" ? "Supplier" : "Customer"),
      type: sourceConfig.partyType,
      gstin: null,
      email: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      postalCode: null,
      openingBalance: null,
      isActive: true,
      createdAt: sourceInvoice.createdAt,
      updatedAt: sourceInvoice.updatedAt,
    };
    setParty(partyFromList ?? fallbackParty);

    const prefilledLines: InvoiceLineDraft[] = [];

    for (const invoiceItem of sourceInvoice.items) {
      const entry = stockEntryByIdQuery.data?.[invoiceItem.stockEntryId];
      if (!entry) continue;

      const catalogItem = itemMap.get(entry.itemId);
      const entryItem = entry.item;
      const resolvedItem =
        catalogItem ??
        (entryItem
          ? {
              id: entryItem.id,
              businessId: sourceInvoice.businessId,
              name: entryItem.name,
              type: entry.itemType ?? "STOCK",
              hsnCode:
                "hsnCode" in entryItem
                  ? ((entryItem.hsnCode as string | null | undefined) ?? null)
                  : (invoiceItem.hsnCode ?? null),
              sacCode:
                "sacCode" in entryItem
                  ? ((entryItem.sacCode as string | null | undefined) ?? null)
                  : (invoiceItem.sacCode ?? null),
              categoryId: null,
              categoryName: entry.categoryName ?? null,
              category: entry.categoryName ?? null,
              unit: entry.unit ?? "pcs",
              description: null,
              isTaxable: true,
              taxType: "GST" as const,
              cgstRate:
                "cgstRate" in entryItem
                  ? ((entryItem.cgstRate as string | null | undefined) ?? null)
                  : (invoiceItem.cgstRate ?? "0"),
              sgstRate:
                "sgstRate" in entryItem
                  ? ((entryItem.sgstRate as string | null | undefined) ?? null)
                  : (invoiceItem.sgstRate ?? "0"),
              igstRate:
                "igstRate" in entryItem
                  ? ((entryItem.igstRate as string | null | undefined) ?? null)
                  : (invoiceItem.igstRate ?? "0"),
              otherTaxName: null,
              otherTaxRate: null,
              minStockThreshold: null,
              isActive: true,
              createdAt: sourceInvoice.createdAt,
              updatedAt: sourceInvoice.updatedAt,
            }
          : null);

      if (!resolvedItem) continue;

      prefilledLines.push({
        id: crypto.randomUUID(),
        item: resolvedItem,
        stockEntryId: invoiceItem.stockEntryId,
        quantity: invoiceItem.quantity,
        unitPrice: invoiceItem.unitPrice || entry.sellingPrice || "",
        discountPercent: invoiceItem.discountPercent ?? "0",
        cgstRate: resolvedItem.cgstRate ?? "0",
        sgstRate: resolvedItem.sgstRate ?? "0",
        igstRate: resolvedItem.igstRate ?? "0",
      });
    }

    if (prefilledLines.length > 0) {
      setLines([createLine(), ...prefilledLines]);
    }

    if (!notes.trim()) {
      setNotes(`${sourceConfig.notePrefix} ${sourceInvoice.invoiceNumber}`);
    }

    hasHydratedSourceInvoice.current = true;
  }, [
    invoiceType,
    sourceInvoiceId,
    sourceInvoice,
    stockEntryByIdQuery.data,
    parties,
    itemMap,
    notes,
  ]);

  const updateLine = useCallback((lineId: string, patch: Partial<InvoiceLineDraft>) => {
    setLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
    setStockLineIssues((prev) => {
      if (!prev[lineId]) return prev;
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
  }, []);

  const handleStockChoiceSelect = useCallback(
    (lineId: string, choice: StockChoice) => {
      if (!choice.enabledForSelection) return;
      updateLine(lineId, {
        item: choice.item,
        stockEntryId: choice.entry.id,
        unitPrice: choice.entry.sellingPrice ?? "",
        quantity: "1",
        discountPercent: "",
        cgstRate: choice.item.cgstRate ?? "0",
        sgstRate: choice.item.sgstRate ?? "0",
        igstRate: choice.item.igstRate ?? "0",
      });
      setStockSearchOpen(false);
      setStockSearchText("");
    },
    [updateLine],
  );

  const handleAddStockForItem = useCallback(
    (item: Item) => {
      const params = new URLSearchParams({ addItemId: String(item.id) });
      router.push(`/stock?${params.toString()}`);
    },
    [router],
  );

  const handleLineDiscountChange = useCallback(
    (lineId: string, value: string) => {
      const line = lines.find((x) => x.id === lineId);
      if (!line) return;

      if (value.trim() === "") {
        updateLine(lineId, { discountPercent: "" });
        return;
      }

      const parsed = toNum(value);
      const safePercent = Math.min(100, Math.max(0, parsed));
      const maxAllowed = getMaxAllowedDiscountPercent(line, stockEntries);

      if (safePercent > maxAllowed) {
        updateLine(lineId, { discountPercent: maxAllowed.toFixed(2) });
        showErrorToast(
          null,
          "Discount cannot reduce selling price below cost price for this stock batch",
        );
        return;
      }

      updateLine(lineId, { discountPercent: value });
    },
    [lines, stockEntries, updateLine],
  );

  const addCurrentLine = useCallback(async () => {
    if (!isLineValid(draftLine)) {
      showErrorToast(null, "Complete item entry before adding");
      return;
    }

    const selectedEntryId = draftLine.stockEntryId;
    const selectedEntry =
      selectedEntryId == null
        ? undefined
        : ((await getStockEntryById(selectedEntryId).catch(() => null)) ??
          stockEntries.find((entry) => entry.id === selectedEntryId));

    if (selectedEntry) {
      const available = getEntryTotalQty(selectedEntry);
      const used = usedQtyByEntryId.get(selectedEntry.id) ?? 0;
      const remaining = Math.max(0, available - used);
      const requested = Math.max(0, toNum(draftLine.quantity));

      if (requested > remaining) {
        if (remaining <= 0) {
          showErrorToast(
            null,
            "Selected batch is fully used. Please choose the next available batch.",
          );
          return;
        }
        updateLine(draftLine.id, { quantity: formatQty(remaining) });
        setQtyAutoAdjusted(true);
        showErrorToast(
          null,
          `Only ${formatQty(remaining)} available in this batch. Quantity updated to max available. Click Add again.`,
        );
        return;
      }
    } else {
      showErrorToast(null, "Unable to validate selected stock batch. Please reselect the batch.");
      return;
    }

    const costViolation = getCostFloorViolation(draftLine, stockEntries);
    if (costViolation) {
      showErrorToast(
        null,
        `Discount is too high. Net rate (${formatCurrency(costViolation.netUnitPrice)}) cannot be below cost (${formatCurrency(costViolation.costPrice)}).`,
      );
      return;
    }

    setLines((prev) => {
      const current = prev[0] ?? createLine();
      const normalizedCurrent = {
        ...current,
        discountPercent: current.discountPercent.trim() === "" ? "0" : current.discountPercent,
      };
      return [createLine(), normalizedCurrent, ...prev.slice(1)];
    });
    setStockLineIssues({});
  }, [draftLine, isLineValid, stockEntries, usedQtyByEntryId, updateLine]);

  const removeAddedLine = useCallback((lineId: string) => {
    setLines((prev) => [prev[0], ...prev.slice(1).filter((line) => line.id !== lineId)]);
    setStockLineIssues((prev) => {
      if (!prev[lineId]) return prev;
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
  }, []);

  const validateLiveStockForAddedLines = useCallback(async (): Promise<StockLineIssue[]> => {
    const issues: StockLineIssue[] = [];
    const linesByEntryId = new Map<number, InvoiceLineDraft[]>();

    for (const line of addedLines) {
      if (line.stockEntryId == null) continue;
      const list = linesByEntryId.get(line.stockEntryId) ?? [];
      list.push(line);
      linesByEntryId.set(line.stockEntryId, list);
    }

    for (const [entryId, entryLines] of linesByEntryId.entries()) {
      const liveEntry = await getStockEntryById(entryId).catch(() => null);
      if (!liveEntry) {
        for (const line of entryLines) {
          issues.push({
            lineId: line.id,
            entryId,
            itemName: line.item?.name ?? "selected item",
            selectedQty: Math.max(0, toNum(line.quantity)),
            availableQty: 0,
            suggestedQty: 0,
            message: "Could not validate this batch. Please reselect batch.",
          });
        }
        continue;
      }

      let remaining = Math.max(0, getEntryTotalQty(liveEntry));
      for (const line of entryLines) {
        const selectedQty = Math.max(0, toNum(line.quantity));
        const allowedQty = Math.max(0, Math.min(selectedQty, remaining));

        if (selectedQty > allowedQty) {
          issues.push({
            lineId: line.id,
            entryId,
            itemName: line.item?.name ?? "selected item",
            selectedQty,
            availableQty: remaining,
            suggestedQty: allowedQty,
            message:
              remaining <= 0
                ? "This batch is fully consumed now. Select next batch."
                : `Only ${formatQty(remaining)} available. Use Fix qty.`,
          });
        }
        remaining = Math.max(0, remaining - allowedQty);
      }
    }

    return issues;
  }, [addedLines]);

  const applySuggestedQtyForLine = useCallback(
    (lineId: string) => {
      const issue = stockLineIssues[lineId];
      if (!issue) return;

      if (issue.suggestedQty <= 0) {
        showErrorToast(
          null,
          "No stock left in this batch. Please select the next available batch.",
        );
        return;
      }

      updateLine(lineId, { quantity: formatQty(issue.suggestedQty) });
      setQtyAutoAdjusted(true);
      showSuccessToast(
        `Quantity updated to ${formatQty(issue.suggestedQty)} for ${issue.itemName}.`,
      );
    },
    [stockLineIssues, updateLine],
  );

  const handleCreate = useCallback(async () => {
    if (!party) {
      showErrorToast(null, "Please select a party");
      return;
    }

    if (addedLines.length === 0 || !addedLines.every(isLineValid)) {
      showErrorToast(null, "Add at least one valid item row");
      return;
    }

    if (invoiceType !== "SALE_RETURN" && invoiceType !== "PURCHASE_RETURN") {
      const liveIssues = await validateLiveStockForAddedLines();
      if (liveIssues.length > 0) {
        const issueMap = Object.fromEntries(liveIssues.map((issue) => [issue.lineId, issue]));
        setStockLineIssues(issueMap);
        setFocusedIssueLineId(liveIssues[0]?.lineId ?? null);
        showErrorToast(
          null,
          `Stock changed for ${liveIssues.length} product${liveIssues.length !== 1 ? "s" : ""} on this invoice. Fix quantity or pick another batch.`,
        );
        return;
      }
      setStockLineIssues({});
    } else {
      setStockLineIssues({});
    }

    const invalidCostLine = addedLines.find((line) => getCostFloorViolation(line, stockEntries));
    if (invalidCostLine) {
      const violation = getCostFloorViolation(invalidCostLine, stockEntries);
      showErrorToast(
        null,
        `Discount is too high for ${invalidCostLine.item?.name ?? "selected item"}. Net rate (${formatCurrency(violation?.netUnitPrice ?? 0)}) cannot be below cost (${formatCurrency(violation?.costPrice ?? 0)}).`,
      );
      return;
    }

    try {
      await createInvoice.mutateAsync({
        partyId: party.id,
        invoiceType,
        invoiceDate,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        discountAmount: discountAmount || undefined,
        discountPercent: discountPercent || undefined,
        roundOffAmount: summary.roundOff.toFixed(2),
        items: addedLines.map((line) => ({
          stockEntryId: line.stockEntryId!,
          quantity: line.quantity,
          unitPrice: line.unitPrice || undefined,
          discountPercent: line.discountPercent.trim() === "" ? "0" : line.discountPercent,
        })),
      });

      showSuccessToast(`${pageMeta.label} created`);
      router.push(pageMeta.path);
    } catch (err) {
      showErrorToast(err, `Failed to create ${pageMeta.label.toLowerCase()}`);
    }
  }, [
    party,
    addedLines,
    isLineValid,
    validateLiveStockForAddedLines,
    stockEntries,
    createInvoice,
    invoiceType,
    invoiceDate,
    dueDate,
    notes,
    discountAmount,
    discountPercent,
    summary.roundOff,
    pageMeta,
    router,
  ]);

  useEffect(() => {
    if (!qtyAutoAdjusted) return;
    const timer = setTimeout(() => setQtyAutoAdjusted(false), 1200);
    return () => clearTimeout(timer);
  }, [qtyAutoAdjusted]);

  useEffect(() => {
    if (!focusedIssueLineId) return;
    const rowEl = document.getElementById(`added-line-${focusedIssueLineId}`);
    rowEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (rowEl instanceof HTMLElement) rowEl.focus();

    const timer = setTimeout(() => setFocusedIssueLineId(null), 1200);
    return () => clearTimeout(timer);
  }, [focusedIssueLineId]);

  const handleOpenAddParty = useCallback((_onCreated: (p: Party) => void, draftName?: string) => {
    setPendingPartyName((draftName ?? "").trim());
    setAddPartyDialogOpen(true);
  }, []);

  const handlePartyCreated = useCallback((createdParty: Party) => {
    setParty(createdParty);
    setPendingPartyName("");
  }, []);

  const handleAddItemClick = useCallback(() => {
    setPendingItemName(stockSearchText.trim());
    setAddItemDialogOpen(true);
  }, [stockSearchText]);

  const handleItemCreated = useCallback((createdItem: { name: string }) => {
    setStockSearchText(createdItem.name);
    setStockSearchOpen(true);
    showSuccessToast("Item created. Add stock to use it in invoice.");
  }, []);

  return {
    // Form state
    party,
    setParty,
    invoiceDate,
    setInvoiceDate,
    dueDate,
    setDueDate,
    notes,
    setNotes,
    discountAmount,
    setDiscountAmount,
    discountPercent,
    setDiscountPercent,
    roundOffAmount,
    setRoundOffAmount,
    autoRoundOff,
    setAutoRoundOff,
    lines,
    draftLine,
    addedLines,
    // Dialogs
    addPartyDialogOpen,
    setAddPartyDialogOpen,
    pendingPartyName,
    setPendingPartyName,
    stockSearchOpen,
    setStockSearchOpen,
    stockSearchText,
    setStockSearchText,
    addItemDialogOpen,
    setAddItemDialogOpen,
    pendingItemName,
    setPendingItemName,
    // Derived
    parties,
    stockEntries,
    stockChoices,
    filteredStockChoices,
    itemsWithoutStockOptions,
    showAddItemOption,
    summary,
    usedQtyByEntryId,
    itemMap,
    stockLineIssues,
    focusedIssueLineId,
    qtyAutoAdjusted,
    roundOffInputValue,
    canSubmit,
    // Handlers
    updateLine,
    handleStockChoiceSelect,
    handleAddStockForItem,
    handleLineDiscountChange,
    addCurrentLine,
    removeAddedLine,
    applySuggestedQtyForLine,
    handleCreate,
    handleOpenAddParty,
    handlePartyCreated,
    handleAddItemClick,
    handleItemCreated,
    isLineValid,
    // Meta & copy
    partyType,
    pageMeta,
    nextInvoiceNumber,
    isNextInvoiceNumberPending,
    createCopy: getInvoiceTypeCreateCopy(invoiceType),
    stockEntriesError,
    createInvoice,
  };
}
