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
  getSalesUnitPriceFloor,
  isDraftLineServiceItem,
  itemFromStockEntry,
  sellingPriceFromPurchaseAndMargin,
  toNum,
} from "@/lib/invoice-create";
import type { InvoiceLineDraft, StockChoice, StockLineIssue } from "@/types/invoice-create";
import {
  useCreateInvoice,
  useInvoice,
  useNextInvoiceNumber,
  useUpdateInvoiceById,
} from "@/hooks/use-invoices";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import type { InvoiceItemInput, UpdateInvoiceRequest } from "@/types/invoice";
import {
  getStockEntryById,
  useItems,
  useStockEntries,
  useStockEntriesByIds,
} from "@/hooks/use-items";
import { useDebounce } from "@/hooks/use-debounce";
import { useParties, usePartyConsignees } from "@/hooks/use-parties";
import {
  buildInvoiceItemInput,
  computeBasePaiseFromAddedLines,
  effectiveLineItemName,
  mergeItemFromInvoiceLine,
  moneyToPaise,
  paiseToMoney,
  pickInvoiceTaxRate,
} from "@/lib/invoice-create-mapping";
import { addCalendarDaysToIsoDate, parseISODateString } from "@/lib/date";
import {
  getInvoiceTypeCreateCopy,
  INVOICE_TYPE_OPTIONS,
  isPurchaseVendorBillMetaType,
  isSalesFamily,
} from "@/lib/invoice";
import { formatCurrency } from "@/lib/utils";
import {
  clampQuantityToRemainingCap,
  defaultLinkedReturnQuantity,
  isReturnQuantityOverCap,
} from "@/lib/invoice-return-cap";
import { withInvoiceQuantityErrorDetails } from "@/lib/invoice-quantity-error-details";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import { ApiClientError } from "@/api/error";
import { isServiceType, type Item, type StockEntry } from "@/types/item";
import type { Party, PartyConsignee } from "@/types/party";
import type { InvoiceType } from "@/types/invoice";

function validatePurchaseVendorBillFields(
  invoiceType: InvoiceType,
  originalBillNumber: string,
  originalBillDate: string,
  paymentTermsDays: string,
): string | null {
  if (!isPurchaseVendorBillMetaType(invoiceType)) return null;
  if (originalBillNumber.trim().length > 100) {
    return "Original bill no. must be at most 100 characters.";
  }
  const obd = originalBillDate.trim().slice(0, 10);
  if (obd !== "" && !parseISODateString(obd)) {
    return "Enter a valid original bill date.";
  }
  const raw = paymentTermsDays.trim();
  if (raw === "") return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || String(n) !== raw || n < 0 || n > 3650) {
    return "Payment terms must be a whole number from 0 to 3650.";
  }
  return null;
}

