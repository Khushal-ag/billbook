import { parseISODateString, toISODateString } from "@/lib/core/date";
import { isPurchaseVendorBillMetaType } from "@/lib/invoice/invoice";
import type { InvoiceType } from "@/types/invoice";

export function validatePurchaseVendorBillFields(
  invoiceType: InvoiceType,
  originalBillNumber: string,
  originalBillDate: string,
  paymentTermsDays: string,
): string | null {
  if (!isPurchaseVendorBillMetaType(invoiceType)) return null;
  const obn = originalBillNumber.trim();
  if (obn === "") {
    return "Original bill no. is required.";
  }
  if (obn.length > 100) {
    return "Original bill no. must be at most 100 characters.";
  }
  const obd = originalBillDate.trim().slice(0, 10);
  if (obd === "") {
    return "Original bill date is required.";
  }
  if (!parseISODateString(obd)) {
    return "Enter a valid original bill date.";
  }
  const today = toISODateString(new Date());
  if (obd > today) {
    return "Original bill date cannot be in the future.";
  }
  const raw = paymentTermsDays.trim();
  if (raw === "") return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || String(n) !== raw || n < 0 || n > 3650) {
    return "Payment terms must be a whole number from 0 to 3650.";
  }
  return null;
}
