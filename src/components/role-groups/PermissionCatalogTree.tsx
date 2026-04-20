"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PermissionCatalogNode } from "@/types/role-group";

function collectKeys(node: PermissionCatalogNode): string[] {
  if (node.type === "permission") return [node.key];
  return node.children.flatMap(collectKeys);
}

function countCatalogPermissions(nodes: PermissionCatalogNode[]): number {
  let n = 0;
  for (const node of nodes) {
    if (node.type === "permission") n += 1;
    else n += countCatalogPermissions(node.children);
  }
  return n;
}

function allFolderIds(nodes: PermissionCatalogNode[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if (n.type === "folder") {
      out.push(n.id);
      out.push(...allFolderIds(n.children));
    }
  }
  return out;
}

function FolderSection({
  node,
  selected,
  expanded,
  onToggleExpanded,
  onToggleKey,
  onToggleFolder,
  depth,
  disabled,
}: {
  node: Extract<PermissionCatalogNode, { type: "folder" }>;
  selected: Set<string>;
  expanded: Set<string>;
  onToggleExpanded: (id: string) => void;
  onToggleKey: (key: string, next: boolean) => void;
  onToggleFolder: (
    node: Extract<PermissionCatalogNode, { type: "folder" }>,
    nextChecked: boolean,
  ) => void;
  depth: number;
  disabled?: boolean;
}) {
  const keys = useMemo(() => collectKeys(node), [node]);
  const checkedCount = keys.filter((k) => selected.has(k)).length;
  const allChecked = keys.length > 0 && checkedCount === keys.length;
  const noneChecked = checkedCount === 0;
  const indeterminate = !allChecked && !noneChecked;

  const folderChecked = allChecked ? true : indeterminate ? ("indeterminate" as const) : false;

  return (
    <div className={cn("space-y-1", depth > 0 && "border-l border-border/50 pl-3")}>
      <div
        className={cn(
          "flex items-start gap-2 rounded-lg py-0.5 pr-1 transition-colors",
          depth === 0 && "bg-muted/20 hover:bg-muted/35",
        )}
      >
        <button
          type="button"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/80"
          onClick={() => onToggleExpanded(node.id)}
          aria-expanded={expanded.has(node.id)}
        >
          <ChevronRight
            className={cn("h-4 w-4 transition-transform", expanded.has(node.id) && "rotate-90")}
          />
        </button>
        <div className="flex min-w-0 flex-1 items-start gap-3 pt-0.5">
          <Checkbox
            id={`folder-${node.id}`}
            checked={folderChecked}
            disabled={disabled}
            onCheckedChange={(v) => {
              const next = v === true;
              onToggleFolder(node, next);
            }}
            className="mt-0.5"
          />
          <label
            htmlFor={`folder-${node.id}`}
            className={cn(
              "text-sm font-medium leading-snug",
              disabled ? "cursor-default" : "cursor-pointer",
            )}
          >
            {node.label}
          </label>
        </div>
      </div>
      {expanded.has(node.id) && (
        <div className="space-y-0.5 pb-1">
          {node.children.map((child, i) => (
            <CatalogBranch
              key={child.type === "folder" ? child.id : `${child.key}-${i}`}
              node={child}
              selected={selected}
              expanded={expanded}
              onToggleExpanded={onToggleExpanded}
              onToggleKey={onToggleKey}
              onToggleFolder={onToggleFolder}
              depth={depth + 1}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CatalogBranch({
  node,
  selected,
  expanded,
  onToggleExpanded,
  onToggleKey,
  onToggleFolder,
  depth,
  disabled,
}: {
  node: PermissionCatalogNode;
  selected: Set<string>;
  expanded: Set<string>;
  onToggleExpanded: (id: string) => void;
  onToggleKey: (key: string, next: boolean) => void;
  onToggleFolder: (
    node: Extract<PermissionCatalogNode, { type: "folder" }>,
    nextChecked: boolean,
  ) => void;
  depth: number;
  disabled?: boolean;
}) {
  if (node.type === "permission") {
    const isChecked = selected.has(node.key);
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-md py-1.5 pl-1 pr-2 transition-colors hover:bg-muted/30",
          depth > 0 && "ml-9 border-l border-border/40 pl-3",
        )}
      >
        <Checkbox
          id={`perm-${node.key}`}
          checked={isChecked}
          disabled={disabled}
          onCheckedChange={(v) => onToggleKey(node.key, v === true)}
          className="mt-0.5"
        />
        <label
          htmlFor={`perm-${node.key}`}
          className={cn(
            "text-sm leading-snug",
            isChecked ? "font-medium text-foreground" : "text-muted-foreground",
            !disabled && "cursor-pointer",
          )}
        >
          {node.label}
        </label>
      </div>
    );
  }

  return (
    <FolderSection
      node={node}
      selected={selected}
      expanded={expanded}
      onToggleExpanded={onToggleExpanded}
      onToggleKey={onToggleKey}
      onToggleFolder={onToggleFolder}
      depth={depth}
      disabled={disabled}
    />
  );
}

interface PermissionCatalogTreeProps {
  catalog: PermissionCatalogNode[];
  value: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
  /** Nest inside a parent card: lighter chrome, no duplicate heavy shadow */
  embedded?: boolean;
}

export function PermissionCatalogTree({
  catalog,
  value,
  onChange,
  disabled,
  embedded,
}: PermissionCatalogTreeProps) {
  const selected = useMemo(() => new Set(value), [value]);

  const initialExpanded = useMemo(() => new Set(allFolderIds(catalog)), [catalog]);
  const [expanded, setExpanded] = useState(() => initialExpanded);
  const catalogHydrated = useRef(false);
  useEffect(() => {
    if (!catalog.length) return;
    if (catalogHydrated.current) return;
    catalogHydrated.current = true;
    setExpanded(new Set(allFolderIds(catalog)));
  }, [catalog]);

  const onToggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onToggleKey = useCallback(
    (key: string, next: boolean) => {
      if (disabled) return;
      const s = new Set(value);
      if (next) s.add(key);
      else s.delete(key);
      onChange([...s].sort());
    },
    [value, onChange, disabled],
  );

  const onToggleFolder = useCallback(
    (folder: Extract<PermissionCatalogNode, { type: "folder" }>, nextChecked: boolean) => {
      if (disabled) return;
      const keys = collectKeys(folder);
      const s = new Set(value);
      for (const k of keys) {
        if (nextChecked) s.add(k);
        else s.delete(k);
      }
      onChange([...s].sort());
    },
    [value, onChange, disabled],
  );

  const totalInCatalog = useMemo(() => countCatalogPermissions(catalog), [catalog]);
  const selectedCount = value.length;

  const expandAll = useCallback(() => {
    setExpanded(new Set(allFolderIds(catalog)));
  }, [catalog]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  return (
    <div
      className={cn(
        "overflow-hidden",
        embedded
          ? "rounded-lg border border-border/60 bg-background/60"
          : "rounded-xl border border-border/80 bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
          embedded ? "border-border/50 bg-muted/25" : "border-border/70 bg-muted/20",
        )}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">By area</p>
          <p className="text-xs text-muted-foreground">
            {selectedCount === totalInCatalog && totalInCatalog > 0
              ? "All permissions enabled"
              : `${selectedCount} of ${totalInCatalog} selected`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={expandAll}>
            Expand all
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={collapseAll}>
            Collapse all
          </Button>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <div className="space-y-1">
          {catalog.map((node, i) => (
            <CatalogBranch
              key={node.type === "folder" ? node.id : `${node.key}-${i}`}
              node={node}
              selected={selected}
              expanded={expanded}
              onToggleExpanded={onToggleExpanded}
              onToggleKey={onToggleKey}
              onToggleFolder={onToggleFolder}
              depth={0}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
