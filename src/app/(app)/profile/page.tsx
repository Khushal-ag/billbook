"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import SettingsSkeleton from "@/components/skeletons/SettingsSkeleton";
import { BusinessProfileForm, ProfileCompletionCard } from "@/components/settings/SettingsSections";
import { useBusinessProfile, useUpdateBusinessProfile } from "@/hooks/use-business";
import { fileToDataUrl } from "@/lib/file-to-url";
import { profileSchema, type ProfileForm } from "@/components/settings/profileSchema";
import { Button } from "@/components/ui/button";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import type { UpdateBusinessProfile } from "@/types/auth";

function trimOrNull(value: string | null | undefined): string | null {
  const t = (value ?? "").trim();
  return t === "" ? null : t;
}

function trimTaxId(value: string | null | undefined): string | null {
  const t = (value ?? "").trim().toUpperCase();
  return t === "" ? null : t;
}

const getProfileFormValues = (business?: {
  name?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  businessType?: string | null;
  industryType?: string | null;
  registrationType?: string | null;
  street?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  pan?: string | null;
  financialYearStart?: number | null;
  extraDetails?: Array<{ key: string; value: string }> | null;
  taxType?: "GST" | "NON_GST" | null;
  logoUrl?: string | null;
  signatureUrl?: string | null;
}) => ({
  name: business?.name || "",
  country: business?.country || "India",
  email: business?.email || "",
  phone: business?.phone || "",
  businessType: business?.businessType || "",
  industryType: business?.industryType || "",
  registrationType: business?.registrationType || "",
  street: business?.street || "",
  area: business?.area || "",
  city: business?.city || "",
  state: business?.state || "",
  pincode: business?.pincode || "",
  gstin: business?.gstin || "",
  pan: business?.pan || "",
  financialYearStart: business?.financialYearStart ?? 4,
  extraDetails: business?.extraDetails?.length ? business.extraDetails : [],
  taxType: business?.taxType || "GST",
  logoUrl: business?.logoUrl ?? null,
  signatureUrl: business?.signatureUrl ?? null,
});

export default function Profile() {
  const { data: business, isPending, error } = useBusinessProfile();
  const updateProfile = useUpdateBusinessProfile();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: getProfileFormValues(),
  });

  const {
    formState: { isSubmitting, isDirty },
    reset,
  } = form;

  useEffect(() => {
    reset(getProfileFormValues(business));
  }, [business, reset]);

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
    if (!isDirty) {
      showErrorToast("No changes to save.");
      return;
    }
    try {
      const extraDetails = (data.extraDetails ?? [])
        .map((d) => ({
          key: (d.key ?? "").trim(),
          value: (d.value ?? "").trim(),
        }))
        .filter((d) => d.key !== "");
      // JSON.stringify drops `undefined` — the API must receive explicit null / [] or fields never update.
      const payload: UpdateBusinessProfile = {
        name: data.name.trim(),
        country: trimOrNull(data.country) ?? "India",
        phone: trimOrNull(data.phone),
        email: trimOrNull(data.email),
        businessType: trimOrNull(data.businessType),
        industryType: trimOrNull(data.industryType),
        registrationType: trimOrNull(data.registrationType),
        street: trimOrNull(data.street),
        area: trimOrNull(data.area),
        city: trimOrNull(data.city),
        state: trimOrNull(data.state),
        pincode: trimOrNull(data.pincode),
        gstin: trimTaxId(data.gstin),
        pan: trimTaxId(data.pan),
        financialYearStart: data.financialYearStart,
        extraDetails,
        taxType: data.taxType,
        logoUrl: data.logoUrl === "" || data.logoUrl == null ? null : data.logoUrl,
        signatureUrl:
          data.signatureUrl === "" || data.signatureUrl == null ? null : data.signatureUrl,
      };
      const updated = await updateProfile.mutateAsync(payload);
      reset(getProfileFormValues(updated));
      showSuccessToast("Business profile updated");
    } catch (err) {
      showErrorToast(err, "Failed to update");
    }
  };

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    return fileToDataUrl(file);
  };

  const handleSignatureUpload = async (file: File): Promise<string | null> => {
    return fileToDataUrl(file);
  };

  const handleCancel = () => {
    reset(getProfileFormValues(business));
  };

  if (isPending) {
    return <SettingsSkeleton variant="profile" />;
  }

  return (
    <div className="page-container animate-fade-in pb-10">
      <ErrorBanner error={error} fallbackMessage="Failed to load profile" />
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
              disabled={!isDirty || isSubmitting || updateProfile.isPending}
            >
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="w-full space-y-6">
        {business?.profileCompletion && (
          <ProfileCompletionCard profileCompletion={business.profileCompletion} />
        )}
        <BusinessProfileForm
          form={form}
          onSubmit={onSubmit}
          isDirty={isDirty}
          isSaving={updateProfile.isPending}
          onLogoUpload={handleLogoUpload}
          onSignatureUpload={handleSignatureUpload}
        />
      </div>
    </div>
  );
}
