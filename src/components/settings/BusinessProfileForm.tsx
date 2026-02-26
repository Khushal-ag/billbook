import { useRef, useState, useEffect } from "react";
import { Controller, useFieldArray, type UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Plus, Trash2 } from "lucide-react";
import type { ProfileForm } from "@/components/settings/profileSchema";
import {
  MONTHS,
  BUSINESS_TYPES,
  INDUSTRY_TYPES,
  REGISTRATION_TYPES,
  COUNTRIES,
} from "@/lib/profile-options";
import { usePincodeAutofill } from "@/hooks/use-pincode-autofill";
import { showErrorToast } from "@/lib/toast-helpers";

const LOGO_MAX_SIZE_MB = 5;
const SIGNATURE_MAX_SIZE_MB = 2;

interface BusinessProfileFormProps {
  form: UseFormReturn<ProfileForm>;
  onSubmit: (data: ProfileForm) => void | Promise<void>;
  isDirty: boolean;
  isSaving: boolean;
  /** Pending logo file (selected but not yet saved); parent uploads on submit */
  pendingLogoFile?: File | null;
  /** Pending signature file (selected but not yet saved) */
  pendingSignatureFile?: File | null;
  onLogoFileChange?: (file: File | null) => void;
  onSignatureFileChange?: (file: File | null) => void;
}

export function BusinessProfileForm({
  form,
  onSubmit,
  isDirty,
  isSaving,
  pendingLogoFile = null,
  pendingSignatureFile = null,
  onLogoFileChange,
  onSignatureFileChange,
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
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const logoUrl = watch("logoUrl");
  const signatureUrl = watch("signatureUrl");
  const pincode = watch("pincode");

  const displayLogoUrl = pendingLogoFile ? logoPreviewUrl : logoUrl || null;
  const displaySignatureUrl = pendingSignatureFile ? signaturePreviewUrl : signatureUrl || null;

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

  const handlePhoneCountryChange = (value: string) => {
    setPhoneCountryCode(value);
  };

  const handleLogoClick = () => logoInputRef.current?.click();
  const handleSignatureClick = () => signatureInputRef.current?.click();

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (file) {
      if (file.size > LOGO_MAX_SIZE_MB * 1024 * 1024) {
        showErrorToast(`Logo must be under ${LOGO_MAX_SIZE_MB} MB`);
        return;
      }
      onLogoFileChange?.(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (file) {
      if (file.size > SIGNATURE_MAX_SIZE_MB * 1024 * 1024) {
        showErrorToast(`Signature image must be under ${SIGNATURE_MAX_SIZE_MB} MB`);
        return;
      }
      onSignatureFileChange?.(file);
    }
  };

  const handleRemoveLogo = () => {
    onLogoFileChange?.(null);
    setValue("logoUrl", null, { shouldDirty: true });
  };

  const handleRemoveSignature = () => {
    onSignatureFileChange?.(null);
    setValue("signatureUrl", null, { shouldDirty: true });
  };

  usePincodeAutofill(pincode, phoneCountryCode, getValues, setValue);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Business Information</CardTitle>
        <CardDescription>Update your business details and compliance settings</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-[220px_minmax(300px,1fr)_300px]">
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-border/60 p-4 text-center">
                {displayLogoUrl ? (
                  <div className="relative mx-auto mb-3 inline-block">
                    <img
                      src={displayLogoUrl}
                      alt="Business logo"
                      className="h-24 w-24 rounded-lg bg-muted object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                      onClick={handleRemoveLogo}
                      aria-label="Remove logo"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
                <p className="text-sm font-medium">Upload Logo</p>
                <p className="text-xs text-muted-foreground">PNG/JPG, max {LOGO_MAX_SIZE_MB} MB</p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleLogoClick}
                >
                  {displayLogoUrl ? "Change file" : "Choose file"}
                </Button>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
                Your logo appears on invoices, reports, and client-facing documents.
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-4 rounded-lg border border-border/60 p-4">
                <p className="text-sm font-semibold">Primary details</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      aria-required="true"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                    {errors.name && (
                      <p id="name-error" className="text-xs text-destructive" role="alert">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      {...register("country")}
                      placeholder="e.g. India"
                      aria-invalid={!!errors.country}
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
                    <Label htmlFor="businessType">Business Type</Label>
                    <Controller
                      name="businessType"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger id="businessType">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_TYPES.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industryType">Industry Type</Label>
                    <Controller
                      name="industryType"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger id="industryType">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDUSTRY_TYPES.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
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
                    <Label htmlFor="phone">Phone number</Label>
                    <div className="grid grid-cols-[115px_1fr] gap-2">
                      <Select value={phoneCountryCode} onValueChange={handlePhoneCountryChange}>
                        <SelectTrigger
                          id="phoneCountry"
                          aria-label="Phone country"
                          className="h-10"
                        >
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((item) => (
                            <SelectItem key={item.code} value={item.code}>
                              {item.label} ({item.dialCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        placeholder="9876543210"
                        inputMode="tel"
                        {...register("phone")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street address</Label>
                    <Textarea
                      id="street"
                      placeholder="123 Main Street"
                      className="min-h-[88px]"
                      {...register("street")}
                      maxLength={500}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="area">Area / Locality</Label>
                    <Input id="area" {...register("area")} placeholder="Koramangala" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("city")} placeholder="Bangalore" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input id="state" {...register("state")} placeholder="Karnataka" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      placeholder="560034"
                      {...register("pincode")}
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-border/60 p-4">
                <p className="text-sm font-semibold">Tax and compliance</p>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN (optional)</Label>
                  <Input
                    id="gstin"
                    placeholder="GSTIN"
                    {...register("gstin")}
                    maxLength={15}
                    aria-invalid={!!errors.gstin}
                    aria-describedby={errors.gstin ? "gstin-error" : "gstin-hint"}
                  />
                  {errors.gstin ? (
                    <p id="gstin-error" className="text-xs text-destructive" role="alert">
                      {errors.gstin.message}
                    </p>
                  ) : (
                    <p id="gstin-hint" className="text-xs text-muted-foreground">
                      Leave blank if GST does not apply
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN Number</Label>
                    <Input
                      id="pan"
                      placeholder="Enter PAN number"
                      {...register("pan")}
                      maxLength={10}
                      aria-invalid={!!errors.pan}
                      aria-describedby={errors.pan ? "pan-error" : "pan-hint"}
                    />
                    {errors.pan ? (
                      <p id="pan-error" className="text-xs text-destructive" role="alert">
                        {errors.pan.message}
                      </p>
                    ) : (
                      <p id="pan-hint" className="text-xs text-muted-foreground">
                        10-character permanent account number
                      </p>
                    )}
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
              </div>
            </div>

            <div className="space-y-4 lg:col-span-2 xl:col-span-1">
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
                        <Select value={field.value || ""} onValueChange={field.onChange}>
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
                    >
                      {displaySignatureUrl ? "Change signature" : "Add Signature"}
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
