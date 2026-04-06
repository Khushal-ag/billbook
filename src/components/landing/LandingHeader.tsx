"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";

/**
 * Sticky header + allowance so we align with `scroll-mt-24` after `scrollIntoView`.
 * Active = last section (features → faq) whose top has crossed this line from the viewport top.
 */
const ACTIVATION_LINE_PX = 100;

/** Ignore scroll-based spy briefly after a nav click so smooth scroll does not flash the wrong tab. */
const NAV_CLICK_LOCK_MS = 900;

type HomeSection = "features" | "faq";

function readActiveHomeSection(): HomeSection | null {
  if (typeof document === "undefined") return null;
  const features = document.getElementById("features");
  const faq = document.getElementById("faq");
  if (!features || !faq) return null;
  let active: HomeSection | null = null;
  const line = ACTIVATION_LINE_PX;
  if (features.getBoundingClientRect().top <= line) active = "features";
  if (faq.getBoundingClientRect().top <= line) active = "faq";
  return active;
}

function scrollToSection(sectionId: HomeSection) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  window.history.replaceState(null, "", `#${sectionId}`);
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function navLinkClassName(active: boolean) {
  return cn(
    "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "text-foreground after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:rounded-full after:bg-primary"
      : "text-muted-foreground hover:text-foreground",
  );
}

function HomeSectionLink({
  sectionId,
  active,
  onSectionNavClick,
  children,
}: {
  sectionId: HomeSection;
  active: boolean;
  onSectionNavClick: (id: HomeSection) => void;
  children: ReactNode;
}) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onSectionNavClick(sectionId);
    scrollToSection(sectionId);
  };

  return (
    <a href={`#${sectionId}`} onClick={handleClick} className={navLinkClassName(active)}>
      {children}
    </a>
  );
}

function AwaySectionLink({
  sectionId,
  active,
  children,
}: {
  sectionId: HomeSection;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link href={`/#${sectionId}`} className={navLinkClassName(active)}>
      {children}
    </Link>
  );
}

export function LandingHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [homeSection, setHomeSection] = useState<HomeSection | null>(null);
  const navLockUntilRef = useRef<number>(0);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncHomeSection = useCallback(() => {
    if (!isHome) return;
    if (typeof performance !== "undefined" && performance.now() < navLockUntilRef.current) {
      return;
    }
    setHomeSection(readActiveHomeSection());
  }, [isHome]);

  const onSectionNavClick = useCallback((id: HomeSection) => {
    navLockUntilRef.current =
      typeof performance !== "undefined" ? performance.now() + NAV_CLICK_LOCK_MS : 0;
    setHomeSection(id);
    if (lockTimerRef.current != null) {
      clearTimeout(lockTimerRef.current);
    }
    lockTimerRef.current = setTimeout(() => {
      lockTimerRef.current = null;
      navLockUntilRef.current = 0;
      setHomeSection(readActiveHomeSection());
    }, NAV_CLICK_LOCK_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (lockTimerRef.current != null) clearTimeout(lockTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isHome) {
      setHomeSection(null);
      return;
    }
    syncHomeSection();
    window.addEventListener("scroll", syncHomeSection, { passive: true });
    window.addEventListener("resize", syncHomeSection);
    return () => {
      window.removeEventListener("scroll", syncHomeSection);
      window.removeEventListener("resize", syncHomeSection);
    };
  }, [isHome, syncHomeSection]);

  const contactActive = pathname === "/contact";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-8">
          <Link
            href="/"
            className="shrink-0 transition-opacity hover:opacity-90"
            aria-label="BillBook home"
          >
            <Logo className="h-9 w-9" />
          </Link>

          <nav
            className="flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-start md:flex-initial [&::-webkit-scrollbar]:hidden"
            aria-label="Marketing"
          >
            {isHome ? (
              <>
                <HomeSectionLink
                  sectionId="features"
                  active={homeSection === "features"}
                  onSectionNavClick={onSectionNavClick}
                >
                  Features
                </HomeSectionLink>
                <HomeSectionLink
                  sectionId="faq"
                  active={homeSection === "faq"}
                  onSectionNavClick={onSectionNavClick}
                >
                  FAQ
                </HomeSectionLink>
              </>
            ) : (
              <>
                <AwaySectionLink sectionId="features" active={false}>
                  Features
                </AwaySectionLink>
                <AwaySectionLink sectionId="faq" active={false}>
                  FAQ
                </AwaySectionLink>
              </>
            )}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/?auth=login">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={contactActive ? "secondary" : "outline"}
            className={cn(
              "hidden sm:inline-flex",
              contactActive &&
                "border-primary/30 bg-primary/10 text-foreground hover:bg-primary/15",
            )}
          >
            <Link href="/contact">Contact</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/?auth=signup">Start free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
