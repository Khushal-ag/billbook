import { Controller, type UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { ProfileForm } from "@/components/settings/profileSchema";

interface BusinessProfileFormProps {
  form: UseFormReturn<ProfileForm>;
  onSubmit: (data: ProfileForm) => void | Promise<void>;
  isSubmitting: boolean;
  isDirty: boolean;
  isSaving: boolean;
}

export function BusinessProfileForm({
  form,
  onSubmit,
  isSubmitting,
  isDirty,
  isSaving,
}: BusinessProfileFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Business Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="business@example.com"
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+91 98765 43210" {...register("phone")} />
              <p className="text-xs text-muted-foreground">Optional contact number</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                placeholder="22AAAAA0000A1Z5"
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
                  15-character GST identification number
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                placeholder="AAAAA0000A"
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
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                placeholder="400001"
                {...register("postalCode")}
                maxLength={10}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} placeholder="Mumbai" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register("state")} placeholder="Maharashtra" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Business address"
              {...register("address")}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">Complete business address</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="taxType">Tax Type</Label>
              <Controller
                name="taxType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="taxType" aria-label="Select tax type">
                      <SelectValue placeholder="Select tax type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GST">GST</SelectItem>
                      <SelectItem value="NON_GST">Non-GST</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">Select your business tax type</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="financialYearStart">Financial Year Start Month</Label>
              <Controller
                name="financialYearStart"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger
                      id="financialYearStart"
                      aria-label="Select financial year start month"
                    >
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((month, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">When your financial year begins</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || isSaving}
              aria-label="Save business profile changes"
            >
              {(isSubmitting || isSaving) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            {isDirty && (
              <span className="text-xs text-muted-foreground">You have unsaved changes</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
