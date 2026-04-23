import { Building2, ListOrdered, type LucideIcon } from "lucide-react";

/** Default admin console landing (logo / home). */
export const adminConsoleHomePath = "/admin/businesses" as const;

/** Single place to register admin console routes — add entries as new pages ship. */
export type AdminConsoleNavItem = {
  href: string;
  label: string;
  /** Shown in the sidebar under the label (desktop); keep short. */
  description?: string;
  icon: LucideIcon;
};

export const adminConsoleNavItems: AdminConsoleNavItem[] = [
  {
    href: "/admin/businesses",
    label: "Organizations",
    description: "Accounts & validity",
    icon: Building2,
  },
  {
    href: "/admin/transactions",
    label: "Transactions",
    description: "Cross-tenant ledger",
    icon: ListOrdered,
  },
];
