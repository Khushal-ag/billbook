import { useRef, useState, useEffect } from "react";
import { Controller, useFieldArray, type UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Pencil, Plus, Trash2, X } from "lucide-react";
import type { ProfileForm } from "@/components/settings/profileSchema";
import { MONTHS, REGISTRATION_TYPES, COUNTRIES } from "@/constants";
import { usePincodeAutofill } from "@/hooks/use-pincode-autofill";
import { showErrorToast } from "@/lib/toast-helpers";
import { countryCodeToFlagEmoji } from "@/lib/country-flags";
import { lookupIfscCode } from "@/lib/ifsc";
import type { BusinessClassificationOption } from "@/types/auth";
import { ApiClientError } from "@/api/error";

const LOGO_MAX_SIZE_MB = 5;
const SIGNATURE_MAX_SIZE_MB = 2;

function toCapitalizedLabel(value: string): string {
  const s = value.trim();
  if (!s) return "";
  return s.replace(/(^|[\s\-_/])([a-z])/g, (_, p1: string, p2: string) => {
    return `${p1}${p2.toUpperCase()}`;
  });
}

interface BusinessProfileFormProps {
  form: UseFormReturn<ProfileForm>;
  onSubmit: (data: ProfileForm) => void | Promise<void>;
  isDirty: boolean;
  isSaving: boolean;
  businessTypeOptions: BusinessClassificationOption[];
  industryTypeOptions: BusinessClassificationOption[];
  canManageTypeOptions: boolean;
  onCreateBusinessType?: (name: string) => Promise<void>;
  onCreateIndustryType?: (name: string) => Promise<void>;
  /** Upload logo file; returns URL to store. Backend receives only this link on profile save. */
  onLogoUpload?: (file: File) => Promise<string | null>;
  /** Upload signature file; returns URL to store. Backend receives only this link on profile save. */
  onSignatureUpload?: (file: File) => Promise<string | null>;
}

interface CreatableTypeInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: BusinessClassificationOption[];
  placeholder: string;
  emptyMessage: string;
  canManageTypeOptions: boolean;
  createLabel: string;
  isCreating: boolean;
  onCreate: (name: string) => Promise<void>;
}

function CreatableTypeInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  emptyMessage,
  canManageTypeOptions,
  createLabel,
  isCreating,
  onCreate,
}: CreatableTypeInputProps) {
  const [open, setOpen] = useState(false);
  const normalizedInput = (value ?? "").trim().toLowerCase();
  const filteredOptions = options.filter((option) => {
    if (!normalizedInput) return true;
    return option.name.toLowerCase().includes(normalizedInput);
  });
  const hasExactMatch = options.some(
    (option) => option.name.trim().toLowerCase() === normalizedInput,
  );
  const shouldShowCreate = Boolean(normalizedInput) && !hasExactMatch;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor asChild>
        <Input
          id={id}
          value={value ?? ""}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-expanded={open}
          aria-controls={`${id}-options`}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList id={`${id}-options`} className="max-h-64">
            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={`${id}-${option.id}-${option.name}`}
                  value={option.name}
                  onSelect={() => {
                    onChange(toCapitalizedLabel(option.name));
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {toCapitalizedLabel(option.name)}
                </CommandItem>
              ))}

              {shouldShowCreate && (
                <CommandItem
                  value={`${id}-create-${normalizedInput}`}
                  disabled={isCreating}
                  onSelect={() => {
                    if (!canManageTypeOptions) {
                      setOpen(false);
                      return;
                    }
                    void onCreate((value ?? "").trim()).then(() => {
                      setOpen(false);
                    });
                  }}
                  className="cursor-pointer"
                >
                  {canManageTypeOptions
                    ? `${isCreating ? "Adding…" : createLabel} "${toCapitalizedLabel((value ?? "").trim())}"`
                    : `Use "${toCapitalizedLabel((value ?? "").trim())}"`}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function BusinessProfileForm({
  form,
  onSubmit,
  isDirty,
  isSaving,
  businessTypeOptions,
  industryTypeOptions,
  canManageTypeOptions,
  onCreateBusinessType,
  onCreateIndustryType,
  onLogoUpload,
  onSignatureUpload,
}: BusinessProfileFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = form;

  const {
    fields: extraDetailFields,
    append: appendExtraDetail,
    remove: removeExtraDetail,
  } = useFieldArray({
    control,
    name: "extraDetails",
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState("IN");
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingSignatureFile, setPendingSignatureFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isCreatingBusinessType, setIsCreatingBusinessType] = useState(false);
  const [isCreatingIndustryType, setIsCreatingIndustryType] = useState(false);
  const [isEditingBankDetails, setIsEditingBankDetails] = useState(false);
  const [ifscLookupError, setIfscLookupError] = useState<string | null>(null);
  const [ifscSupportedModes, setIfscSupportedModes] = useState<string[]>([]);
  const ifscLookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ifscLookupRequestIdRef = useRef(0);
  const previousIfscCodeRef = useRef<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const logoUrl = watch("logoUrl");
  const signatureUrl = watch("signatureUrl");
  const pincode = watch("pincode");
  const countryName = watch("country");
  const city = watch("city");
  const state = watch("state");
  const ifscCode = watch("ifscCode");
  const bankAccountNumberValue = watch("bankAccountNumber");
  const confirmAccountNumberValue = watch("confirmAccountNumber");
  const normalizedIfscInput = (ifscCode ?? "").trim().toUpperCase();
  const showIfscDerivedFields = normalizedIfscInput.length > 0;

  const pincodeDigits = (pincode ?? "").toString().replace(/\D/g, "");
  const lockCityState = pincodeDigits.length === 6 && Boolean(city || state);
  const selectedPhoneCountry = COUNTRIES.find((c) => c.code === phoneCountryCode) ??
    COUNTRIES[0] ?? { code: "IN", dialCode: "+91", label: "India" };

  const normalizedCountryName = (countryName ?? "").toString().trim().toLowerCase();
  const countryFromName =
    COUNTRIES.find((c) => c.label.toLowerCase() === normalizedCountryName)?.code ?? null;
  const pincodeCountryCode =
    countryFromName ??
    (normalizedCountryName === "india" || !normalizedCountryName
      ? "IN"
      : selectedPhoneCountry.code);

  const displayLogoUrl = pendingLogoFile ? logoPreviewUrl : logoUrl || null;
  const displaySignatureUrl = pendingSignatureFile ? signaturePreviewUrl : signatureUrl || null;

  useEffect(() => {
    const label = (countryName ?? "").trim();
    if (!label) return;
    const match = COUNTRIES.find((c) => c.label.toLowerCase() === label.toLowerCase());
    if (match) setPhoneCountryCode(match.code);
  }, [countryName]);

  useEffect(() => {
    if (!pendingLogoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingLogoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingLogoFile]);

  useEffect(() => {
    if (!pendingSignatureFile) {
      setSignaturePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingSignatureFile);
    setSignaturePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingSignatureFile]);

  useEffect(() => {
    if (isEditingBankDetails) return;
    const account = (bankAccountNumberValue ?? "").trim();
    const confirm = (confirmAccountNumberValue ?? "").trim();
    if (account !== "" && confirm === "") {
      setValue("confirmAccountNumber", account, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [isEditingBankDetails, bankAccountNumberValue, confirmAccountNumberValue, setValue]);

  const handlePhoneCountryChange = (value: string) => {
    setPhoneCountryCode(value);
  };

  const handleLogoClick = () => logoInputRef.current?.click();
  const handleSignatureClick = () => signatureInputRef.current?.click();

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    if (file.size > LOGO_MAX_SIZE_MB * 1024 * 1024) {
      showErrorToast(`Logo must be under ${LOGO_MAX_SIZE_MB} MB`);
      return;
    }
    if (!onLogoUpload) return;
    setPendingLogoFile(file);
    setIsUploadingLogo(true);
    try {
      const url = await onLogoUpload(file);
      if (url) setValue("logoUrl", url, { shouldDirty: true });
      setPendingLogoFile(null);
    } catch {
      showErrorToast("Logo upload failed");
      setPendingLogoFile(null);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    if (file.size > SIGNATURE_MAX_SIZE_MB * 1024 * 1024) {
      showErrorToast(`Signature image must be under ${SIGNATURE_MAX_SIZE_MB} MB`);
      return;
    }
    if (!onSignatureUpload) return;
    setPendingSignatureFile(file);
    setIsUploadingSignature(true);
    try {
      const url = await onSignatureUpload(file);
      if (url) setValue("signatureUrl", url, { shouldDirty: true });
      setPendingSignatureFile(null);
    } catch {
      showErrorToast("Signature upload failed");
      setPendingSignatureFile(null);
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleRemoveLogo = () => {
    setPendingLogoFile(null);
    setValue("logoUrl", null, { shouldDirty: true });
  };

  const handleRemoveSignature = () => {
    setPendingSignatureFile(null);
    setValue("signatureUrl", null, { shouldDirty: true });
  };

  useEffect(() => {
    if (ifscLookupTimerRef.current) {
      clearTimeout(ifscLookupTimerRef.current);
      ifscLookupTimerRef.current = null;
    }

    const normalizedIfscCode = (ifscCode ?? "").trim().toUpperCase();
    const hasValidIfscFormat = /^[A-Z0-9]{11}$/.test(normalizedIfscCode);
    const previousIfscCode = previousIfscCodeRef.current;
    const ifscChanged = previousIfscCode !== null && previousIfscCode !== normalizedIfscCode;
    previousIfscCodeRef.current = normalizedIfscCode;

    if (!normalizedIfscCode || !hasValidIfscFormat || ifscChanged) {
      setValue("bankName", "", { shouldDirty: false, shouldValidate: true });
      setValue("branchName", "", { shouldDirty: false, shouldValidate: true });
      setValue("bankCity", "", { shouldDirty: false, shouldValidate: true });
      setValue("bankState", "", { shouldDirty: false, shouldValidate: true });
      setIfscSupportedModes([]);
    }

    setIfscLookupError(null);

    const requestId = ++ifscLookupRequestIdRef.current;
    ifscLookupTimerRef.current = setTimeout(() => {
      void (async () => {
        if (!normalizedIfscCode) {
          setIfscLookupError(null);
          return;
        }

        if (normalizedIfscCode.length !== 11 || !/^[A-Z0-9]{11}$/.test(normalizedIfscCode)) {
          setIfscLookupError("IFSC code must be exactly 11 characters");
          return;
        }

        try {
          const result = await lookupIfscCode(normalizedIfscCode);
          if (ifscLookupRequestIdRef.current !== requestId) return;
          setIfscLookupError(null);
          setValue("bankName", result.BANK, { shouldDirty: false, shouldValidate: true });
          setValue("branchName", result.BRANCH, { shouldDirty: false, shouldValidate: true });
          setIfscSupportedModes(
            [
              result.NEFT ? "NEFT" : null,
              result.RTGS ? "RTGS" : null,
              result.IMPS ? "IMPS" : null,
              result.UPI ? "UPI" : null,
            ].filter((mode): mode is string => Boolean(mode)),
          );
          setValue("bankCity", result.CITY ?? "", { shouldDirty: false, shouldValidate: true });
          setValue("bankState", result.STATE ?? "", {
            shouldDirty: false,
            shouldValidate: true,
          });
        } catch (error) {
          if (ifscLookupRequestIdRef.current !== requestId) return;
          const message = error instanceof Error ? error.message : "Invalid IFSC code";
          setValue("bankName", "", { shouldDirty: false, shouldValidate: true });
          setValue("branchName", "", { shouldDirty: false, shouldValidate: true });
          setValue("bankCity", "", { shouldDirty: false, shouldValidate: true });
          setValue("bankState", "", { shouldDirty: false, shouldValidate: true });
          setIfscSupportedModes([]);
          setIfscLookupError(
            message.toLowerCase().includes("invalid ifsc") ? "Invalid IFSC code" : message,
          );
        }
      })();
    }, 1500);

    return () => {
      if (ifscLookupTimerRef.current) {
        clearTimeout(ifscLookupTimerRef.current);
        ifscLookupTimerRef.current = null;
      }
    };
  }, [ifscCode, setValue]);

  usePincodeAutofill(pincode, pincodeCountryCode, getValues, setValue);

  const handleCreateOption = async (
    kind: "business" | "industry",
    createFn: ((name: string) => Promise<void>) | undefined,
    formField: "businessType" | "industryType",
    rawName: string,
  ) => {
    if (!canManageTypeOptions || !createFn) return;

    const name = (rawName ?? "").trim();
    if (!name) return;

    if (kind === "business") {
      setIsCreatingBusinessType(true);
    } else {
      setIsCreatingIndustryType(true);
    }

    try {
      await createFn(name);
      setValue(formField, name, { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        showErrorToast(`${kind === "business" ? "Business" : "Industry"} type already exists.`);
        return;
      }
      showErrorToast(error, `Failed to create ${kind} type`);
    } finally {
      if (kind === "business") {
        setIsCreatingBusinessType(false);
      } else {
        setIsCreatingIndustryType(false);
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Business Information</CardTitle>
        <CardDescription>Update your business details and compliance settings</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-border/60 p-4 text-center">
                {displayLogoUrl ? (
                  <div className="relative mx-auto inline-block">
                    <img
                      src={displayLogoUrl}
                      alt="Business logo"
                      className="h-24 w-24 rounded-lg bg-muted object-contain"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-0 right-0 h-6 w-6 rounded-full shadow-sm"
                      onClick={handleLogoClick}
                      disabled={isUploadingLogo}
                      aria-label="Edit logo"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium">Upload Logo</p>
                    <p className="text-xs text-muted-foreground">
                      PNG/JPG, max {LOGO_MAX_SIZE_MB} MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleLogoClick}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? "Uploading…" : "Choose file"}
                    </Button>
                  </>
                )}
                {displayLogoUrl && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <button
                      type="button"
                      className="underline hover:no-underline"
                      onClick={handleRemoveLogo}
                    >
                      Remove logo
                    </button>
                  </p>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
                Your logo appears on invoices, reports, and client-facing documents.
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Registration and Signature</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="registrationType">Business Registration Type</Label>
                    <Controller
                      name="registrationType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value?.trim() ? field.value : undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="registrationType">
                            <SelectValue placeholder="Select registration" />
                          </SelectTrigger>
                          <SelectContent>
                            {REGISTRATION_TYPES.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="rounded-lg border-2 border-dashed border-border/60 px-4 py-6 text-center">
                    <p className="text-xs text-muted-foreground">Add signature for invoices</p>
                    {displaySignatureUrl ? (
                      <div className="relative mx-auto mt-3 inline-block">
                        <img
                          src={displaySignatureUrl}
                          alt="Signature"
                          className="max-h-16 w-auto max-w-[200px] object-contain"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                          onClick={handleRemoveSignature}
                          aria-label="Remove signature"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : null}
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSignatureChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleSignatureClick}
                      disabled={isUploadingSignature}
                    >
                      {isUploadingSignature
                        ? "Uploading…"
                        : displaySignatureUrl
                          ? "Change signature"
                          : "Add Signature"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Additional business details</CardTitle>
                  <CardDescription>
                    MSME, TAN, website, or any extra key-value identifiers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {extraDetailFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          placeholder="Key (e.g. TAN)"
                          {...register(`extraDetails.${index}.key`)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Value"
                          {...register(`extraDetails.${index}.value`)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExtraDetail(index)}
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => appendExtraDetail({ key: "", value: "" })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Business & contact</CardTitle>
                  <CardDescription>
                    Key details used across invoices and reports. Classification is optional.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" required>
                        Business Name
                      </Label>
                      <Input
                        id="name"
                        {...register("name")}
                        aria-required="true"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                      />
                      {errors.name && (
                        <FieldError id="name-error">{errors.name.message}</FieldError>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Controller
                        name="country"
                        control={control}
                        render={({ field }) => {
                          const v = (field.value ?? "").trim();
                          const selected =
                            COUNTRIES.find((c) => c.label.toLowerCase() === v.toLowerCase()) ??
                            selectedPhoneCountry;
                          return (
                            <Select
                              value={selected.code}
                              onValueChange={(code) => {
                                const country = COUNTRIES.find((c) => c.code === code);
                                field.onChange(country?.label ?? "");
                                setPhoneCountryCode(code);
                              }}
                            >
                              <SelectTrigger id="country">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {COUNTRIES.map((item) => (
                                  <SelectItem key={item.code} value={item.code}>
                                    <span className="flex items-center gap-2">
                                      <span aria-hidden className="text-base leading-none">
                                        {countryCodeToFlagEmoji(item.code)}
                                      </span>
                                      <span className="truncate">{item.label}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="email">Company Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="billing@acme.com"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                      />
                      {errors.email && (
                        <p id="email-error" className="text-xs text-destructive" role="alert">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="businessType">
                        Business Type{" "}
                        <span className="text-xs text-muted-foreground">(optional)</span>
                      </Label>
                      <Controller
                        name="businessType"
                        control={control}
                        render={({ field }) => (
                          <CreatableTypeInput
                            id="businessType"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            options={businessTypeOptions}
                            placeholder="e.g. Retail"
                            emptyMessage="No matching business types"
                            canManageTypeOptions={canManageTypeOptions}
                            createLabel="Add business type"
                            isCreating={isCreatingBusinessType}
                            onCreate={async (name) => {
                              await handleCreateOption(
                                "business",
                                onCreateBusinessType,
                                "businessType",
                                name,
                              );
                            }}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industryType">
                        Industry Type{" "}
                        <span className="text-xs text-muted-foreground">(optional)</span>
                      </Label>
                      <Controller
                        name="industryType"
                        control={control}
                        render={({ field }) => (
                          <CreatableTypeInput
                            id="industryType"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            options={industryTypeOptions}
                            placeholder="e.g. IT Services"
                            emptyMessage="No matching industry types"
                            canManageTypeOptions={canManageTypeOptions}
                            createLabel="Add industry type"
                            isCreating={isCreatingIndustryType}
                            onCreate={async (name) => {
                              await handleCreateOption(
                                "industry",
                                onCreateIndustryType,
                                "industryType",
                                name,
                              );
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <div className="grid grid-cols-[120px_1fr] gap-2 sm:grid-cols-[140px_1fr]">
                      <Select value={phoneCountryCode} onValueChange={handlePhoneCountryChange}>
                        <SelectTrigger
                          id="phoneCountry"
                          aria-label="Phone country code"
                          className="h-10"
                        >
                          <span className="flex items-center gap-1">
                            <span aria-hidden className="text-base leading-none">
                              {countryCodeToFlagEmoji(selectedPhoneCountry.code)}
                            </span>{" "}
                            <span className="pl-1 tabular-nums">
                              {selectedPhoneCountry.dialCode}
                            </span>
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((item) => (
                            <SelectItem key={item.code} value={item.code}>
                              <span className="flex items-center gap-3">
                                <span aria-hidden className="text-base leading-none">
                                  {countryCodeToFlagEmoji(item.code)}
                                </span>
                                <span className="truncate">{item.label}</span>
                                <span className="ml-auto tabular-nums">{item.dialCode}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        placeholder="9876543210"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        aria-invalid={!!errors.phone}
                        {...register("phone", {
                          onChange: (e) => {
                            e.target.value = String(e.target.value ?? "")
                              .replace(/\D/g, "")
                              .slice(0, 10);
                          },
                        })}
                      />
                    </div>
                    {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Address</CardTitle>
                  <CardDescription>Used for compliance and document headers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Address line 1</Label>
                    <Textarea
                      id="street"
                      placeholder="123 Main Street"
                      className="min-h-[88px]"
                      aria-invalid={!!errors.street}
                      aria-describedby={errors.street ? "street-error" : undefined}
                      {...register("street")}
                      maxLength={500}
                    />
                    {errors.street && (
                      <FieldError id="street-error">{errors.street.message}</FieldError>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        placeholder="560034"
                        {...register("pincode")}
                        maxLength={10}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter pincode to auto-fill city, state, and area
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="area">Area / Locality</Label>
                      <Input id="area" {...register("area")} placeholder="Koramangala" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        {...register("city")}
                        placeholder="Bangalore"
                        disabled={lockCityState}
                      />
                      {lockCityState && (
                        <p className="text-xs text-muted-foreground">Auto-filled from pincode</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input
                        id="state"
                        {...register("state")}
                        placeholder="Karnataka"
                        disabled={lockCityState}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">Bank details</CardTitle>
                      <CardDescription>
                        Add beneficiary, bank, and transfer preferences for payouts
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingBankDetails((prev) => !prev)}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      {isEditingBankDetails ? "Done" : "Edit"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="accountHolderName">Account Holder Name</Label>
                      <Input
                        id="accountHolderName"
                        placeholder="Name as per bank account"
                        readOnly={!isEditingBankDetails}
                        {...register("accountHolderName")}
                        aria-invalid={!!errors.accountHolderName}
                        aria-describedby={
                          errors.accountHolderName ? "account-holder-name-error" : undefined
                        }
                      />
                      {errors.accountHolderName && (
                        <FieldError id="account-holder-name-error">
                          {errors.accountHolderName.message}
                        </FieldError>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                      <Input
                        id="bankAccountNumber"
                        inputMode="numeric"
                        placeholder="Enter account number"
                        readOnly={!isEditingBankDetails}
                        {...register("bankAccountNumber")}
                        aria-invalid={!!errors.bankAccountNumber}
                        aria-describedby={
                          errors.bankAccountNumber ? "bank-account-number-error" : undefined
                        }
                      />
                      {errors.bankAccountNumber && (
                        <FieldError id="bank-account-number-error">
                          {errors.bankAccountNumber.message}
                        </FieldError>
                      )}
                    </div>
                    {isEditingBankDetails && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmAccountNumber">Confirm Account Number</Label>
                        <Input
                          id="confirmAccountNumber"
                          inputMode="numeric"
                          placeholder="Re-enter account number"
                          {...register("confirmAccountNumber")}
                          aria-invalid={!!errors.confirmAccountNumber}
                          aria-describedby={
                            errors.confirmAccountNumber ? "confirm-account-number-error" : undefined
                          }
                        />
                        {errors.confirmAccountNumber && (
                          <FieldError id="confirm-account-number-error">
                            {errors.confirmAccountNumber.message}
                          </FieldError>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="ifscCode">IFSC Code</Label>
                      <Input
                        id="ifscCode"
                        placeholder="e.g. HDFC0000467"
                        inputMode="text"
                        maxLength={11}
                        readOnly={!isEditingBankDetails}
                        {...register("ifscCode", {
                          onChange: (e) => {
                            e.target.value = String(e.target.value ?? "")
                              .toUpperCase()
                              .replace(/\s+/g, "")
                              .slice(0, 11);
                          },
                        })}
                        aria-invalid={!!errors.ifscCode || !!ifscLookupError}
                        aria-describedby={
                          errors.ifscCode
                            ? "ifsc-code-error"
                            : ifscLookupError
                              ? "ifsc-lookup-error"
                              : undefined
                        }
                      />
                      {errors.ifscCode ? (
                        <FieldError id="ifsc-code-error">{errors.ifscCode.message}</FieldError>
                      ) : ifscLookupError ? (
                        <p id="ifsc-lookup-error" className="text-xs text-destructive" role="alert">
                          {ifscLookupError}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        placeholder="e.g. HDFC Bank"
                        readOnly
                        {...register("bankName")}
                        aria-invalid={!!errors.bankName}
                        aria-describedby={errors.bankName ? "bank-name-error" : undefined}
                      />
                      {errors.bankName && (
                        <FieldError id="bank-name-error">{errors.bankName.message}</FieldError>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branchName">Branch Name</Label>
                      <Input
                        id="branchName"
                        placeholder="e.g. Hauz Khas"
                        readOnly
                        {...register("branchName")}
                        aria-invalid={!!errors.branchName}
                        aria-describedby={errors.branchName ? "branch-name-error" : undefined}
                      />
                      {errors.branchName && (
                        <FieldError id="branch-name-error">{errors.branchName.message}</FieldError>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankCity">City</Label>
                      <Input
                        id="bankCity"
                        placeholder="e.g. New Delhi"
                        readOnly
                        {...register("bankCity")}
                        aria-invalid={!!errors.bankCity}
                        aria-describedby={errors.bankCity ? "bank-city-error" : undefined}
                      />
                      {errors.bankCity && (
                        <FieldError id="bank-city-error">{errors.bankCity.message}</FieldError>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankState">State</Label>
                      <Input
                        id="bankState"
                        placeholder="e.g. Delhi"
                        readOnly
                        {...register("bankState")}
                        aria-invalid={!!errors.bankState}
                        aria-describedby={errors.bankState ? "bank-state-error" : undefined}
                      />
                      {errors.bankState && (
                        <FieldError id="bank-state-error">{errors.bankState.message}</FieldError>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportedTransferModes">Transfer Modes</Label>
                      <div
                        id="supportedTransferModes"
                        className="min-h-10 rounded-md border border-input bg-muted px-3 py-2 text-sm"
                      >
                        {showIfscDerivedFields && ifscSupportedModes.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {ifscSupportedModes.map((mode) => (
                              <span key={mode} className="inline-flex items-center gap-1">
                                <span className="text-green-600">✅</span>
                                <span>{mode}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">e.g. NEFT, RTGS, IMPS, UPI</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tax & compliance</CardTitle>
                  <CardDescription>Optional, but recommended for invoices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="taxType">Tax type</Label>
                      <Controller
                        name="taxType"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="taxType">
                              <SelectValue placeholder="Select tax type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GST">GST</SelectItem>
                              <SelectItem value="NON_GST">Non-GST</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="financialYearStart">Financial Year Start</Label>
                      <Controller
                        name="financialYearStart"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={String(field.value)}
                            onValueChange={(v) => field.onChange(Number(v))}
                          >
                            <SelectTrigger id="financialYearStart">
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map((month, i) => (
                                <SelectItem key={month} value={String(i + 1)}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gstin">GSTIN (optional)</Label>
                      <Input
                        id="gstin"
                        placeholder="29ABCDE1234F1Z5"
                        {...register("gstin")}
                        maxLength={15}
                        aria-invalid={!!errors.gstin}
                        aria-describedby={errors.gstin ? "gstin-error" : undefined}
                      />
                      {errors.gstin && (
                        <p id="gstin-error" className="text-xs text-destructive" role="alert">
                          {errors.gstin.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pan">PAN (optional)</Label>
                      <Input
                        id="pan"
                        placeholder="ABCDE1234F"
                        {...register("pan")}
                        maxLength={10}
                        aria-invalid={!!errors.pan}
                        aria-describedby={errors.pan ? "pan-error" : undefined}
                      />
                      {errors.pan && (
                        <p id="pan-error" className="text-xs text-destructive" role="alert">
                          {errors.pan.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
            <p className="text-sm text-muted-foreground">
              {isSaving ? "Saving changes..." : "Make sure your business details are accurate"}
            </p>
            {isDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
