export function getActionBadgeVariant(
  action: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (action) {
    case "CREATE":
      return "default";
    case "UPDATE":
      return "secondary";
    case "DELETE":
      return "destructive";
    case "FINALIZE":
      return "default";
    case "CANCEL":
      return "destructive";
    default:
      return "outline";
  }
}

export function getChangesDisplay(changes: Record<string, unknown> | null): string {
  if (!changes) return "—";

  const actualChanges =
    typeof changes === "object" &&
    changes !== null &&
    "changes" in changes &&
    typeof (changes as Record<string, unknown>).changes === "object"
      ? ((changes as Record<string, unknown>).changes as Record<string, unknown>)
      : changes;

  const entries = Object.entries(actualChanges);
  if (entries.length === 0) return "—";

  return (
    entries
      .slice(0, 2)
      .map(([k, v]) => {
        const displayValue = typeof v === "string" && v.length > 20 ? v.slice(0, 20) + "..." : v;
        return `${k}: ${displayValue}`;
      })
      .join(" • ") + (entries.length > 2 ? ` • +${entries.length - 2} more` : "")
  );
}
