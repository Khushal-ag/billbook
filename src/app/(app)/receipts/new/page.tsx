import { redirect } from "next/navigation";

/** Legacy URL: opens new-receipt flow on the list page. */
export default function NewReceiptRedirectPage() {
  redirect("/receipts?openNewReceipt=1");
}
