"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogOut, Menu } from "lucide-react";

import Logo from "@/components/Logo";
import { adminConsoleHomePath, adminConsoleNavItems } from "@/lib/admin/admin-nav";
import { useAuth } from "@/contexts/AuthContext";
import { AdminRouteGuard } from "@/components/admin/AdminRouteGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/core/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <ul className="flex flex-col gap-1" role="list">
      {adminConsoleNavItems.map(({ href, label, description, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "border-border bg-muted/80 font-medium text-foreground shadow-sm"
                  : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/40 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border shadow-sm transition-colors",
                  active
                    ? "border-primary/25 bg-primary/10 text-primary"
                    : "border-border/60 bg-background/80 text-muted-foreground group-hover:text-foreground",
                )}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block leading-tight">{label}</span>
                {description ? (
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {description}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function AdminConsoleFrame({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const onSignOut = () => {
    void logout().then(() => router.replace("/admin/login"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-muted/20">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/65">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 lg:hidden"
                  aria-label="Open admin navigation"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[min(100%,20rem)] flex-col gap-0 p-0">
                <SheetHeader className="border-b border-border/70 px-4 py-4 text-left">
                  <SheetTitle className="text-base font-semibold">Admin console</SheetTitle>
                  <p className="text-xs font-normal text-muted-foreground">Choose a section</p>
                </SheetHeader>
                <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin console">
                  <NavLinks onNavigate={closeMobile} />
                </nav>
              </SheetContent>
            </Sheet>

            <Link
              href={adminConsoleHomePath}
              className="min-w-0 shrink-0 rounded-md outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="BillBook admin home"
            >
              <Logo className="h-8 w-8 sm:h-9 sm:w-9" />
            </Link>

            <Separator orientation="vertical" className="hidden h-7 sm:block" />

            <Badge
              variant="secondary"
              className="hidden max-w-[10rem] truncate text-xs font-normal sm:inline-flex"
            >
              Admin
            </Badge>
            <span className="hidden text-xs text-muted-foreground md:inline">·</span>
            <span className="hidden text-xs text-muted-foreground md:inline">Internal tools</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" asChild className="shadow-sm">
              <Link href="/">Marketing site</Link>
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="gap-1.5 shadow-sm"
              onClick={onSignOut}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)] w-full">
        <aside
          className="sticky top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-[15.5rem] shrink-0 border-r border-border/70 bg-card/50 shadow-[inset_-1px_0_0_0_hsl(var(--border)/0.5)] backdrop-blur-sm lg:block"
          aria-label="Admin console"
        >
          <div className="flex h-full flex-col px-3 py-5">
            <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Navigation
            </p>
            <NavLinks />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AdminConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRouteGuard>
      <AdminConsoleFrame>{children}</AdminConsoleFrame>
    </AdminRouteGuard>
  );
}
