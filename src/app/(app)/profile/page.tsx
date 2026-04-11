"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import SettingsSkeleton from "@/components/skeletons/SettingsSkeleton";
import { BusinessProfileForm, ProfileCompletionCard } from "@/components/settings/SettingsSections";
import {
  useBusinessProfile,
  useUpdateBusinessProfile,
  useBusinessTypeOptions,
  useIndustryTypeOptions,
  useCreateBusinessTypeOption,
  useCreateIndustryTypeOption,
} from "@/hooks/use-business";
import { fileToDataUrl } from "@/lib/file-to-url";
import { profileSchema, type ProfileForm } from "@/components/settings/profileSchema";
import { Button } from "@/components/ui/button";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import { getProfileFormValues } from "@/lib/profile-form-values";
import type {
  BusinessProfile,
  UpdateBusinessProfile,
  BusinessClassificationOption,
} from "@/types/auth";
import { usePermissions } from "@/hooks/use-permissions";

function trimOrNull(value: string | null | undefined): string | null {
  const t = (value ?? "").trim();
  return t === "" ? null : t;
}

function trimTaxId(value: string | null | undefined): string | null {
  const t = (value ?? "").trim().toUpperCase();
  return t === "" ? null : t;
}

function getComparableProfileSnapshot(values: ProfileForm): string {
  return JSON.stringify({
    ...values,
    name: (values.name ?? "").trim(),
    country: values.country ?? "",
    email: (values.email ?? "").trim(),
    phone: (values.phone ?? "").trim(),
    businessType: values.businessType ?? "",
    industryType: values.industryType ?? "",
    registrationType: values.registrationType ?? "",
    street: (values.street ?? "").trim(),
    area: (values.area ?? "").trim(),
    city: (values.city ?? "").trim(),
    state: (values.state ?? "").trim(),
    pincode: (values.pincode ?? "").trim(),
    accountHolderName: (values.accountHolderName ?? "").trim(),
    bankAccountNumber: (values.bankAccountNumber ?? "").trim(),
    confirmAccountNumber: (values.confirmAccountNumber ?? "").trim(),
    bankName: (values.bankName ?? "").trim(),
    branchName: (values.branchName ?? "").trim(),
    bankCity: (values.bankCity ?? "").trim(),
    bankState: (values.bankState ?? "").trim(),
    ifscCode: (values.ifscCode ?? "").trim().toUpperCase(),
    transferAmount: (values.transferAmount ?? "").trim(),
    transferCurrency: (values.transferCurrency ?? "").trim(),
    transferType: values.transferType ?? "",
    gstin: (values.gstin ?? "").trim(),
    pan: (values.pan ?? "").trim(),
    financialYearStart: values.financialYearStart ?? 4,
    taxType: values.taxType ?? "GST",
    logoUrl: values.logoUrl ?? null,
    signatureUrl: values.signatureUrl ?? null,
    extraDetails: (values.extraDetails ?? [])
      .map((detail) => ({
        key: (detail?.key ?? "").trim(),
        value: (detail?.value ?? "").trim(),
      }))
      .filter((detail) => detail.key !== "" || detail.value !== ""),
  });
}

function withFallbackOption(
  options: BusinessClassificationOption[] | undefined,
  currentValue: string | null | undefined,
): BusinessClassificationOption[] {
  const normalized = (currentValue ?? "").trim();
  const base = options ?? [];
  if (!normalized) return base;

  const exists = base.some((option) => option.name.toLowerCase() === normalized.toLowerCase());
  if (exists) return base;

  return [{ id: -1, name: normalized, isPredefined: false }, ...base];
}

