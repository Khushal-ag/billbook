import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Alert } from "@/types/alert";
import { formatDate } from "@/lib/utils";

interface StockAlertsBannerProps {
  alerts: Alert[];
  onMarkRead: (id: number) => void;
  markReadPending: boolean;
}

export function StockAlertsBanner({ alerts, onMarkRead, markReadPending }: StockAlertsBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="font-medium">Low stock alerts</span>
      </div>
      <ul className="mt-3 space-y-2">
        {alerts.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm"
          >
            <span className="flex-1">{a.message}</span>
            <div className="flex items-center gap-2">
              {a.itemId != null && (
                <Link
                  to={`/items/${a.itemId}`}
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View item
                </Link>
              )}
              <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => onMarkRead(a.id)}
                disabled={markReadPending}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
