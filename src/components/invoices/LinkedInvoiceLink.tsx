"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useInvoice } from "@/hooks/use-invoices";
import { cn } from "@/lib/utils";

type Props = {
  invoiceId: number;
  /** When the list/detail payload already includes the display number, no extra fetch. */
  invoiceNumber?: string | null;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /** If omitted, shows invoice number, or a short loading/fallback label. */
  children?: ReactNode;
};

/**
 * Link to an invoice detail page using the human-readable invoice number when available.
 */
export function LinkedInvoiceLink({
  invoiceId,
  invoiceNumber: invoiceNumberProp,
  className,
  onClick,
  children,
}: Props) {
  const embedded = invoiceNumberProp?.trim();
  const { data: invoice, isPending } = useInvoice(embedded ? undefined : invoiceId);
  const number = embedded || invoice?.invoiceNumber?.trim();
  const label = children ?? (number ? number : isPending ? "Loading…" : "Invoice");

  return (
    <Link
      href={`/invoices/${invoiceId}`}
      className={cn("text-primary hover:underline", className)}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}