function ProfileEditor({
  business,
  businessTypeOptions,
  industryTypeOptions,
  canManageTypeOptions,
}: {
  business: BusinessProfile;
  businessTypeOptions: BusinessClassificationOption[];
  industryTypeOptions: BusinessClassificationOption[];
  canManageTypeOptions: boolean;
}) {
  const updateProfile = useUpdateBusinessProfile();
  const createBusinessType = useCreateBusinessTypeOption();
  const createIndustryType = useCreateIndustryTypeOption();

  const profileValues = useMemo(() => getProfileFormValues(business), [business]);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileValues,
    values: profileValues,
    resetOptions: { keepDirtyValues: true },
  });

  const {
    formState: { isSubmitting, isDirty },
    reset,
    watch,
  } = form;

  const formValues = watch();
  const hasUserChanges =
    getComparableProfileSnapshot(formValues) !== getComparableProfileSnapshot(profileValues);
  const checklistBusiness = hasUserChanges ? { ...business, ...formValues } : business;

  useEffect(() => {
    reset(profileValues);
  }, [profileValues, reset]);

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
    if (!hasUserChanges) {
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
        accountHolderName: trimOrNull(data.accountHolderName),
        bankAccountNumber: trimOrNull(data.bankAccountNumber),
        confirmAccountNumber: trimOrNull(data.confirmAccountNumber),
        bankName: trimOrNull(data.bankName),
        branchName: trimOrNull(data.branchName),
        bankCity: trimOrNull(data.bankCity),
        bankState: trimOrNull(data.bankState),
        ifscCode: trimTaxId(data.ifscCode),
        transferAmount: trimOrNull(data.transferAmount),
        transferCurrency: trimOrNull(data.transferCurrency),
        transferType: data.transferType ? data.transferType : null,
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
    reset(profileValues);
  };

  const handleCreateBusinessType = async (name: string) => {
    await createBusinessType.mutateAsync(name);
    showSuccessToast("Business type added");
  };

  const handleCreateIndustryType = async (name: string) => {
    await createIndustryType.mutateAsync(name);
    showSuccessToast("Industry type added");
  };

  return (
    <>
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
              disabled={!hasUserChanges || isSubmitting || updateProfile.isPending}
            >
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="w-full space-y-6">
        {business?.profileCompletion && (
          <ProfileCompletionCard
            profileCompletion={business.profileCompletion}
            business={checklistBusiness}
          />
        )}
        <BusinessProfileForm
          form={form}
          onSubmit={onSubmit}
          isDirty={isDirty}
          isSaving={updateProfile.isPending}
          businessTypeOptions={businessTypeOptions}
          industryTypeOptions={industryTypeOptions}
          canManageTypeOptions={canManageTypeOptions}
          onCreateBusinessType={canManageTypeOptions ? handleCreateBusinessType : undefined}
          onCreateIndustryType={canManageTypeOptions ? handleCreateIndustryType : undefined}
          onLogoUpload={handleLogoUpload}
          onSignatureUpload={handleSignatureUpload}
        />
      </div>
    </>
  );
}

export default function Profile() {
  const { isOwner } = usePermissions();
  const {
    data: business,
    isPending: isBusinessPending,
    error: businessError,
  } = useBusinessProfile();
  const {
    data: businessTypes,
    isPending: isBusinessTypesPending,
    error: businessTypesError,
  } = useBusinessTypeOptions();
  const {
    data: industryTypes,
    isPending: isIndustryTypesPending,
    error: industryTypesError,
  } = useIndustryTypeOptions();

  const businessTypeOptions = withFallbackOption(businessTypes, business?.businessType);
  const industryTypeOptions = withFallbackOption(industryTypes, business?.industryType);

  const isPending = isBusinessPending || isBusinessTypesPending || isIndustryTypesPending;
  const error = businessError ?? businessTypesError ?? industryTypesError;

  if (isPending) {
    return <SettingsSkeleton variant="profile" />;
  }

  return (
    <div className="page-container animate-fade-in pb-10">
      <ErrorBanner error={error} fallbackMessage="Failed to load profile" />
      {business ? (
        <ProfileEditor
          business={business}
          businessTypeOptions={businessTypeOptions}
          industryTypeOptions={industryTypeOptions}
          canManageTypeOptions={isOwner}
        />
      ) : (
        <PageHeader
          title="My Profile"
          description="Manage your business settings and profile details"
        />
      )}
    </div>
  );
}
