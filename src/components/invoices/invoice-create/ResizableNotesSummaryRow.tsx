"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const LG_MIN = 1024;
const DEFAULT_NOTES_WIDTH = 720;
const MIN_NOTES_WIDTH = 200;

interface ResizableNotesSummaryRowProps {
  notes: ReactNode;
  summary: ReactNode;
}

export function ResizableNotesSummaryRow({ notes, summary }: ResizableNotesSummaryRowProps) {
  const [notesWidth, setNotesWidth] = useState(DEFAULT_NOTES_WIDTH);
  const [isLg, setIsLg] = useState(false);
  const drag = useRef<{ startX: number; startW: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LG_MIN}px)`);
    const update = () => setIsLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const clamp = () => {
      const max = Math.min(window.innerWidth * 0.55, 720);
      setNotesWidth((w) => Math.min(Math.max(w, MIN_NOTES_WIDTH), max));
    };
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, []);

  const maxNotesWidth = useCallback(() => {
    if (typeof window === "undefined") return 720;
    return Math.min(window.innerWidth * 0.55, 720);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current) return;
      const delta = e.clientX - drag.current.startX;
      const next = Math.min(
        Math.max(drag.current.startW + delta, MIN_NOTES_WIDTH),
        maxNotesWidth(),
      );
      setNotesWidth(next);
    };
    const onUp = () => {
      if (!drag.current) return;
      drag.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [maxNotesWidth]);

  const onResizePointerDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      drag.current = { startX: e.clientX, startW: notesWidth };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [notesWidth],
  );

  return (
    <div className={cn("flex gap-4", isLg ? "flex-row items-start" : "flex-col")}>
      <div
        className={cn(
          "min-w-0 shrink-0",
          isLg && "min-w-[200px] max-w-[min(55vw,720px)]",
          !isLg && "w-full",
        )}
        style={isLg ? { width: notesWidth } : undefined}
      >
        {notes}
      </div>

      {isLg && (
        <button
          type="button"
          aria-label="Drag to resize notes panel"
          title="Drag to resize notes"
          onMouseDown={onResizePointerDown}
          className={cn(
            "group relative mt-1 flex w-3 shrink-0 cursor-col-resize items-center justify-center self-start rounded-sm",
            "border border-transparent hover:border-border hover:bg-muted/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <GripVertical
            className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100"
            aria-hidden
          />
        </button>
      )}

      <div className={cn("min-w-0", isLg ? "flex flex-1 justify-end" : "w-full")}>{summary}</div>
    </div>
  );
}
