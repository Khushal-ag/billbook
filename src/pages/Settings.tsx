import PageHeader from "@/components/PageHeader";
import { BusinessUsersCard } from "@/components/settings/SettingsSections";
import { InterfaceModeCard } from "@/components/settings/InterfaceModeCard";

export default function Settings() {
  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Settings" description="Manage preferences and team access" />

      <div className="mx-auto max-w-2xl space-y-6">
        <InterfaceModeCard />
        <BusinessUsersCard />
      </div>
    </div>
  );
}
