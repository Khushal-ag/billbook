import { cn, formatCurrency } from "@/lib/core/utils";
import { parsePartyLedgerAmount, partyLedgerBalanceNature } from "@/lib/party/party-ledger-display";

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, { amount: string; tag: string }> = {
  sm: { amount: "text-sm", tag: "text-[10px]" },
  md: { amount: "text-sm", tag: "text-xs" },
  lg: { amount: "text-lg sm:text-xl", tag: "text-xs sm:text-sm" },
};

interface LedgerBalanceTextProps {
  /** Signed decimal string from API (e.g. currentBalance, runningBalance). */
  value: string | null | undefined;
  /** Visual scale for summary cards vs table cells. */
  size?: Size;
  className?: string;
  align?: "start" | "end";
  /** Summary card: stack rupees above Debit/Credit; tables: inline. */
  layout?: "inline" | "stacked";
  /**
   * `word`: Debit / Credit / Balanced (summary cards).
   * `abbrev`: Dr / Cr / Bal. — passbook-style for dense tables.
   */
  tagStyle?: "word" | "abbrev";
}

/**
 * Renders absolute rupee amount + balance nature (Debit/Credit or Dr/Cr), not a leading −/+ on the amount.
 */
export function LedgerBalanceText({
  value,
  size = "md",
  className,
  align = "end",
  layout = "inline",
  tagStyle = "word",
}: LedgerBalanceTextProps) {
  const n = parsePartyLedgerAmount(value);
  const nature = partyLedgerBalanceNature(n);
  const abs = formatCurrency(Math.abs(n));
  const { amount: amountCls, tag: tagCls } = sizeClasses[size];

  const rowClass =
    layout === "stacked"
      ? cn(
          "flex flex-col items-start gap-1 tabular-nums",
          align === "end" && "items-end",
          amountCls,
        )
      : cn(
          "inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums",
          align === "end" && "w-full justify-end",
          amountCls,
        );

  if (nature === "ZERO") {
    return (
      <span className={cn(rowClass, className)}>
        <span className="font-semibold text-foreground">{formatCurrency(0)}</span>
        <span className={cn("font-medium text-muted-foreground", tagCls)}>
          {tagStyle === "abbrev" ? "Bal." : "Balanced"}
        </span>
      </span>
    );
  }

  const isDebit = nature === "DEBIT";
  const tagWord = isDebit ? "Debit" : "Credit";
  const tagAbbrev = isDebit ? "Dr" : "Cr";
  const tagLabel = tagStyle === "abbrev" ? tagAbbrev : tagWord;
  const tagTone = cn(
    "font-semibold",
    tagStyle === "word" && "uppercase tracking-wide",
    tagStyle === "abbrev" && "tabular-nums",
    tagCls,
    isDebit ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
  );

  return (
    <span className={cn(rowClass, className)}>
      <span className="font-semibold text-foreground">{abs}</span>
      <span className={tagTone}>{tagLabel}</span>
    </span>
  );
}
