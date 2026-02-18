import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UIModeProvider } from "@/contexts/UIModeContext";
import AppLayout from "@/components/layout/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy-loaded pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Invoices = lazy(() => import("./pages/Invoices"));
const InvoiceDetail = lazy(() => import("./pages/InvoiceDetail"));
const Products = lazy(() => import("./pages/Products"));
const Parties = lazy(() => import("./pages/Parties"));
const PartyLedger = lazy(() => import("./pages/PartyLedger"));
const CreditNotes = lazy(() => import("./pages/CreditNotes"));
const Reports = lazy(() => import("./pages/Reports"));
const Tax = lazy(() => import("./pages/Tax"));
const Subscription = lazy(() => import("./pages/Subscription"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes for better performance
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // Refetch when connection is restored
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const PageFallback = () => null;

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UIModeProvider>
          <TooltipProvider>
            <Toaster position="top-right" richColors closeButton />
            <BrowserRouter>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Navigate to="/?auth=login" replace />} />
                  <Route path="/signup" element={<Navigate to="/?auth=signup" replace />} />
                  <Route
                    path="/forgot-password"
                    element={<Navigate to="/?auth=forgot" replace />}
                  />

                  {/* Authenticated routes */}
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/invoices/:id" element={<InvoiceDetail />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/parties" element={<Parties />} />
                    <Route path="/parties/:partyId/ledger" element={<PartyLedger />} />
                    <Route path="/credit-notes" element={<CreditNotes />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/tax" element={<Tax />} />
                    <Route path="/subscription" element={<Subscription />} />
                    <Route path="/audit-logs" element={<AuditLogs />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </UIModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
