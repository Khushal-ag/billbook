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
  getMaxAllowedDiscountAmount,
  getMaxAllowedDiscountPercent,
  isDraftLineServiceItem,
  itemFromStockEntry,
  toNum,
} from "@/lib/invoice-create";
import type { InvoiceLineDraft, StockChoice, StockLineIssue } from "@/types/invoice-create";
import {
  useCreateInvoice,
  useInvoice,
  useNextInvoiceNumber,
  useUpdateInvoiceById,
} from "@/hooks/use-invoices";
import type { UpdateInvoiceRequest } from "@/types/invoice";
import {
  getStockEntryById,
  useItems,
  useStockEntries,
  useStockEntriesByIds,
} from "@/hooks/use-items";
import { useDebounce } from "@/hooks/use-debounce";
import { useParties } from "@/hooks/use-parties";
import { getInvoiceTypeCreateCopy, INVOICE_TYPE_OPTIONS, isSalesFamily } from "@/lib/invoice";
import { formatCurrency } from "@/lib/utils";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import { isServiceType, type Item, type StockEntry } from "@/types/item";
import type { Party } from "@/types/party";
import type { InvoiceItem, InvoiceType } from "@/types/invoice";

/** Whole paise — avoids float drift on invoice totals and round-off sign bugs. */
function moneyToPaise(rupees: number): number {
  return Math.round((Number.isFinite(rupees) ? rupees : 0) * 100);
}

function paiseToMoney(pa: number): number {
  return pa / 100;
}

/** Same base as bill summary (taxable + tax − invoice discount), in paise. */
function computeBasePaiseFromAddedLines(
  lineDrafts: InvoiceLineDraft[],
  discountAmountStr: string,
  discountPercentStr: string,
): number {
  const lineBreakup = lineDrafts.map((l) => getLineAmounts(l));
  const subTotal = lineBreakup.reduce((s, x) => s + x.gross, 0);
  const invoiceDiscount = discountAmountStr.trim()
    ? Math.max(0, toNum(discountAmountStr))
    : (subTotal * Math.max(0, toNum(discountPercentStr))) / 100;
  const taxableTotal = lineBreakup.reduce((s, x) => s + x.taxable, 0);
  const taxTotal = lineBreakup.reduce((s, x) => s + x.tax, 0);
  const baseTotal = Math.max(0, taxableTotal + taxTotal - invoiceDiscount);
  return moneyToPaise(baseTotal);
}

/**
 * GST % on the saved invoice line wins over master item / stock embed (catalog often has 0% while
 * the line was invoiced at e.g. 4% IGST) — required for correct bill summary on edit.
 */
function pickInvoiceTaxRate(
  invoiceVal: string | null | undefined,
  itemVal: string | null | undefined,
): string {
  const v = invoiceVal?.trim();
  if (v !== undefined && v !== "") return v;
  const i = itemVal?.trim();
  if (i !== undefined && i !== "") return i;
  return "0";
}

/** Prefer invoice API line display fields over stock-entry fallbacks (e.g. "Item #47"). */
function mergeItemFromInvoiceLine(item: Item, invLine: InvoiceItem): Item {
  const name = invLine.itemName?.trim();
  const hsn = invLine.hsnCode?.trim();
  const sac = invLine.sacCode?.trim();
  return {
    ...item,
    name: name || item.name,
    hsnCode: hsn ? invLine.hsnCode! : item.hsnCode,
    sacCode: sac ? invLine.sacCode! : item.sacCode,
    cgstRate: pickInvoiceTaxRate(invLine.cgstRate, item.cgstRate),
    sgstRate: pickInvoiceTaxRate(invLine.sgstRate, item.sgstRate),
    igstRate: pickInvoiceTaxRate(invLine.igstRate, item.igstRate),
  };
}

