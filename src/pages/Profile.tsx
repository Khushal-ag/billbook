import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageHeader from "@/components/PageHeader";
import SettingsSkeleton from "@/components/skeletons/SettingsSkeleton";
import { BusinessProfileForm } from "@/components/settings/SettingsSections";
import { useBusinessProfile, useUpdateBusinessProfile } from "@/hooks/use-business";
import { profileSchema, type ProfileForm } from "@/components/settings/profileSchema";
import { Button } from "@/components/ui/button";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";

export default function Profile() {
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
    reset,
  } = form;

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

  const handleCancel = () => {
    if (business) {
      reset({
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
      });
    } else {
      reset();
    }
  };

  if (isPending) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="My Profile"
        description="Manage your business settings and profile details"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              form="profile-form"
              disabled={isSubmitting || updateProfile.isPending}
            >
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <BusinessProfileForm
          form={form}
          onSubmit={onSubmit}
          isDirty={isDirty}
          isSaving={updateProfile.isPending}
        />
      </div>
    </div>
  );
}
