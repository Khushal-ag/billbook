import { useState, useEffect, useRef, Suspense } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Scroll to top when route changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/?auth=login" replace state={{ from }} />;
  }

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      {/* Mobile sidebar */}
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

      {/* Desktop sidebar */}
      <div className="hidden h-full md:block" key="sidebar">
        <AppSidebar collapsed={collapsed} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuClick={isMobile ? () => setMobileNavOpen(true) : undefined}
          onSidebarToggle={() => setCollapsed((c) => !c)}
          sidebarCollapsed={collapsed}
        />
        <main ref={mainRef} className="scrollbar-gutter-stable min-w-0 flex-1 overflow-auto">
          <Suspense
            fallback={
              <div className="flex min-h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
