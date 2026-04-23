"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Alert } from "@/types/alert";
import { cn, formatDate } from "@/lib/core/utils";

const ALERTS_PREVIEW_COUNT = 3;

interface StockAlertsBannerProps {
  alerts: Alert[];
  onMarkRead?: (id: number) => void;
  markReadPending?: boolean;
}

export function StockAlertsBanner({ alerts, onMarkRead, markReadPending }: StockAlertsBannerProps) {
  const [expanded, setExpanded] = useState(false);
  if (alerts.length === 0) return null;

  const hasMore = alerts.length > ALERTS_PREVIEW_COUNT;
  const visible = expanded || !hasMore ? alerts : alerts.slice(0, ALERTS_PREVIEW_COUNT);

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">Low stock alerts</span>
          {hasMore ? (
            <span className="text-xs font-normal tabular-nums text-amber-800/80 dark:text-amber-300/90">
              ({alerts.length})
            </span>
          ) : null}
        </div>
        {hasMore ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1 text-amber-900 hover:bg-amber-500/20 hover:text-amber-950 dark:text-amber-200 dark:hover:bg-amber-500/15 dark:hover:text-amber-50"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : "Show all"}
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
              aria-hidden
            />
          </Button>
        ) : null}
      </div>
      <ul className="mt-3 space-y-2">
        {visible.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm"
          >
            <span className="flex-1">{a.message}</span>
            <div className="flex items-center gap-2">
              {a.itemId != null && (
                <Link
                  href={`/items/${a.itemId}`}
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View item
                </Link>
              )}
              <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
              {onMarkRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => onMarkRead(a.id)}
                  disabled={markReadPending}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
