"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import AppSidebar from "@/components/layout/AppSidebar";
import TopBar from "@/components/layout/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const safePathname = pathname ?? "";

  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [pathname]);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) return;

    const search = typeof window !== "undefined" ? window.location.search : "";
    const from = `${safePathname}${search ?? ""}`;
    router.replace(`/?auth=login&from=${encodeURIComponent(from)}`);
  }, [isAuthenticated, isLoading, router, safePathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex w-full overflow-hidden bg-background">
      {isMobile && (
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          >
            <AppSidebar collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <div
        className={cn(
          "hidden shrink-0 transition-[width] duration-200 md:block",
          collapsed ? "w-16" : "w-64",
        )}
        key="sidebar"
        aria-hidden
      >
        <div className="fixed left-0 top-0 z-30 h-svh overflow-hidden">
          <AppSidebar collapsed={collapsed} />
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <TopBar
            onMenuClick={isMobile ? () => setMobileNavOpen(true) : undefined}
            onSidebarToggle={() => setCollapsed((c) => !c)}
            sidebarCollapsed={collapsed}
          />
        </div>
        <main ref={mainRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
