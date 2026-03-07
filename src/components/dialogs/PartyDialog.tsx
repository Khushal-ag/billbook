import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useCreateParty, useUpdateParty } from "@/hooks/use-parties";
import ConfirmDialog from "@/components/ConfirmDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Party } from "@/types/party";
import { gstinString, optionalEmail, priceString, optionalString } from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import { capitaliseWords } from "@/lib/utils";
import { fetchPostalOffice } from "@/lib/pincode";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(["CUSTOMER", "SUPPLIER"]).default("CUSTOMER"),
  gstin: gstinString,
  email: optionalEmail,
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .regex(
      /^[0-9+\s\-().]*$/,
      "Phone can only contain numbers, +, spaces, hyphens, and parentheses",
    )
    .refine((val) => {
      const digitsOnly = val.replace(/\D/g, "");
      return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    }, "Phone number must have between 10 and 15 digits"),
  address: optionalString,
  city: optionalString,
  state: optionalString,
  postalCode: optionalString,
  openingBalance: priceString,
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  party?: Party | null;
  defaultType?: "CUSTOMER" | "SUPPLIER";
  /** When true, type is fixed to defaultType and the Type field is hidden (e.g. when opening from Customer or Vendor page) */
  typeLocked?: boolean;
  /** Called with the created party after successful create (edit not used) */
  onSuccess?: (party: Party) => void;
}

export default function PartyDialog({
  open,
  onOpenChange,
  party,
  defaultType = "CUSTOMER",
  typeLocked = false,
  onSuccess,
}: Props) {
  const isEdit = !!party;
  const createMutation = useCreateParty();
  const updateMutation = useUpdateParty(party?.id ?? 0);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: defaultType },
  });

  const partyType = watch("type");
  const isPartyActive = watch("isActive");
  const postalCode = watch("postalCode");
  const pincodeInitialMountRef = useRef(true);

  // Fetch address from postal code (same API as business profile)
  useEffect(() => {
    const raw = (postalCode ?? "").toString().trim();
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 6) {
      pincodeInitialMountRef.current = false;
      return;
    }
    // Skip first run when dialog opens with existing 6-digit pincode (edit mode) so we don't overwrite
    if (pincodeInitialMountRef.current) {
      pincodeInitialMountRef.current = false;
      return;
    }

    const controller = new AbortController();
    const fetchAddress = async () => {
      try {
        const office = await fetchPostalOffice(digits, "IN", controller.signal);
        if (!office) return;
        if (office.name) setValue("address", office.name, { shouldDirty: true });
        if (office.district) setValue("city", office.district, { shouldDirty: true });
        if (office.state) setValue("state", office.state, { shouldDirty: true });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    };
    fetchAddress();
    return () => controller.abort();
  }, [postalCode, setValue]);

  useEffect(() => {
    if (open) {
      pincodeInitialMountRef.current = true;
      if (party) {
        reset({
          name: party.name,
          type: typeLocked ? defaultType : party.type,
          gstin: party.gstin ?? "",
          email: party.email ?? "",
          phone: party.phone || "",
          address: party.address ?? "",
          city: party.city ?? "",
          state: party.state ?? "",
          postalCode: party.postalCode ?? "",
          openingBalance: party.openingBalance ?? "",
          isActive: party.isActive ?? true,
        });
      } else {
        reset({
          name: "",
          type: defaultType,
          gstin: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          postalCode: "",
          openingBalance: "",
          isActive: true,
        });
      }
    }
  }, [open, party, reset, defaultType, typeLocked]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: capitaliseWords(data.name),
      type: typeLocked ? defaultType : data.type,
      gstin: data.gstin || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      postalCode: data.postalCode || undefined,
      openingBalance: data.openingBalance || undefined,
      isActive: data.isActive,
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        showSuccessToast("Party updated");
      } else {
        const created = await createMutation.mutateAsync(payload);
        showSuccessToast("Party created");
        onSuccess?.(created);
      }
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, isEdit ? "Failed to update party" : "Failed to create party");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleStatusChange = (value: string) => {
    if (value === "active") {
      setValue("isActive", true);
      return;
    }

    if (isEdit && party?.isActive && isPartyActive) {
      setDeactivateConfirmOpen(true);
      return;
    }

    setValue("isActive", false);
  };

  const handleConfirmDeactivate = () => {
    setValue("isActive", false);
    setDeactivateConfirmOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {typeLocked
              ? isEdit
                ? `Edit ${defaultType === "CUSTOMER" ? "Customer" : "Vendor"}`
                : `New ${defaultType === "CUSTOMER" ? "Customer" : "Vendor"}`
              : isEdit
                ? "Edit Party"
                : "New Party"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className={typeLocked ? "space-y-2" : "grid grid-cols-2 gap-4"}>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            {!typeLocked && (
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={partyType}
                  onValueChange={(v) => setValue("type", v as "CUSTOMER" | "SUPPLIER")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                    <SelectItem value="SUPPLIER">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>GSTIN</Label>
              <Input placeholder="22AAAAA0000A1Z5" {...register("gstin")} />
              {errors.gstin && <p className="text-xs text-destructive">{errors.gstin.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Opening Balance</Label>
              <Input placeholder="0.00" {...register("openingBalance")} />
              {errors.openingBalance && (
                <p className="text-xs text-destructive">{errors.openingBalance.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Postal Code</Label>
            <Input {...register("postalCode")} placeholder="e.g. 560034" maxLength={10} />
            <p className="text-xs text-muted-foreground">
              Enter 6-digit pincode to auto-fill address, city and state
            </p>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Input {...register("address")} placeholder="Area / locality" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...register("city")} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input {...register("state")} />
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label className="text-sm font-medium">Status</Label>
              <RadioGroup
                value={isPartyActive ? "active" : "inactive"}
                onValueChange={handleStatusChange}
                className="flex items-center gap-6"
                aria-label="Party status"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="status-active" value="active" />
                  <Label htmlFor="status-active" className="cursor-pointer text-sm font-normal">
                    Active
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="status-inactive" value="inactive" />
                  <Label htmlFor="status-inactive" className="cursor-pointer text-sm font-normal">
                    Inactive
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <ConfirmDialog
        open={deactivateConfirmOpen}
        onOpenChange={setDeactivateConfirmOpen}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate this party?"
        description="Inactive parties are hidden by default in customer/vendor lists and selectors."
        confirmText="Deactivate"
        cancelText="Keep Active"
        variant="destructive"
      />
    </Dialog>
  );
}
