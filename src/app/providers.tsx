"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { UIModeProvider } from "@/contexts/UIModeContext";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchIntervalInBackground: false,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UIModeProvider>
          <TooltipProvider>
            <Toaster position="top-right" richColors closeButton />
            {children}
          </TooltipProvider>
        </UIModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
