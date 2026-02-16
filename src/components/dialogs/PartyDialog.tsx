import { useEffect } from "react";
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
import type { Party } from "@/types/party";
import { gstinString, optionalEmail, priceString, optionalString } from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(["CUSTOMER", "SUPPLIER"]).default("CUSTOMER"),
  gstin: gstinString,
  email: optionalEmail,
  phone: optionalString,
  address: optionalString,
  city: optionalString,
  state: optionalString,
  postalCode: optionalString,
  openingBalance: priceString,
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  party?: Party | null;
  defaultType?: "CUSTOMER" | "SUPPLIER";
}

export default function PartyDialog({
  open,
  onOpenChange,
  party,
  defaultType = "CUSTOMER",
}: Props) {
  const isEdit = !!party;
  const createMutation = useCreateParty();
  const updateMutation = useUpdateParty(party?.id ?? 0);

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

  useEffect(() => {
    if (open) {
      if (party) {
        reset({
          name: party.name,
          type: party.type,
          gstin: party.gstin ?? "",
          email: party.email ?? "",
          phone: party.phone ?? "",
          address: party.address ?? "",
          city: party.city ?? "",
          state: party.state ?? "",
          postalCode: party.postalCode ?? "",
          openingBalance: party.openingBalance ?? "",
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
        });
      }
    }
  }, [open, party, reset, defaultType]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name,
      type: data.type,
      gstin: data.gstin || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      postalCode: data.postalCode || undefined,
      openingBalance: data.openingBalance || undefined,
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        showSuccessToast("Party updated");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccessToast("Party created");
      }
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, isEdit ? "Failed to update party" : "Failed to create party");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Party" : "New Party"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
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
                  <SelectItem value="SUPPLIER">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("phone")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>GSTIN</Label>
              <Input placeholder="22AAAAA0000A1Z5" {...register("gstin")} />
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
            <Label>Address</Label>
            <Input {...register("address")} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...register("city")} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input {...register("state")} />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input {...register("postalCode")} />
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
    </Dialog>
  );
}
