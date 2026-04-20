"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AccessDeniedPage({ homeHref = "/dashboard" }: { homeHref?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-lg font-semibold tracking-tight">Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        You don&apos;t have permission to open this page in this business. Ask your owner to adjust
        your role if you need access.
      </p>
      <Button asChild className="mt-6" variant="outline">
        <Link href={homeHref}>Back to dashboard</Link>
      </Button>
    </div>
  );
}