export function useInvoiceCreateState(
  initialType: InvoiceType,
  options?: { sourceInvoiceId?: number; editInvoiceId?: number },
) {
  const editInvoiceId = options?.editInvoiceId;
  /** Create-from-URL: original sale/purchase invoice id for linked returns. */
  const sourceInvoiceId = editInvoiceId ? undefined : options?.sourceInvoiceId;
  const router = useRouter();
  const createInvoice = useCreateInvoice();
  const updateDraftInvoice = useUpdateInvoiceById();
  const invoiceType = initialType;
  const hasHydratedSourceInvoice = useRef(false);
  const hasHydratedEditInvoice = useRef(false);
  /** Last due date we set from business defaultDueDays + invoiceDate; used to keep syncing invoice date until user edits due. */
  const expectedAutoDueRef = useRef<string | null>(null);
  /** Last due date suggested from payment terms + purchase bill date (create flow). */
  const expectedAutoDueFromTermsRef = useRef<string | null>(null);
  const submitGuardRef = useRef(false);

  const [party, setParty] = useState<Party | null>(null);
  const [selectedConsigneeId, setSelectedConsigneeId] = useState<number | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  /** PURCHASE_INVOICE: margin on cost for default selling price per line. */
  const [sellingPriceMarginPercent, setSellingPriceMarginPercent] = useState("");
  const [originalBillNumber, setOriginalBillNumber] = useState("");
  const [originalBillDate, setOriginalBillDate] = useState("");
  const [paymentTermsDays, setPaymentTermsDays] = useState("");
  const [notes, setNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [roundOffAmount, setRoundOffAmount] = useState("0");
  const [autoRoundOff, setAutoRoundOff] = useState(true);
  const [lines, setLines] = useState<InvoiceLineDraft[]>(() =>
    initialType === "SALE_RETURN" ? [] : [createLine()],
  );

  const [addPartyDialogOpen, setAddPartyDialogOpen] = useState(false);
  const [pendingPartyName, setPendingPartyName] = useState("");
  const [stockSearchOpen, setStockSearchOpen] = useState(false);
  const [stockSearchText, setStockSearchText] = useState("");
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [pendingItemName, setPendingItemName] = useState("");
  const [qtyAutoAdjusted, setQtyAutoAdjusted] = useState(false);
  const [stockLineIssues, setStockLineIssues] = useState<Record<string, StockLineIssue>>({});
  const [focusedIssueLineId, setFocusedIssueLineId] = useState<string | null>(null);
  const [unitPriceFloorWarning, setUnitPriceFloorWarning] = useState<string | null>(null);
  const [unitPriceFloorIsError, setUnitPriceFloorIsError] = useState(false);

  const debouncedStockSearch = useDebounce(stockSearchText, 300);
  const stockSearchQuery = debouncedStockSearch.trim();
  const partyType: "CUSTOMER" | "SUPPLIER" = isSalesFamily(invoiceType) ? "CUSTOMER" : "SUPPLIER";
  const pageMeta =
    INVOICE_TYPE_OPTIONS.find((o) => o.type === invoiceType) ?? INVOICE_TYPE_OPTIONS[0];

  const { data: partiesData } = useParties({ type: partyType, includeInactive: false });
  const { data: consigneesData, isPending: isConsigneesLoading } = usePartyConsignees(party?.id, {
    enabled: !!party?.id,
  });
  const parties = useMemo(
    () => (partiesData?.parties ?? []).filter((p) => p.isActive),
    [partiesData],
  );
  const consignees = useMemo<PartyConsignee[]>(
    () => (consigneesData ?? []).filter((c) => c.partyId === party?.id),
    [consigneesData, party?.id],
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
  const { data: editingDraftInvoice } = useInvoice(editInvoiceId);
  /** Fetch source invoice for prefill + per-line return caps (quantityReturnableRemaining). */
  const returnCapSourceId =
    invoiceType === "SALE_RETURN" || invoiceType === "PURCHASE_RETURN"
      ? editInvoiceId
        ? (editingDraftInvoice?.sourceInvoiceId ?? undefined)
        : sourceInvoiceId
      : undefined;
  const { data: sourceInvoice } = useInvoice(returnCapSourceId);
  const { data: businessSettings } = useBusinessSettings();
  const { data: nextInvoiceNumber, isPending: isNextInvoiceNumberPending } = useNextInvoiceNumber({
    invoiceDate,
    invoiceType,
    enabled: !editInvoiceId,
  });
  const stockAnchorInvoice = editInvoiceId ? editingDraftInvoice : sourceInvoice;
  const sourceEntryIds = useMemo(
    () =>
      (stockAnchorInvoice?.items ?? [])
        .map((line) => line.stockEntryId)
        .filter((id): id is number => id != null && Number.isFinite(id)),
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
  const needsStockEntryFetch = neededStockEntryIds.length > 0;
  const stockEntryMapReady = !needsStockEntryFetch || stockEntryByIdQuery.data != null;

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

  /** Sales return: all rows are return lines (no add-item draft row). */
  const saleReturnLayout = invoiceType === "SALE_RETURN";
  const draftLine = saleReturnLayout ? createLine() : (lines[0] ?? createLine());
  const addedLines = saleReturnLayout ? lines : lines.slice(1);

  const linesForBillSummary = useMemo(() => {
    if (invoiceType !== "SALE_RETURN") return addedLines;
    return addedLines.filter((l) => l.selectedForReturn !== false && toNum(l.quantity) > 0);
  }, [addedLines, invoiceType]);

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
    const lineBreakup = linesForBillSummary.map((line) => getLineAmounts(line));
    const subTotal = lineBreakup.reduce((sum, x) => sum + x.gross, 0);
    const lineDiscountTotal = lineBreakup.reduce((sum, x) => sum + x.lineDiscount, 0);
    const taxableTotal = lineBreakup.reduce((sum, x) => sum + x.taxable, 0);
    const taxTotal = lineBreakup.reduce((sum, x) => sum + x.tax, 0);

    const invoiceDiscount = discountAmount.trim()
      ? Math.max(0, toNum(discountAmount))
      : (taxableTotal * Math.max(0, toNum(discountPercent))) / 100;

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
  }, [linesForBillSummary, discountAmount, discountPercent, roundOffAmount, autoRoundOff]);

  const isLineValid = useCallback(
    (line: InvoiceLineDraft) => {
      if (invoiceType === "SALE_RETURN" && line.selectedForReturn === false) return true;

      const qty = toNum(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0) return false;

      if (invoiceType === "SALE_RETURN" || invoiceType === "PURCHASE_RETURN") {
        if (isReturnQuantityOverCap(line)) return false;
      }

      if (isSalesFamily(invoiceType)) {
        return Boolean(line.item && line.stockEntryId != null);
      }
      return (
        effectiveLineItemName(line) !== "" &&
        line.unitPrice.trim() !== "" &&
        toNum(line.unitPrice) > 0
      );
    },
    [invoiceType],
  );

  const returnQtyBlockReason = useMemo(() => {
    if (invoiceType !== "SALE_RETURN" && invoiceType !== "PURCHASE_RETURN") return null;
    const over = addedLines.filter(
      (l) =>
        (invoiceType !== "SALE_RETURN" || l.selectedForReturn !== false) &&
        toNum(l.quantity) > 0 &&
        isReturnQuantityOverCap(l),
    );
    if (over.length === 0) return null;
    return (
      `Return quantity exceeds what’s still returnable on ${over.length === 1 ? "one line" : `${over.length} lines`}. ` +
      `Lower each return qty to the Remaining amount (or less).`
    );
  }, [invoiceType, addedLines]);

  const returnQtySubmitShortHint = returnQtyBlockReason
    ? "Cannot save until each return qty is at or below the remaining amount."
    : null;

  const canSubmit =
    party != null &&
    (invoiceType === "SALE_RETURN"
      ? linesForBillSummary.length > 0 && linesForBillSummary.every(isLineValid)
      : addedLines.length > 0 && addedLines.every(isLineValid));
  const roundOffInputValue = autoRoundOff
    ? Math.abs(summary.roundOff).toFixed(2)
    : roundOffAmount.replace(/^\s*-/, "");

  /**
   * Create flow: suggest due date from payment terms + purchase bill date when set;
   * otherwise from business defaultDueDays + invoice date. Stops if user edits due away from the last auto value.
   */
  useEffect(() => {
    if (editInvoiceId) return;

    if (isPurchaseVendorBillMetaType(invoiceType)) {
      const rawTerms = paymentTermsDays.trim();
      if (rawTerms !== "") {
        const n = Number.parseInt(rawTerms, 10);
        if (Number.isFinite(n) && n >= 0 && n <= 3650 && String(n) === rawTerms.trim()) {
          const computed = addCalendarDaysToIsoDate(invoiceDate, n);
          if (computed) {
            setDueDate((prev) => {
              if (
                prev === "" ||
                prev === expectedAutoDueFromTermsRef.current ||
                prev === expectedAutoDueRef.current
              ) {
                expectedAutoDueFromTermsRef.current = computed;
                expectedAutoDueRef.current = computed;
                return computed;
              }
              return prev;
            });
            return;
          }
        }
      }
    }

    const days = businessSettings?.defaultDueDays;
    if (days == null || !Number.isFinite(days) || days < 0) return;
    const computed = addCalendarDaysToIsoDate(invoiceDate, Math.floor(days));
    if (!computed) return;

    setDueDate((prev) => {
      if (prev === "" || prev === expectedAutoDueRef.current) {
        expectedAutoDueRef.current = computed;
        return computed;
      }
      return prev;
    });
  }, [editInvoiceId, invoiceType, paymentTermsDays, businessSettings?.defaultDueDays, invoiceDate]);

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
    if (editInvoiceId) return;
    if (!returnCapSourceId) return;
    if (hasHydratedSourceInvoice.current) return;
    if (!sourceInvoice) return;
    if (sourceInvoice.invoiceType !== sourceConfig.sourceType) return;

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
    setSelectedConsigneeId(sourceInvoice.partyConsigneeId ?? null);

    if (sourceInvoice.invoiceType === "PURCHASE_INVOICE") {
      const purchasePrefill: InvoiceLineDraft[] = sourceInvoice.items.map((invoiceItem) => ({
        id: crypto.randomUUID(),
        item: invoiceItem.itemId != null ? (itemMap.get(invoiceItem.itemId) ?? null) : null,
        stockEntryId: invoiceItem.stockEntryId ?? null,
        itemName: invoiceItem.itemName?.trim() ?? "",
        hsnCode: invoiceItem.hsnCode?.trim() ?? "",
        sacCode: invoiceItem.sacCode?.trim() ?? "",
        quantity:
          invoiceType === "PURCHASE_RETURN"
            ? defaultLinkedReturnQuantity(invoiceItem)
            : invoiceItem.quantity,
        unitPrice: invoiceItem.unitPrice ?? "",
        sellingPrice: invoiceItem.sellingPrice?.trim() ?? "",
        discountPercent: invoiceItem.discountPercent ?? "0",
        discountAmount: invoiceItem.discountAmount ?? "",
        cgstRate: pickInvoiceTaxRate(invoiceItem.cgstRate, "0"),
        sgstRate: pickInvoiceTaxRate(invoiceItem.sgstRate, "0"),
        igstRate: pickInvoiceTaxRate(invoiceItem.igstRate, "0"),
        ...(invoiceType === "PURCHASE_RETURN"
          ? {
              sourceInvoiceItemId: invoiceItem.id,
              soldQuantity: invoiceItem.quantity,
              remainingReturnableQty:
                invoiceItem.quantityReturnableRemaining?.trim() || invoiceItem.quantity,
            }
          : {}),
      }));
      if (purchasePrefill.length > 0) {
        setLines([createLine(), ...purchasePrefill]);
      }
      if (!notes.trim()) {
        setNotes(`${sourceConfig.notePrefix} ${sourceInvoice.invoiceNumber}`);
      }
      hasHydratedSourceInvoice.current = true;
      return;
    }

    if (!stockEntryMapReady) return;

    const prefilledLines: InvoiceLineDraft[] = [];

    const entryById = stockEntryByIdQuery.data ?? {};

    for (const invoiceItem of sourceInvoice.items) {
      if (invoiceItem.stockEntryId == null) continue;

      const entry = entryById[invoiceItem.stockEntryId];
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

      const label = invoiceItem.itemName?.trim();
      const extraItemName = label && label !== resolvedItem.name.trim() ? label : "";

      prefilledLines.push({
        id: crypto.randomUUID(),
        item: resolvedItem,
        stockEntryId: invoiceItem.stockEntryId,
        itemName: extraItemName,
        hsnCode: invoiceItem.hsnCode?.trim() ?? "",
        sacCode: invoiceItem.sacCode?.trim() ?? "",
        sourceInvoiceItemId: invoiceItem.id,
        soldQuantity: invoiceItem.quantity,
        remainingReturnableQty:
          invoiceItem.quantityReturnableRemaining?.trim() || invoiceItem.quantity,
        selectedForReturn: true,
        quantity: defaultLinkedReturnQuantity(invoiceItem),
        unitPrice: invoiceItem.unitPrice || entry.sellingPrice || "",
        discountPercent: invoiceItem.discountPercent ?? "0",
        discountAmount: invoiceItem.discountAmount ?? "",
        cgstRate: pickInvoiceTaxRate(invoiceItem.cgstRate, resolvedItem.cgstRate),
        sgstRate: pickInvoiceTaxRate(invoiceItem.sgstRate, resolvedItem.sgstRate),
        igstRate: pickInvoiceTaxRate(invoiceItem.igstRate, resolvedItem.igstRate),
      });
    }

    if (prefilledLines.length > 0) {
      setLines(invoiceType === "SALE_RETURN" ? prefilledLines : [createLine(), ...prefilledLines]);
    }

    if (!notes.trim()) {
      setNotes(`${sourceConfig.notePrefix} ${sourceInvoice.invoiceNumber}`);
    }

    hasHydratedSourceInvoice.current = true;
  }, [
    invoiceType,
    editInvoiceId,
    returnCapSourceId,
    sourceInvoice,
    stockEntryMapReady,
    stockEntryByIdQuery.data,
    parties,
    itemMap,
    notes,
  ]);

  /** Edit linked return: fill `remainingReturnableQty` when source invoice (with caps) loads after draft lines. */
  useEffect(() => {
    if (!editInvoiceId || !editingDraftInvoice) return;
    if (editingDraftInvoice.status !== "DRAFT") return;
    if (
      editingDraftInvoice.invoiceType !== "SALE_RETURN" &&
      editingDraftInvoice.invoiceType !== "PURCHASE_RETURN"
    ) {
      return;
    }
    if (!editingDraftInvoice.sourceInvoiceId || !sourceInvoice) return;
    if (sourceInvoice.id !== editingDraftInvoice.sourceInvoiceId) return;
    const byLineId = new Map(
      sourceInvoice.items.map((it) => [
        it.id,
        it.quantityReturnableRemaining?.trim() || it.quantity,
      ]),
    );
    setLines((prev) =>
      prev.map((line) => {
        const sid = line.sourceInvoiceItemId;
        if (sid == null) return line;
        const rem = byLineId.get(sid);
        if (rem == null) return line;
        return {
          ...line,
          remainingReturnableQty: rem,
          quantity: clampQuantityToRemainingCap(line.quantity, rem),
        };
      }),
    );
  }, [editInvoiceId, editingDraftInvoice, sourceInvoice]);

  useEffect(() => {
    if (!editInvoiceId || !editingDraftInvoice) return;
    if (editingDraftInvoice.status !== "DRAFT") return;
    if (hasHydratedEditInvoice.current) return;

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
    setSelectedConsigneeId(editingDraftInvoice.partyConsigneeId ?? null);

    setInvoiceDate(editingDraftInvoice.invoiceDate.slice(0, 10));
    setDueDate(editingDraftInvoice.dueDate?.slice(0, 10) ?? "");
    setSellingPriceMarginPercent(editingDraftInvoice.sellingPriceMarginPercent?.trim() ?? "");
    setOriginalBillNumber(editingDraftInvoice.originalBillNumber?.trim() ?? "");
    setOriginalBillDate(
      editingDraftInvoice.originalBillDate ? editingDraftInvoice.originalBillDate.slice(0, 10) : "",
    );
    setPaymentTermsDays(
      editingDraftInvoice.paymentTermsDays != null &&
        Number.isFinite(editingDraftInvoice.paymentTermsDays)
        ? String(editingDraftInvoice.paymentTermsDays)
        : "",
    );
    setNotes(editingDraftInvoice.notes ?? "");
    setDiscountAmount(editingDraftInvoice.discountAmount ?? "");
    setDiscountPercent(editingDraftInvoice.discountPercent ?? "");

    if (!isSalesFamily(editingDraftInvoice.invoiceType)) {
      const purchaseEditPrefill: InvoiceLineDraft[] = editingDraftInvoice.items.map(
        (invoiceItem) => ({
          id: crypto.randomUUID(),
          item: invoiceItem.itemId != null ? (itemMap.get(invoiceItem.itemId) ?? null) : null,
          stockEntryId: invoiceItem.stockEntryId ?? null,
          itemName: invoiceItem.itemName?.trim() ?? "",
          hsnCode: invoiceItem.hsnCode?.trim() ?? "",
          sacCode: invoiceItem.sacCode?.trim() ?? "",
          quantity: invoiceItem.quantity,
          unitPrice: invoiceItem.unitPrice ?? "",
          sellingPrice: invoiceItem.sellingPrice?.trim() ?? "",
          discountPercent: invoiceItem.discountPercent ?? "0",
          discountAmount: invoiceItem.discountAmount ?? "",
          cgstRate: pickInvoiceTaxRate(invoiceItem.cgstRate, "0"),
          sgstRate: pickInvoiceTaxRate(invoiceItem.sgstRate, "0"),
          igstRate: pickInvoiceTaxRate(invoiceItem.igstRate, "0"),
          ...(editingDraftInvoice.invoiceType === "PURCHASE_RETURN"
            ? {
                ...(invoiceItem.sourceInvoiceItemId != null
                  ? { sourceInvoiceItemId: invoiceItem.sourceInvoiceItemId }
                  : {}),
              }
            : {}),
        }),
      );

      const da = editingDraftInvoice.discountAmount ?? "";
      const dp = editingDraftInvoice.discountPercent ?? "";
      const basePaise =
        purchaseEditPrefill.length > 0
          ? computeBasePaiseFromAddedLines(purchaseEditPrefill, da, dp)
          : 0;
      const autoRoundPaise = Math.round(basePaise / 100) * 100 - basePaise;
      const apiRoundPaise = Math.round(
        parseFloat((editingDraftInvoice.roundOffAmount ?? "0").replace(/,/g, "")) * 100,
      );
      const apiFinite = Number.isFinite(apiRoundPaise);

      if (purchaseEditPrefill.length === 0) {
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

      if (purchaseEditPrefill.length > 0) {
        setLines([createLine(), ...purchaseEditPrefill]);
      }

      hasHydratedEditInvoice.current = true;
      return;
    }

    if (!stockEntryMapReady) return;

    const prefilledLines: InvoiceLineDraft[] = [];

    const editEntryById = stockEntryByIdQuery.data ?? {};

    for (const invoiceItem of editingDraftInvoice.items) {
      if (invoiceItem.stockEntryId == null) continue;

      const entry = editEntryById[invoiceItem.stockEntryId];
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

      const editLabel = invoiceItem.itemName?.trim();
      const editExtraItemName =
        editLabel && editLabel !== resolvedItem.name.trim() ? editLabel : "";

      prefilledLines.push({
        id: crypto.randomUUID(),
        item: resolvedItem,
        stockEntryId: invoiceItem.stockEntryId,
        itemName: editExtraItemName,
        hsnCode: invoiceItem.hsnCode?.trim() ?? "",
        sacCode: invoiceItem.sacCode?.trim() ?? "",
        soldQuantity: undefined,
        selectedForReturn: true,
        ...(invoiceItem.sourceInvoiceItemId != null
          ? { sourceInvoiceItemId: invoiceItem.sourceInvoiceItemId }
          : {}),
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
      setLines(
        editingDraftInvoice.invoiceType === "SALE_RETURN"
          ? prefilledLines
          : [createLine(), ...prefilledLines],
      );
    }

    hasHydratedEditInvoice.current = true;
  }, [
    editInvoiceId,
    editingDraftInvoice,
    stockEntryMapReady,
    stockEntryByIdQuery.data,
    parties,
    itemMap,
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

  const clearUnitPriceFloorWarning = useCallback(() => {
    setUnitPriceFloorWarning(null);
    setUnitPriceFloorIsError(false);
  }, []);

  const formatBasePriceText = useCallback((price: number) => {
    if (!Number.isFinite(price)) return "0";
    return Number.isInteger(price) ? String(price) : price.toFixed(2);
  }, []);

  const showUnitPriceFloorWarning = useCallback((message: string, isError = false) => {
    setUnitPriceFloorWarning(message);
    setUnitPriceFloorIsError(isError);
  }, []);

  const handleSalesUnitPriceChange = useCallback(
    (lineId: string, value: string) => {
      updateLine(lineId, { unitPrice: value });
      clearUnitPriceFloorWarning();
    },
    [clearUnitPriceFloorWarning, updateLine],
  );

  const handleSalesUnitPriceBlur = useCallback(
    (lineId: string) => {
      const line = lines.find((item) => item.id === lineId);
      if (!line || invoiceType !== "SALE_INVOICE") return;
      const floor = getSalesUnitPriceFloor(line, stockEntries);
      if (floor == null) {
        clearUnitPriceFloorWarning();
        return;
      }
      if (line.unitPrice.trim() === "") {
        showUnitPriceFloorWarning(
          `Unit price is required (base price : ${formatBasePriceText(floor)}).`,
        );
        return;
      }
      const entered = toNum(line.unitPrice);
      if (entered < floor) {
        showUnitPriceFloorWarning(
          `Cannot be lower than base selling price (base price : ${formatBasePriceText(floor)}).`,
        );
        return;
      }
      clearUnitPriceFloorWarning();
    },
    [
      clearUnitPriceFloorWarning,
      formatBasePriceText,
      invoiceType,
      lines,
      showUnitPriceFloorWarning,
      stockEntries,
    ],
  );

  const handleSellingPriceMarginChange = useCallback(
    (value: string) => {
      setSellingPriceMarginPercent(value);
      if (invoiceType !== "PURCHASE_INVOICE") return;
      const trimmed = value.trim();
      if (trimmed === "") return;
      setLines((prev) =>
        prev.map((line) => {
          const purchase = line.unitPrice.trim();
          if (purchase === "") return line;
          return {
            ...line,
            sellingPrice: sellingPriceFromPurchaseAndMargin(purchase, trimmed),
          };
        }),
      );
    },
    [invoiceType],
  );

  const handlePurchaseUnitPriceChange = useCallback(
    (lineId: string, value: string) => {
      const patch: Partial<InvoiceLineDraft> = { unitPrice: value };
      if (invoiceType === "PURCHASE_INVOICE" && sellingPriceMarginPercent.trim() !== "") {
        patch.sellingPrice = sellingPriceFromPurchaseAndMargin(value, sellingPriceMarginPercent);
      }
      updateLine(lineId, patch);
    },
    [invoiceType, sellingPriceMarginPercent, updateLine],
  );

  const handleStockChoiceSelect = useCallback(
    (lineId: string, choice: StockChoice) => {
      if (!choice.enabledForSelection) return;
      const purchaseSide = !isSalesFamily(invoiceType);
      const defaultUnitPrice = purchaseSide
        ? invoiceType === "PURCHASE_INVOICE"
          ? (choice.entry.purchasePrice ?? choice.entry.sellingPrice ?? "")
          : (choice.entry.sellingPrice ?? "")
        : (choice.entry.sellingPrice ?? "");
      const purchaseStr = String(defaultUnitPrice ?? "").trim();
      let sellingForPurchase = "";
      if (invoiceType === "PURCHASE_INVOICE") {
        if (sellingPriceMarginPercent.trim() !== "") {
          sellingForPurchase = sellingPriceFromPurchaseAndMargin(
            purchaseStr,
            sellingPriceMarginPercent,
          );
        } else {
          const existing = choice.entry.sellingPrice?.trim() ?? "";
          sellingForPurchase = existing !== "" && toNum(existing) > 0 ? existing : purchaseStr;
        }
      } else if (invoiceType === "PURCHASE_RETURN") {
        sellingForPurchase = choice.entry.sellingPrice?.trim() ?? "";
      }
      updateLine(lineId, {
        item: choice.item,
        stockEntryId: choice.entry.id,
        itemName: purchaseSide ? choice.item.name : "",
        hsnCode: purchaseSide ? (choice.item.hsnCode?.trim() ?? "") : "",
        sacCode: purchaseSide ? (choice.item.sacCode?.trim() ?? "") : "",
        unitPrice: defaultUnitPrice,
        ...(invoiceType === "PURCHASE_INVOICE" || invoiceType === "PURCHASE_RETURN"
          ? { sellingPrice: sellingForPurchase }
          : {}),
        quantity: "1",
        discountPercent: "",
        discountAmount: "",
        cgstRate: choice.item.cgstRate ?? "0",
        sgstRate: choice.item.sgstRate ?? "0",
        igstRate: choice.item.igstRate ?? "0",
      });
      setStockSearchOpen(false);
      setStockSearchText("");
      clearUnitPriceFloorWarning();
    },
    [clearUnitPriceFloorWarning, invoiceType, updateLine, sellingPriceMarginPercent],
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

      if (!isSalesFamily(invoiceType)) {
        const parsed = toNum(value);
        const safePercent = Math.min(100, Math.max(0, parsed));
        const qty = Math.max(0, toNum(line.quantity));
        const unitPrice = Math.max(0, toNum(line.unitPrice));
        const gross = qty * unitPrice;
        const computedAmount = (gross * safePercent) / 100;
        updateLine(lineId, { discountPercent: value, discountAmount: computedAmount.toFixed(2) });
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
    [lines, stockEntries, updateLine, invoiceType],
  );

  const handleLineDiscountAmountChange = useCallback(
    (lineId: string, value: string) => {
      const line = lines.find((x) => x.id === lineId);
      if (!line) return;

      if (value.trim() === "") {
        updateLine(lineId, { discountAmount: "", discountPercent: "" });
        return;
      }

      if (!isSalesFamily(invoiceType)) {
        const parsed = Math.max(0, toNum(value));
        const qty = Math.max(0, toNum(line.quantity));
        const unitPrice = Math.max(0, toNum(line.unitPrice));
        const gross = qty * unitPrice;
        const safeAmount = Math.min(gross, parsed);
        const computedPercent = gross > 0 ? (safeAmount / gross) * 100 : 0;
        updateLine(lineId, { discountAmount: value, discountPercent: computedPercent.toFixed(2) });
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
    [lines, stockEntries, updateLine, invoiceType],
  );

  /** Keep ₹ discount in sync when qty changes (% scales with line total; ₹-only scales with qty ratio). */
  const handleLineQuantityChange = useCallback(
    (lineId: string, quantity: string) => {
      const line = lines.find((x) => x.id === lineId);
      if (!line) return;

      let qtyInput = quantity;
      if (invoiceType === "SALE_RETURN" || invoiceType === "PURCHASE_RETURN") {
        const capStr = line.remainingReturnableQty?.trim() || line.soldQuantity?.trim() || "";
        const maxCap = toNum(capStr);
        if (maxCap > 0 && toNum(quantity) > maxCap) {
          qtyInput = formatQty(maxCap);
          showErrorToast(
            null,
            "Return quantity cannot exceed what's still returnable on this line.",
          );
        }
      }

      const newQty = Math.max(0, toNum(qtyInput));
      const unitPrice = Math.max(0, toNum(line.unitPrice));
      const gross = newQty * unitPrice;
      const patch: Partial<InvoiceLineDraft> = { quantity: qtyInput };

      if (!isSalesFamily(invoiceType)) {
        if (line.discountPercent.trim() !== "") {
          const p = Math.min(100, Math.max(0, toNum(line.discountPercent)));
          patch.discountAmount = ((gross * p) / 100).toFixed(2);
        } else if (line.discountAmount.trim() !== "") {
          const oldQty = Math.max(0, toNum(line.quantity));
          const oldAmt = Math.max(0, toNum(line.discountAmount));
          const newAmt = oldQty > 0 ? oldAmt * (newQty / oldQty) : oldAmt;
          const capped = Math.min(newAmt, gross);
          patch.discountAmount = capped.toFixed(2);
          patch.discountPercent = gross > 0 ? ((capped / gross) * 100).toFixed(2) : "";
        }
        updateLine(lineId, patch);
        return;
      }

      if (line.discountPercent.trim() !== "") {
        const p = Math.min(100, Math.max(0, toNum(line.discountPercent)));
        const desiredAmount = (gross * p) / 100;
        const maxForCost = getMaxAllowedDiscountAmount(
          { ...line, quantity: qtyInput },
          stockEntries,
        );
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
        const maxForCost = getMaxAllowedDiscountAmount(
          { ...line, quantity: qtyInput },
          stockEntries,
        );
        newAmt = Math.min(newAmt, gross, maxForCost);
        patch.discountAmount = newAmt.toFixed(2);
        patch.discountPercent = gross > 0 ? ((newAmt / gross) * 100).toFixed(2) : "";
      }

      updateLine(lineId, patch);
    },
    [lines, stockEntries, updateLine, invoiceType],
  );

  const addCurrentLine = useCallback(async () => {
    if (invoiceType === "SALE_RETURN") return;

    if (!isLineValid(draftLine)) {
      showErrorToast(null, "Complete item entry before adding");
      return;
    }

    if (!isSalesFamily(invoiceType)) {
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

    if (invoiceType === "SALE_INVOICE") {
      const baseSellingPrice = Math.max(0, toNum(selectedEntry.sellingPrice));
      if (draftLine.unitPrice.trim() === "") {
        showUnitPriceFloorWarning(
          `Unit price is required (base price : ${formatBasePriceText(baseSellingPrice)}).`,
          true,
        );
        return;
      }
      const editedUnitPrice = Math.max(0, toNum(draftLine.unitPrice));
      if (editedUnitPrice < baseSellingPrice) {
        showUnitPriceFloorWarning(
          `Cannot be lower than base selling price (base price : ${formatBasePriceText(baseSellingPrice)}).`,
          true,
        );
        return;
      }
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
  }, [
    draftLine,
    formatBasePriceText,
    invoiceType,
    isLineValid,
    showUnitPriceFloorWarning,
    stockEntries,
    usedQtyByEntryId,
    updateLine,
  ]);

  const removeAddedLine = useCallback(
    (lineId: string) => {
      setLines((prev) =>
        invoiceType === "SALE_RETURN"
          ? prev.filter((line) => line.id !== lineId)
          : [prev[0], ...prev.slice(1).filter((line) => line.id !== lineId)],
      );
      setStockLineIssues((prev) => {
        if (!prev[lineId]) return prev;
        const next = { ...prev };
        delete next[lineId];
        return next;
      });
    },
    [invoiceType],
  );

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
            itemName: line.itemName.trim() || line.item?.name || "selected item",
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
            itemName: line.itemName.trim() || line.item?.name || "selected item",
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
    if (submitGuardRef.current || createInvoice.isPending || updateDraftInvoice.isPending) return;
    submitGuardRef.current = true;

    if (!party) {
      submitGuardRef.current = false;
      showErrorToast(null, "Please select a party");
      return;
    }

    const vendorFieldError = validatePurchaseVendorBillFields(
      invoiceType,
      originalBillNumber,
      originalBillDate,
      paymentTermsDays,
    );
    if (vendorFieldError) {
      submitGuardRef.current = false;
      showErrorToast(null, vendorFieldError);
      return;
    }

    const linesToSubmit =
      invoiceType === "SALE_RETURN"
        ? addedLines.filter((l) => l.selectedForReturn !== false && toNum(l.quantity) > 0)
        : addedLines;

    if (linesToSubmit.length === 0 || !linesToSubmit.every(isLineValid)) {
      showErrorToast(
        null,
        invoiceType === "SALE_RETURN"
          ? "Select at least one line and enter a return quantity"
          : "Add at least one valid item row",
      );
      return;
    }

    if (invoiceType === "SALE_RETURN" || invoiceType === "PURCHASE_RETURN") {
      for (const line of linesToSubmit) {
        if (!isReturnQuantityOverCap(line)) continue;
        const capStr = line.remainingReturnableQty?.trim() || line.soldQuantity?.trim() || "";
        showErrorToast(
          null,
          `Return quantity cannot exceed what’s still returnable${capStr ? ` (${capStr})` : ""} for ${line.item?.name?.trim() || effectiveLineItemName(line) || "this line"}.`,
        );
        return;
      }
    }

    if (invoiceType === "SALE_INVOICE") {
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

    if (isSalesFamily(invoiceType)) {
      const invalidCostLine = linesToSubmit.find((line) =>
        getCostFloorViolation(line, stockEntries),
      );
      if (invalidCostLine) {
        const violation = getCostFloorViolation(invalidCostLine, stockEntries);
        showErrorToast(
          null,
          `Discount is too high for ${invalidCostLine.item?.name ?? "selected item"}. Net rate (${formatCurrency(violation?.netUnitPrice ?? 0)}) cannot be below cost (${formatCurrency(violation?.costPrice ?? 0)}).`,
        );
        return;
      }
    }

    let linePayload: InvoiceItemInput[];
    try {
      linePayload = linesToSubmit.map((line) => buildInvoiceItemInput(line, invoiceType));
    } catch (lineErr) {
      showErrorToast(
        lineErr instanceof Error ? lineErr.message : null,
        "One or more lines are invalid for this document type",
      );
      return;
    }

    /** Signed adjustment: payable = subtotal + tax − invoice discount + roundOffAmount */
    const roundOffForApi = (() => {
      const r = summary.roundOff;
      if (!Number.isFinite(r) || Math.abs(r) < 0.000_5) return "0.00";
      return r.toFixed(2);
    })();

    const isReturnWithSourceLink =
      invoiceType === "SALE_RETURN" || invoiceType === "PURCHASE_RETURN";
    const allReturnLinesLinked =
      !isReturnWithSourceLink || linesToSubmit.every((l) => l.sourceInvoiceItemId != null);
    const previousReturnSourceId = editingDraftInvoice?.sourceInvoiceId ?? null;

    try {
      if (editInvoiceId) {
        const body: UpdateInvoiceRequest = {
          partyId: party.id,
          consigneeId: selectedConsigneeId,
          invoiceType,
          invoiceDate,
          dueDate: dueDate.trim() === "" ? null : dueDate,
          notes: notes.trim() ? notes : undefined,
          discountAmount: discountAmount.trim() ? discountAmount : undefined,
          discountPercent: discountPercent.trim() ? discountPercent : undefined,
          roundOffAmount: roundOffForApi,
          ...(invoiceType === "PURCHASE_INVOICE" && sellingPriceMarginPercent.trim() !== ""
            ? { sellingPriceMarginPercent: sellingPriceMarginPercent.trim() }
            : {}),
          ...(isPurchaseVendorBillMetaType(invoiceType)
            ? {
                originalBillNumber: originalBillNumber.trim().slice(0, 100) || null,
                originalBillDate: originalBillDate.trim().slice(0, 10) || null,
                paymentTermsDays:
                  paymentTermsDays.trim() === ""
                    ? null
                    : Number.parseInt(paymentTermsDays.trim(), 10),
              }
            : {}),
          ...(isReturnWithSourceLink
            ? {
                ...(allReturnLinesLinked && previousReturnSourceId != null
                  ? { sourceInvoiceId: previousReturnSourceId }
                  : {}),
                ...(previousReturnSourceId != null && !allReturnLinesLinked
                  ? { sourceInvoiceId: null }
                  : {}),
              }
            : {}),
          items: linePayload,
        };
        await updateDraftInvoice.mutateAsync({ invoiceId: editInvoiceId, body });
        showSuccessToast("Invoice updated");
        router.push(`/invoices/${editInvoiceId}`);
        return;
      }

      const created = await createInvoice.mutateAsync({
        partyId: party.id,
        consigneeId: selectedConsigneeId,
        invoiceType,
        invoiceDate,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        discountAmount: discountAmount || undefined,
        discountPercent: discountPercent || undefined,
        roundOffAmount: roundOffForApi,
        ...(invoiceType === "PURCHASE_INVOICE" && sellingPriceMarginPercent.trim() !== ""
          ? { sellingPriceMarginPercent: sellingPriceMarginPercent.trim() }
          : {}),
        ...(isPurchaseVendorBillMetaType(invoiceType)
          ? {
              ...(originalBillNumber.trim().slice(0, 100)
                ? { originalBillNumber: originalBillNumber.trim().slice(0, 100) }
                : {}),
              ...(originalBillDate.trim().slice(0, 10)
                ? { originalBillDate: originalBillDate.trim().slice(0, 10) }
                : {}),
              ...(paymentTermsDays.trim() !== ""
                ? { paymentTermsDays: Number.parseInt(paymentTermsDays.trim(), 10) }
                : {}),
            }
          : {}),
        ...(isReturnWithSourceLink &&
        sourceInvoiceId != null &&
        linesToSubmit.every((l) => l.sourceInvoiceItemId != null)
          ? { sourceInvoiceId }
          : {}),
        items: linePayload,
      });

      showSuccessToast(`${pageMeta.label} created — review and finalize when ready`);
      router.push(created?.id != null ? `/invoices/${created.id}` : pageMeta.path);
    } catch (err) {
      const isSubscriptionError =
        err instanceof ApiClientError &&
        (err.status === 403 || err.status === 404) &&
        /subscription/i.test(err.message);

      if (isSubscriptionError) {
        showErrorToast(
          "Your subscription is inactive or missing — please renew to create invoices.",
          "Subscription required",
        );
      } else {
        showErrorToast(
          withInvoiceQuantityErrorDetails(err),
          editInvoiceId
            ? "Failed to update invoice"
            : `Failed to create ${pageMeta.label.toLowerCase()}`,
        );
      }
    } finally {
      submitGuardRef.current = false;
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
    originalBillNumber,
    originalBillDate,
    paymentTermsDays,
    notes,
    discountAmount,
    discountPercent,
    summary,
    pageMeta,
    router,
    selectedConsigneeId,
    sellingPriceMarginPercent,
    editingDraftInvoice?.sourceInvoiceId,
    sourceInvoiceId,
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
    setSelectedConsigneeId(null);
    setPendingPartyName("");
  }, []);

  const handlePartyChange = useCallback((nextParty: Party | null) => {
    setParty(nextParty);
    setSelectedConsigneeId(null);
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
    setParty: handlePartyChange,
    selectedConsigneeId,
    setSelectedConsigneeId,
    consignees,
    isConsigneesLoading,
    invoiceDate,
    setInvoiceDate,
    dueDate,
    setDueDate,
    originalBillNumber,
    setOriginalBillNumber,
    originalBillDate,
    setOriginalBillDate,
    paymentTermsDays,
    setPaymentTermsDays,
    sellingPriceMarginPercent,
    handleSellingPriceMarginChange,
    handlePurchaseUnitPriceChange,
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
    unitPriceFloorWarning,
    unitPriceFloorIsError,
    roundOffInputValue,
    canSubmit,
    returnQtyBlockReason,
    returnQtySubmitShortHint,
    // Handlers
    updateLine,
    handleStockChoiceSelect,
    handleAddStockForItem,
    handleLineDiscountChange,
    handleLineDiscountAmountChange,
    handleLineQuantityChange,
    handleSalesUnitPriceChange,
    handleSalesUnitPriceBlur,
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
    addressRoleLabel:
      editingDraftInvoice?.addressRoleLabel ??
      (partyType === "CUSTOMER" ? "Delivery Address" : "Vendor Address"),
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
