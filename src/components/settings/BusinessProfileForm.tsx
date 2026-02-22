import { useRef, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
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
import { Upload } from "lucide-react";
import type { ProfileForm } from "@/components/settings/profileSchema";
import {
  MONTHS,
  BUSINESS_TYPES,
  INDUSTRY_TYPES,
  REGISTRATION_TYPES,
  COUNTRIES,
} from "@/lib/profile-options";
import { usePincodeAutofill } from "@/hooks/use-pincode-autofill";

interface BusinessProfileFormProps {
  form: UseFormReturn<ProfileForm>;
  onSubmit: (data: ProfileForm) => void | Promise<void>;
  isDirty: boolean;
  isSaving: boolean;
}

export function BusinessProfileForm({
  form,
  onSubmit,
  isDirty,
  isSaving,
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

  const [businessType, setBusinessType] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [registrationType, setRegistrationType] = useState("");
  const [detailKey, setDetailKey] = useState("Website");
  const [detailValue, setDetailValue] = useState("");
  const [country, setCountry] = useState("IN");
  const [signatureName, setSignatureName] = useState<string | null>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const postalCode = watch("postalCode");

  const handleCountryChange = (value: string) => {
    setCountry(value);
  };

  const handleSignatureClick = () => {
    signatureInputRef.current?.click();
  };

  usePincodeAutofill(postalCode, country, getValues, setValue);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Business Information</CardTitle>
        <CardDescription>Update your business details and compliance settings</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-border/60 p-4 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">Upload Logo</p>
                <p className="text-xs text-muted-foreground">PNG/JPG, max 5 MB</p>
                <Button type="button" variant="outline" size="sm" className="mt-3">
                  Choose file
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
                    <Label htmlFor="email">Company Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="company@email.com"
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
                    <Select value={businessType} onValueChange={setBusinessType}>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industryType">Industry Type</Label>
                    <Select value={industryType} onValueChange={setIndustryType}>
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
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <div className="grid grid-cols-[115px_1fr] gap-2">
                      <Select value={country} onValueChange={handleCountryChange}>
                        <SelectTrigger id="country" aria-label="Country" className="h-10">
                          <SelectValue placeholder="Select country" />
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
                        placeholder="Phone number"
                        inputMode="tel"
                        {...register("phone")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter address"
                      className="min-h-[88px]"
                      {...register("address")}
                      maxLength={500}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input id="state" {...register("state")} placeholder="Enter state" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("city")} placeholder="Enter city" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal code</Label>
                    <Input
                      id="postalCode"
                      placeholder="Enter postal code"
                      {...register("postalCode")}
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

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Registration and Signature</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="registrationType">Business Registration Type</Label>
                    <Select value={registrationType} onValueChange={setRegistrationType}>
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
                  </div>
                  <div className="rounded-lg border-2 border-dashed border-border/60 px-4 py-6 text-center">
                    <p className="text-xs text-muted-foreground">Add signature for invoices</p>
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => setSignatureName(event.target.files?.[0]?.name ?? null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleSignatureClick}
                    >
                      Add Signature
                    </Button>
                    {signatureName && (
                      <p className="mt-2 text-xs text-muted-foreground">{signatureName}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Additional business details</CardTitle>
                  <CardDescription>MSME, website, or any extra identifiers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Input
                      value={detailKey}
                      onChange={(e) => setDetailKey(e.target.value)}
                      placeholder="Website"
                    />
                    <Input
                      value={detailValue}
                      onChange={(e) => setDetailValue(e.target.value)}
                      placeholder="www.website.com"
                    />
                    <Button type="button" variant="secondary" className="w-full">
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/70 pt-4">
            <p className="text-xs text-muted-foreground">
              {isSaving ? "Saving changes..." : "Make sure your business details are accurate"}
            </p>
            {isDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
