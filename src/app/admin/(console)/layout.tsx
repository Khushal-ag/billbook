import type { ReactNode } from "react";

import { AdminConsoleLayout } from "@/components/admin/AdminConsoleLayout";

export default function AdminConsoleRouteLayout({ children }: { children: ReactNode }) {
  return <AdminConsoleLayout>{children}</AdminConsoleLayout>;
}
