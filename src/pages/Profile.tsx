import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageHeader from "@/components/PageHeader";
import SettingsSkeleton from "@/components/skeletons/SettingsSkeleton";
import { BusinessProfileForm } from "@/components/settings/SettingsSections";
import {
  useBusinessProfile,
  useUpdateBusinessProfile,
  uploadBusinessProfileAssets,
} from "@/hooks/use-business";
import { profileSchema, type ProfileForm } from "@/components/settings/profileSchema";
import { Button } from "@/components/ui/button";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";

export default function Profile() {
  const { data: business, isPending } = useBusinessProfile();
  const updateProfile = useUpdateBusinessProfile();
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingSignatureFile, setPendingSignatureFile] = useState<File | null>(null);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: business
      ? {
          name: business.name || "",
          country: business.country || "India",
          email: business.email || "",
          phone: business.phone || "",
          businessType: business.businessType || "",
          industryType: business.industryType || "",
          registrationType: business.registrationType || "",
          street: business.street || "",
          area: business.area || "",
          city: business.city || "",
          state: business.state || "",
          pincode: business.pincode || "",
          gstin: business.gstin || "",
          pan: business.pan || "",
          financialYearStart: business.financialYearStart ?? 4,
          extraDetails: business.extraDetails?.length ? business.extraDetails : [],
          taxType: business.taxType || "GST",
          logoUrl: business.logoUrl ?? null,
          signatureUrl: business.signatureUrl ?? null,
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
      let logoUrl: string | null | undefined = data.logoUrl ?? undefined;
      let signatureUrl: string | null | undefined = data.signatureUrl ?? undefined;

      if (pendingLogoFile || pendingSignatureFile) {
        const uploaded = await uploadBusinessProfileAssets({
          logo: pendingLogoFile ?? undefined,
          signature: pendingSignatureFile ?? undefined,
        });
        if (uploaded.logoUrl !== undefined) logoUrl = uploaded.logoUrl;
        if (uploaded.signatureUrl !== undefined) signatureUrl = uploaded.signatureUrl;
        setPendingLogoFile(null);
        setPendingSignatureFile(null);
      }

      const extraDetails = data.extraDetails?.filter((d) => d.key.trim() !== "") ?? [];
      await updateProfile.mutateAsync({
        name: data.name,
        country: data.country || "India",
        phone: data.phone || undefined,
        email: data.email || undefined,
        businessType: data.businessType || undefined,
        industryType: data.industryType || undefined,
        registrationType: data.registrationType || undefined,
        street: data.street || undefined,
        area: data.area || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        pincode: data.pincode || undefined,
        gstin: data.gstin || undefined,
        pan: data.pan || undefined,
        financialYearStart: data.financialYearStart,
        extraDetails: extraDetails.length ? extraDetails : undefined,
        taxType: data.taxType,
        logoUrl: logoUrl === "" ? null : logoUrl,
        signatureUrl: signatureUrl === "" ? null : signatureUrl,
      });
      showSuccessToast("Business profile updated");
    } catch (err) {
      showErrorToast(err, "Failed to update");
    }
  };

  const handleCancel = () => {
    setPendingLogoFile(null);
    setPendingSignatureFile(null);
    if (business) {
      reset({
        name: business.name || "",
        country: business.country || "India",
        email: business.email || "",
        phone: business.phone || "",
        businessType: business.businessType || "",
        industryType: business.industryType || "",
        registrationType: business.registrationType || "",
        street: business.street || "",
        area: business.area || "",
        city: business.city || "",
        state: business.state || "",
        pincode: business.pincode || "",
        gstin: business.gstin || "",
        pan: business.pan || "",
        financialYearStart: business.financialYearStart ?? 4,
        extraDetails: business.extraDetails?.length ? business.extraDetails : [],
        taxType: business.taxType || "GST",
        logoUrl: business.logoUrl ?? null,
        signatureUrl: business.signatureUrl ?? null,
      });
    } else {
      reset();
    }
  };

  if (isPending) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="page-container animate-fade-in pb-10">
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

      <div className="w-full max-w-5xl space-y-6">
        <BusinessProfileForm
          form={form}
          onSubmit={onSubmit}
          isDirty={isDirty}
          isSaving={updateProfile.isPending}
          pendingLogoFile={pendingLogoFile}
          pendingSignatureFile={pendingSignatureFile}
          onLogoFileChange={setPendingLogoFile}
          onSignatureFileChange={setPendingSignatureFile}
        />
      </div>
    </div>
  );
}
