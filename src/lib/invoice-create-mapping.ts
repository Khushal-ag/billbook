import {
  effectivePurchaseLineGstPayload,
  getLineAmounts,
  isDraftLineServiceItem,
  toNum,
} from "@/lib/invoice-create";
import { isSalesFamily } from "@/lib/invoice";
import type { InvoiceLineDraft } from "@/types/invoice-create";
import type { Item } from "@/types/item";
import type { InvoiceItem, InvoiceItemInput, InvoiceType } from "@/types/invoice";

/** Whole paise — avoids float drift on invoice totals and round-off sign bugs. */
export function moneyToPaise(rupees: number): number {
  return Math.round((Number.isFinite(rupees) ? rupees : 0) * 100);
}

export function paiseToMoney(pa: number): number {
  return pa / 100;
}

/** Same base as bill summary (taxable + tax − invoice discount), in paise. */
export function computeBasePaiseFromAddedLines(
  lineDrafts: InvoiceLineDraft[],
  discountAmountStr: string,
  discountPercentStr: string,
): number {
  const lineBreakup = lineDrafts.map((l) => getLineAmounts(l));
  const taxableTotal = lineBreakup.reduce((s, x) => s + x.taxable, 0);
  const invoiceDiscount = discountAmountStr.trim()
    ? Math.max(0, toNum(discountAmountStr))
    : (taxableTotal * Math.max(0, toNum(discountPercentStr))) / 100;
  const taxTotal = lineBreakup.reduce((s, x) => s + x.tax, 0);
  const baseTotal = Math.max(0, taxableTotal + taxTotal - invoiceDiscount);
  return moneyToPaise(baseTotal);
}

/**
 * GST % on the saved invoice line wins over master item / stock embed (catalog often has 0% while
 * the line was invoiced at e.g. 4% IGST) — required for correct bill summary on edit.
 */
export function pickInvoiceTaxRate(
  invoiceVal: string | null | undefined,
  itemVal: string | null | undefined,
): string {
  const v = invoiceVal?.trim();
  if (v !== undefined && v !== "") return v;
  const i = itemVal?.trim();
  if (i !== undefined && i !== "") return i;
  return "0";
}

/** Prefer invoice API line display fields over stock-entry fallbacks (e.g. unnamed item). */
export function mergeItemFromInvoiceLine(item: Item, invLine: InvoiceItem): Item {
  const name = invLine.itemName?.trim();
  const hsn = invLine.hsnCode?.trim();
  const sac = invLine.sacCode?.trim();
  return {
    ...item,
    name: name || item.name,
    hsnCode: hsn ? invLine.hsnCode! : item.hsnCode,
    sacCode: sac ? invLine.sacCode! : item.sacCode,
    isTaxable: invLine.isTaxable ?? item.isTaxable,
    cgstRate: pickInvoiceTaxRate(invLine.cgstRate, item.cgstRate),
    sgstRate: pickInvoiceTaxRate(invLine.sgstRate, item.sgstRate),
    igstRate: pickInvoiceTaxRate(invLine.igstRate, item.igstRate),
  };
}

function purchaseFamilyTaxFields(
  line: InvoiceLineDraft,
): Pick<InvoiceItemInput, "cgstRate" | "sgstRate" | "igstRate"> {
  return effectivePurchaseLineGstPayload(line);
}

/** Display / API item name: draft override or catalog name from batch picker (purchase does not send `stockEntryId`). */
export function effectiveLineItemName(line: InvoiceLineDraft): string {
  return line.itemName.trim() || line.item?.name?.trim() || "";
}

/** Map draft row → API `items[]` element (rules depend on `invoiceType`). */
export function buildInvoiceItemInput(
  line: InvoiceLineDraft,
  invoiceType: InvoiceType,
): InvoiceItemInput {
  const discountPercent = line.discountPercent.trim() === "" ? "0" : line.discountPercent;
  const discountAmount = line.discountAmount.trim() === "" ? "0" : line.discountAmount;

  if (!isSalesFamily(invoiceType)) {
    const itemName = effectiveLineItemName(line);
    if (!itemName) {
      throw new Error("Each line needs an item description");
    }
    const payload: InvoiceItemInput = {
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      itemName,
      discountPercent,
      discountAmount,
      ...purchaseFamilyTaxFields(line),
    };
    if (line.item?.id != null) {
      payload.itemId = line.item.id;
    }
    if (
      (invoiceType === "PURCHASE_INVOICE" || invoiceType === "PURCHASE_RETURN") &&
      line.sellingPrice?.trim()
    ) {
      payload.sellingPrice = line.sellingPrice.trim();
    }
    if (line.hsnCode.trim()) payload.hsnCode = line.hsnCode.trim();
    else if (line.item?.hsnCode?.trim()) payload.hsnCode = line.item.hsnCode.trim();
    if (line.sacCode.trim()) payload.sacCode = line.sacCode.trim();
    else if (line.item?.sacCode?.trim()) payload.sacCode = line.item.sacCode.trim();

    if (invoiceType === "PURCHASE_RETURN") {
      /**
       * Inventory purchase returns: API matches `itemId`, `stockEntryId`, and `sourceInvoiceItemId`
       * to the original purchase line so stock moves on finalize. Service lines omit batch fields.
       */
      const isService = isDraftLineServiceItem(line);
      if (!isService) {
        if (line.stockEntryId == null) {
          throw new Error(
            "Each stock line needs the batch (stock entry id) from the original purchase line.",
          );
        }
        if (line.item?.id == null) {
          throw new Error(
            "Each stock line needs the catalog item id from the original purchase line.",
          );
        }
        if (line.sourceInvoiceItemId == null) {
          throw new Error(
            "Link each line to the original purchase line (source invoice item id from the source bill).",
          );
        }
        payload.itemId = line.item.id;
        payload.stockEntryId = line.stockEntryId;
        payload.sourceInvoiceItemId = line.sourceInvoiceItemId;
      } else {
        if (line.sourceInvoiceItemId != null) {
          payload.sourceInvoiceItemId = line.sourceInvoiceItemId;
        }
        if (line.stockEntryId != null) {
          payload.stockEntryId = line.stockEntryId;
        }
      }
    }
    return payload;
  }

  if (line.stockEntryId == null) {
    throw new Error("Sale lines require a stock batch");
  }

  const payload: InvoiceItemInput = {
    stockEntryId: line.stockEntryId,
    quantity: line.quantity,
    discountPercent,
    discountAmount,
  };
  if (line.unitPrice.trim() !== "") {
    payload.unitPrice = line.unitPrice;
  }
  if (invoiceType === "SALE_RETURN" && line.sourceInvoiceItemId != null) {
    payload.sourceInvoiceItemId = line.sourceInvoiceItemId;
    /**
     * Linked sale return (STOCK catalog lines): API validates `itemId` and `stockEntryId` against
     * the source sale line — same pattern as purchase returns. Omit `itemId` for SERVICE lines.
     */
    if (!isDraftLineServiceItem(line)) {
      if (line.item?.id == null) {
        throw new Error(
          "Each stock return line must include itemId matching the source sale line.",
        );
      }
      payload.itemId = line.item.id;
    }
  }
  return payload;
}
