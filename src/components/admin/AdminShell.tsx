"use client";

import Link from "next/link";
import { type ReactNode } from "react";

import Logo from "@/components/Logo";
import { adminConsoleHomePath } from "@/lib/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type AdminShellProps = {
  children: ReactNode;
  /** Right side of the top bar (e.g. home link + sign out) */
  actions?: ReactNode;
};

/**
 * Shared chrome for admin routes: sticky header, BillBook branding, “Admin” badge.
 */
export function AdminShell({ children, actions }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-muted/20">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/75 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex h-[3.25rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={adminConsoleHomePath}
              className="flex min-w-0 items-center overflow-hidden rounded-md outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="BillBook admin home"
            >
              <Logo className="h-9 w-9 shrink-0" />
            </Link>
            <Separator orientation="vertical" className="hidden h-7 sm:block" />
            <Badge variant="secondary" className="hidden font-medium sm:inline-flex">
              Admin console
            </Badge>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6">{children}</main>
    </div>
  );
}
