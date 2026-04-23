import { getLineAmounts, toNum } from "@/lib/invoice/invoice-create";
import { moneyToPaise, paiseToMoney } from "@/lib/invoice/invoice-create-mapping";
import type { InvoiceLineDraft } from "@/types/invoice-create";

export type InvoiceCreateBillSummary = {
  subTotal: number;
  lineDiscountTotal: number;
  taxableTotal: number;
  invoiceDiscount: number;
  taxTotal: number;
  taxPercent: number;
  roundOff: number;
  grandTotal: number;
};

/** Totals for the invoice create sidebar (taxable, tax, discounts, round-off, payable). */
export function computeInvoiceCreateBillSummary(
  linesForBillSummary: InvoiceLineDraft[],
  discountAmount: string,
  discountPercent: string,
  roundOffAmount: string,
  autoRoundOff: boolean,
): InvoiceCreateBillSummary {
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
}