export function useInvoiceCreateState(
  initialType: InvoiceType,
  options?: { sourceInvoiceId?: number; editInvoiceId?: number },
) {
  const editInvoiceId = options?.editInvoiceId;
  const sourceInvoiceId = editInvoiceId ? undefined : options?.sourceInvoiceId;
  const router = useRouter();
  const createInvoice = useCreateInvoice();
  const updateDraftInvoice = useUpdateInvoiceById();
  const invoiceType = initialType;
  const hasHydratedSourceInvoice = useRef(false);
  const hasHydratedEditInvoice = useRef(false);

  const [party, setParty] = useState<Party | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [roundOffAmount, setRoundOffAmount] = useState("0");
  const [autoRoundOff, setAutoRoundOff] = useState(true);
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
  const parties = useMemo(
    () => (partiesData?.parties ?? []).filter((p) => p.isActive),
    [partiesData],
  );

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
  const { data: editingDraftInvoice } = useInvoice(editInvoiceId);
  const { data: nextInvoiceNumber, isPending: isNextInvoiceNumberPending } = useNextInvoiceNumber({
    invoiceDate,
    enabled: !editInvoiceId,
  });
  const stockAnchorInvoice = editInvoiceId ? editingDraftInvoice : sourceInvoice;
  const sourceEntryIds = useMemo(
    () => stockAnchorInvoice?.items.map((line) => line.stockEntryId) ?? [],
    [stockAnchorInvoice?.items],
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
      const isService = isServiceType(item.type);
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
    const basePaise = moneyToPaise(baseTotal);
    /** API: payable = baseTotal + roundOffAmount (signed). Auto: adjust to nearest ₹ (+ or −). Manual: always subtract entered amount. */
    const roundPaise = autoRoundOff
      ? Math.round(basePaise / 100) * 100 - basePaise
      : -moneyToPaise(Math.max(0, toNum(roundOffAmount)));
    const roundOff = paiseToMoney(roundPaise);
    const grandTotal = Math.max(0, paiseToMoney(basePaise + roundPaise));

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
  const roundOffInputValue = autoRoundOff
    ? Math.abs(summary.roundOff).toFixed(2)
    : roundOffAmount.replace(/^\s*-/, "");

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
      let resolvedItem: Item | null =
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

      if (!resolvedItem) {
        resolvedItem = itemFromStockEntry(entry);
      }

      resolvedItem = mergeItemFromInvoiceLine(resolvedItem, invoiceItem);

      prefilledLines.push({
        id: crypto.randomUUID(),
        item: resolvedItem,
        stockEntryId: invoiceItem.stockEntryId,
        quantity: invoiceItem.quantity,
        unitPrice: invoiceItem.unitPrice || entry.sellingPrice || "",
        discountPercent: invoiceItem.discountPercent ?? "0",
        discountAmount: invoiceItem.discountAmount ?? "",
        cgstRate: pickInvoiceTaxRate(invoiceItem.cgstRate, resolvedItem.cgstRate),
        sgstRate: pickInvoiceTaxRate(invoiceItem.sgstRate, resolvedItem.sgstRate),
        igstRate: pickInvoiceTaxRate(invoiceItem.igstRate, resolvedItem.igstRate),
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

  useEffect(() => {
    if (!editInvoiceId || !editingDraftInvoice) return;
    if (editingDraftInvoice.status !== "DRAFT") return;
    if (hasHydratedEditInvoice.current) return;
    if (!stockEntryByIdQuery.data) return;

    const partyFromList = parties.find((p) => p.id === editingDraftInvoice.partyId);
    const partySide = isSalesFamily(editingDraftInvoice.invoiceType) ? "CUSTOMER" : "SUPPLIER";
    const fallbackParty: Party = {
      id: editingDraftInvoice.partyId,
      businessId: editingDraftInvoice.businessId,
      name: editingDraftInvoice.partyName ?? (partySide === "SUPPLIER" ? "Supplier" : "Customer"),
      type: partySide,
      gstin: null,
      email: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      postalCode: null,
      openingBalance: null,
      isActive: true,
      createdAt: editingDraftInvoice.createdAt,
      updatedAt: editingDraftInvoice.updatedAt,
    };
    setParty(partyFromList ?? fallbackParty);

    setInvoiceDate(editingDraftInvoice.invoiceDate.slice(0, 10));
    setDueDate(editingDraftInvoice.dueDate?.slice(0, 10) ?? "");
    setNotes(editingDraftInvoice.notes ?? "");
    setDiscountAmount(editingDraftInvoice.discountAmount ?? "");
    setDiscountPercent(editingDraftInvoice.discountPercent ?? "");

    const prefilledLines: InvoiceLineDraft[] = [];

    for (const invoiceItem of editingDraftInvoice.items) {
      const entry = stockEntryByIdQuery.data?.[invoiceItem.stockEntryId];
      if (!entry) continue;

      const catalogItem = itemMap.get(entry.itemId);
      const entryItem = entry.item;
      let resolvedItem: Item | null =
        catalogItem ??
        (entryItem
          ? {
              id: entryItem.id,
              businessId: editingDraftInvoice.businessId,
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
              createdAt: editingDraftInvoice.createdAt,
              updatedAt: editingDraftInvoice.updatedAt,
            }
          : null);

      if (!resolvedItem) {
        resolvedItem = itemFromStockEntry(entry);
      }

      resolvedItem = mergeItemFromInvoiceLine(resolvedItem, invoiceItem);

      prefilledLines.push({
        id: crypto.randomUUID(),
        item: resolvedItem,
        stockEntryId: invoiceItem.stockEntryId,
        quantity: invoiceItem.quantity,
        unitPrice: invoiceItem.unitPrice || entry.sellingPrice || "",
        discountPercent: invoiceItem.discountPercent ?? "0",
        discountAmount: invoiceItem.discountAmount ?? "",
        cgstRate: pickInvoiceTaxRate(invoiceItem.cgstRate, resolvedItem.cgstRate),
        sgstRate: pickInvoiceTaxRate(invoiceItem.sgstRate, resolvedItem.sgstRate),
        igstRate: pickInvoiceTaxRate(invoiceItem.igstRate, resolvedItem.igstRate),
      });
    }

    const da = editingDraftInvoice.discountAmount ?? "";
    const dp = editingDraftInvoice.discountPercent ?? "";
    const basePaise =
      prefilledLines.length > 0 ? computeBasePaiseFromAddedLines(prefilledLines, da, dp) : 0;
    const autoRoundPaise = Math.round(basePaise / 100) * 100 - basePaise;
    const apiRoundPaise = Math.round(
      parseFloat((editingDraftInvoice.roundOffAmount ?? "0").replace(/,/g, "")) * 100,
    );
    const apiFinite = Number.isFinite(apiRoundPaise);

    if (prefilledLines.length === 0) {
      setAutoRoundOff(true);
      setRoundOffAmount("0");
    } else if (apiFinite && apiRoundPaise === autoRoundPaise) {
      setAutoRoundOff(true);
      setRoundOffAmount(
        Math.abs(autoRoundPaise) < 0.5 ? "0" : (Math.abs(autoRoundPaise) / 100).toFixed(2),
      );
    } else if (apiFinite && apiRoundPaise === 0) {
      setAutoRoundOff(false);
      setRoundOffAmount("0");
    } else if (apiFinite && apiRoundPaise < 0) {
      setAutoRoundOff(false);
      setRoundOffAmount((Math.abs(apiRoundPaise) / 100).toFixed(2));
    } else {
      setAutoRoundOff(true);
      setRoundOffAmount(
        Math.abs(autoRoundPaise) < 0.5 ? "0" : (Math.abs(autoRoundPaise) / 100).toFixed(2),
      );
    }

    if (prefilledLines.length > 0) {
      setLines([createLine(), ...prefilledLines]);
    }

    hasHydratedEditInvoice.current = true;
  }, [editInvoiceId, editingDraftInvoice, stockEntryByIdQuery.data, parties, itemMap]);

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
        discountAmount: "",
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
        updateLine(lineId, { discountPercent: "", discountAmount: "" });
        return;
      }

      const parsed = toNum(value);
      const safePercent = Math.min(100, Math.max(0, parsed));
      const maxAllowed = getMaxAllowedDiscountPercent(line, stockEntries);

      if (safePercent > maxAllowed) {
        updateLine(lineId, { discountPercent: maxAllowed.toFixed(2), discountAmount: "" });
        showErrorToast(
          null,
          "Discount cannot reduce selling price below cost price for this stock batch",
        );
        return;
      }

      // Auto-compute discount amount from percentage
      const qty = Math.max(0, toNum(line.quantity));
      const unitPrice = Math.max(0, toNum(line.unitPrice));
      const gross = qty * unitPrice;
      const computedAmount = (gross * safePercent) / 100;

      updateLine(lineId, { discountPercent: value, discountAmount: computedAmount.toFixed(2) });
    },
    [lines, stockEntries, updateLine],
  );

  const handleLineDiscountAmountChange = useCallback(
    (lineId: string, value: string) => {
      const line = lines.find((x) => x.id === lineId);
      if (!line) return;

      if (value.trim() === "") {
        updateLine(lineId, { discountAmount: "", discountPercent: "" });
        return;
      }

      const parsed = Math.max(0, toNum(value));
      const qty = Math.max(0, toNum(line.quantity));
      const unitPrice = Math.max(0, toNum(line.unitPrice));
      const gross = qty * unitPrice;
      const maxForCost = getMaxAllowedDiscountAmount(line, stockEntries);
      const safeAmount = Math.min(gross, parsed);

      if (safeAmount > maxForCost) {
        updateLine(lineId, { discountAmount: maxForCost.toFixed(2), discountPercent: "" });
        showErrorToast(
          null,
          "Discount cannot reduce selling price below cost price for this stock batch",
        );
        return;
      }

      // Auto-compute discount percentage from amount
      const computedPercent = gross > 0 ? (safeAmount / gross) * 100 : 0;

      updateLine(lineId, { discountAmount: value, discountPercent: computedPercent.toFixed(2) });
    },
    [lines, stockEntries, updateLine],
  );

  /** Keep ₹ discount in sync when qty changes (% scales with line total; ₹-only scales with qty ratio). */
  const handleLineQuantityChange = useCallback(
    (lineId: string, quantity: string) => {
      const line = lines.find((x) => x.id === lineId);
      if (!line) return;

      const newQty = Math.max(0, toNum(quantity));
      const unitPrice = Math.max(0, toNum(line.unitPrice));
      const gross = newQty * unitPrice;
      const patch: Partial<InvoiceLineDraft> = { quantity };

      if (line.discountPercent.trim() !== "") {
        const p = Math.min(100, Math.max(0, toNum(line.discountPercent)));
        const desiredAmount = (gross * p) / 100;
        const maxForCost = getMaxAllowedDiscountAmount({ ...line, quantity }, stockEntries);
        const cappedAmount = Math.min(desiredAmount, maxForCost, gross);
        patch.discountAmount = cappedAmount.toFixed(2);
        if (cappedAmount + 0.001 < desiredAmount) {
          patch.discountPercent = gross > 0 ? ((cappedAmount / gross) * 100).toFixed(2) : "0";
          showErrorToast(null, "Discount capped so net rate stays above cost for this quantity.");
        }
      } else if (line.discountAmount.trim() !== "") {
        const oldQty = Math.max(0, toNum(line.quantity));
        const oldAmt = Math.max(0, toNum(line.discountAmount));
        let newAmt = oldQty > 0 ? oldAmt * (newQty / oldQty) : oldAmt;
        const maxForCost = getMaxAllowedDiscountAmount({ ...line, quantity }, stockEntries);
        newAmt = Math.min(newAmt, gross, maxForCost);
        patch.discountAmount = newAmt.toFixed(2);
        patch.discountPercent = gross > 0 ? ((newAmt / gross) * 100).toFixed(2) : "";
      }

      updateLine(lineId, patch);
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

    if (!selectedEntry) {
      showErrorToast(null, "Unable to validate selected stock batch. Please reselect the batch.");
      return;
    }

    /** SERVICE items use a nominal batch qty in stock; invoice qty is not stock-limited. */
    if (!isDraftLineServiceItem(draftLine)) {
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
        discountAmount: current.discountAmount.trim() === "" ? "0" : current.discountAmount,
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
      if (isDraftLineServiceItem(line)) continue;
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

      handleLineQuantityChange(lineId, formatQty(issue.suggestedQty));
      setQtyAutoAdjusted(true);
      showSuccessToast(
        `Quantity updated to ${formatQty(issue.suggestedQty)} for ${issue.itemName}.`,
      );
    },
    [stockLineIssues, handleLineQuantityChange],
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

    const linePayload = addedLines.map((line) => ({
      stockEntryId: line.stockEntryId!,
      quantity: line.quantity,
      unitPrice: line.unitPrice || undefined,
      discountPercent: line.discountPercent.trim() === "" ? "0" : line.discountPercent,
      discountAmount: line.discountAmount.trim() === "" ? "0" : line.discountAmount,
    }));

    /** Signed adjustment: payable = subtotal + tax − invoice discount + roundOffAmount */
    const roundOffForApi = (() => {
      const r = summary.roundOff;
      if (!Number.isFinite(r) || Math.abs(r) < 0.000_5) return "0.00";
      return r.toFixed(2);
    })();

    try {
      if (editInvoiceId) {
        const body: UpdateInvoiceRequest = {
          partyId: party.id,
          invoiceType,
          invoiceDate,
          dueDate: dueDate.trim() === "" ? null : dueDate,
          notes: notes.trim() ? notes : undefined,
          discountAmount: discountAmount.trim() ? discountAmount : undefined,
          discountPercent: discountPercent.trim() ? discountPercent : undefined,
          roundOffAmount: roundOffForApi,
          items: linePayload,
        };
        await updateDraftInvoice.mutateAsync({ invoiceId: editInvoiceId, body });
        showSuccessToast("Invoice updated");
        router.push(`/invoices/${editInvoiceId}`);
        return;
      }

      const created = await createInvoice.mutateAsync({
        partyId: party.id,
        invoiceType,
        invoiceDate,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        discountAmount: discountAmount || undefined,
        discountPercent: discountPercent || undefined,
        roundOffAmount: roundOffForApi,
        items: linePayload,
      });

      showSuccessToast(`${pageMeta.label} created — review and finalize when ready`);
      router.push(created?.id != null ? `/invoices/${created.id}` : pageMeta.path);
    } catch (err) {
      showErrorToast(
        err,
        editInvoiceId
          ? "Failed to update invoice"
          : `Failed to create ${pageMeta.label.toLowerCase()}`,
      );
    }
  }, [
    party,
    addedLines,
    isLineValid,
    validateLiveStockForAddedLines,
    stockEntries,
    createInvoice,
    updateDraftInvoice,
    editInvoiceId,
    invoiceType,
    invoiceDate,
    dueDate,
    notes,
    discountAmount,
    discountPercent,
    summary,
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
    handleLineDiscountAmountChange,
    handleLineQuantityChange,
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
    isEditMode: Boolean(editInvoiceId),
    editingInvoiceNumber: editingDraftInvoice?.invoiceNumber ?? null,
    isEditingInvoiceLoading: Boolean(editInvoiceId) && !editingDraftInvoice,
    saveInvoice: {
      isPending: createInvoice.isPending || updateDraftInvoice.isPending,
    },
  };
}
