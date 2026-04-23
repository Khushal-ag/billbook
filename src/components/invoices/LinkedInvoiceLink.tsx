"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useInvoice } from "@/hooks/use-invoices";
import { cn } from "@/lib/core/utils";

type Props = {
  invoiceId?: number | null;
  /** When the list/detail payload already includes the display number, no extra fetch. */
  invoiceNumber?: string | null;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLSpanElement>) => void;
  /** If omitted, shows invoice number, or a short loading/fallback label. */
  children?: ReactNode;
};

/**
 * Link to an invoice detail page using the human-readable invoice number when available.
 * When `invoiceId` is missing, renders plain text (e.g. display number only or "—").
 */
export function LinkedInvoiceLink({
  invoiceId,
  invoiceNumber: invoiceNumberProp,
  className,
  onClick,
  children,
}: Props) {
  const embedded = invoiceNumberProp?.trim();
  const numericId =
    invoiceId != null && Number.isFinite(Number(invoiceId)) ? Number(invoiceId) : undefined;

  const shouldFetch = Boolean(!embedded && numericId !== undefined);
  const { data: invoice, isPending } = useInvoice(shouldFetch ? numericId : undefined);

  const number = embedded || invoice?.invoiceNumber?.trim();
  const defaultLabel =
    number != null && number !== ""
      ? number
      : numericId !== undefined
        ? isPending
          ? "Loading…"
          : "Invoice"
        : "—";

  const content = children ?? defaultLabel;

  if (numericId === undefined) {
    return (
      <span
        className={cn(embedded ? "text-foreground" : "text-muted-foreground", className)}
        onClick={onClick}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={`/invoices/${numericId}`}
      className={cn("text-primary hover:underline", className)}
      onClick={onClick}
    >
      {content}
    </Link>
  );
}
