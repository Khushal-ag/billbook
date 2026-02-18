import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import SettingsSkeleton from "@/components/skeletons/SettingsSkeleton";
import PageHeader from "@/components/PageHeader";
import { useBusinessProfile, useUpdateBusinessProfile } from "@/hooks/use-business";
import { BusinessProfileForm, BusinessUsersCard } from "@/components/settings/SettingsSections";
import { profileSchema, type ProfileForm } from "@/components/settings/profileSchema";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";

export default function Settings() {
  const { data: business, isPending } = useBusinessProfile();
  const updateProfile = useUpdateBusinessProfile();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: business
      ? {
          name: business.name || "",
          email: business.email || "",
          phone: business.phone || "",
          gstin: business.gstin || "",
          pan: business.pan || "",
          address: business.address || "",
          city: business.city || "",
          state: business.state || "",
          postalCode: business.postalCode || "",
          taxType: business.taxType || "GST",
          financialYearStart: business.financialYearStart || 4,
        }
      : undefined,
  });
  const {
    formState: { isSubmitting, isDirty },
  } = form;

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile.mutateAsync({ ...data, name: data.name });
      showSuccessToast("Business profile updated");
    } catch (err) {
      showErrorToast(err, "Failed to update");
    }
  };

  if (isPending) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Business Settings"
        description="Manage your business profile and preferences"
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <BusinessProfileForm
          form={form}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          isDirty={isDirty}
          isSaving={updateProfile.isPending}
        />
        <BusinessUsersCard />
      </div>
    </div>
  );
}
