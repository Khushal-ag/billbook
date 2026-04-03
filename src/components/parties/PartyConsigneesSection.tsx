"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCreatePartyConsignee,
  useDeletePartyConsignee,
  useParty,
  useUpdatePartyConsignee,
} from "@/hooks/use-parties";
import type { CreatePartyConsigneeRequest, PartyConsignee, PartyType } from "@/types/party";

function consigneeUiLabels(partyType: PartyType) {
  if (partyType === "SUPPLIER") {
    return {
      sectionTitle: "Vendor locations",
      sectionDescription:
        "Extra warehouses, branches, or dispatch points for this vendor. Billing address stays above.",
      loadingList: "Loading locations…",
      emptyList: "No extra vendor locations yet.",
      addDialogTitle: "Add vendor location",
      editDialogTitle: "Edit vendor location",
      contactFieldLabel: "Site contact",
      labelPlaceholder: "e.g. Main warehouse, Branch office",
      defaultCheckbox: "Default vendor location",
      itemAriaPrefix: "vendor location",
      toastAdded: "Vendor location added",
      toastUpdated: "Vendor location updated",
      toastRemoved: "Vendor location removed",
      toastAddError: "Failed to add vendor location",
      toastUpdateError: "Failed to update vendor location",
      toastRemoveError: "Failed to remove vendor location",
      deleteTitle: "Remove this vendor location?",
      deleteDescription: (name: string) =>
        `This will remove “${name}” from this vendor’s locations.`,
    };
  }
  return {
    sectionTitle: "Delivery addresses",
    sectionDescription:
      "Extra places you deliver goods to for this customer. Billing address stays above.",
    loadingList: "Loading addresses…",
    emptyList: "No extra delivery addresses yet.",
    addDialogTitle: "Add delivery address",
    editDialogTitle: "Edit delivery address",
    contactFieldLabel: "Contact at delivery",
    labelPlaceholder: "e.g. Home, Office",
    defaultCheckbox: "Default delivery address",
    itemAriaPrefix: "delivery address",
    toastAdded: "Delivery address added",
    toastUpdated: "Delivery address updated",
    toastRemoved: "Delivery address removed",
    toastAddError: "Failed to add delivery address",
    toastUpdateError: "Failed to update delivery address",
    toastRemoveError: "Failed to remove delivery address",
    deleteTitle: "Remove this delivery address?",
    deleteDescription: (name: string) => `This will remove “${name}” from delivery addresses.`,
  };
}
import { optionalEmail, optionalString } from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import { fetchPostalOffice } from "@/lib/pincode";

function sortConsignees(list: PartyConsignee[]): PartyConsignee[] {
  return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);
}

const optionalPhoneDigits = z
  .string()
  .trim()
  .refine((val) => val === "" || /^\d+$/.test(val), "Phone can only contain digits")
  .refine(
    (val) => val === "" || (val.length >= 10 && val.length <= 15),
    "Phone number must have between 10 and 15 digits",
  );

const consigneeSchema = z.object({
  label: optionalString,
  consigneeName: z.string().trim().min(1, "Contact name is required"),
  address: z.string().trim().min(1, "Address is required"),
  phone: optionalPhoneDigits,
  email: optionalEmail,
  city: optionalString,
  state: optionalString,
  postalCode: optionalString,
  isDefault: z.boolean().default(false),
});

type ConsigneeFormData = z.infer<typeof consigneeSchema>;

function buildConsigneePayload(data: ConsigneeFormData): CreatePartyConsigneeRequest {
  const payload: CreatePartyConsigneeRequest = {
    consigneeName: data.consigneeName.trim(),
    address: data.address.trim(),
    isDefault: data.isDefault,
  };
  const label = data.label?.trim();
  if (label) payload.label = label;
  const phone = data.phone?.trim();
  if (phone) payload.phone = phone;
  const email = data.email?.trim();
  if (email) payload.email = email;
  const city = data.city?.trim();
  if (city) payload.city = city;
  const state = data.state?.trim();
  if (state) payload.state = state;
  const postalCode = data.postalCode?.trim();
  if (postalCode) payload.postalCode = postalCode;
  return payload;
}

interface ConsigneeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partyId: number;
  consignee: PartyConsignee | null;
  partyType: PartyType;
}

function ConsigneeEditorDialog({
  open,
  onOpenChange,
  partyId,
  consignee,
  partyType,
}: ConsigneeEditorDialogProps) {
  const L = consigneeUiLabels(partyType);
  const isEdit = !!consignee;
  const createMutation = useCreatePartyConsignee(partyId);
  const updateMutation = useUpdatePartyConsignee(partyId);
  const pincodeInitialMountRef = useRef(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConsigneeFormData>({
    resolver: zodResolver(consigneeSchema),
    defaultValues: { isDefault: false, phone: "", email: "" },
  });

  const postalCode = watch("postalCode");

  useEffect(() => {
    const raw = (postalCode ?? "").toString().trim();
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 6) {
      pincodeInitialMountRef.current = false;
      return;
    }
    if (pincodeInitialMountRef.current) {
      pincodeInitialMountRef.current = false;
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const office = await fetchPostalOffice(digits, "IN", controller.signal);
        if (!office) return;
        if (office.name) setValue("address", office.name, { shouldDirty: true });
        if (office.district) setValue("city", office.district, { shouldDirty: true });
        if (office.state) setValue("state", office.state, { shouldDirty: true });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    })();
    return () => controller.abort();
  }, [postalCode, setValue]);

  useEffect(() => {
    if (!open) return;
    pincodeInitialMountRef.current = true;
    if (consignee) {
      reset({
        label: consignee.label ?? "",
        consigneeName: consignee.consigneeName,
        address: consignee.address,
        phone: consignee.phone ?? "",
        email: consignee.email ?? "",
        city: consignee.city ?? "",
        state: consignee.state ?? "",
        postalCode: consignee.postalCode ?? "",
        isDefault: consignee.isDefault,
      });
    } else {
      reset({
        label: "",
        consigneeName: "",
        address: "",
        phone: "",
        email: "",
        city: "",
        state: "",
        postalCode: "",
        isDefault: false,
      });
    }
  }, [open, consignee, reset]);

  const onSubmit = async (data: ConsigneeFormData) => {
    if (!data.consigneeName.trim()) {
      setError("consigneeName", { type: "manual", message: "Contact name is required" });
      return;
    }
    if (!data.address.trim()) {
      setError("address", { type: "manual", message: "Address is required" });
      return;
    }

    const body = buildConsigneePayload(data);
    try {
      if (isEdit && consignee) {
        await updateMutation.mutateAsync({ consigneeId: consignee.id, data: body });
        showSuccessToast(L.toastUpdated);
      } else {
        await createMutation.mutateAsync(body);
        showSuccessToast(L.toastAdded);
      }
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, isEdit ? L.toastUpdateError : L.toastAddError);
    }
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  const handleConsigneeFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // Prevent submit bubbling into parent PartyDialog form.
    event.preventDefault();
    event.stopPropagation();
    void handleSubmit(onSubmit)(event);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? L.editDialogTitle : L.addDialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleConsigneeFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input {...register("label")} placeholder={L.labelPlaceholder} />
            </div>
            <div className="space-y-2">
              <Label required>{L.contactFieldLabel}</Label>
              <Input {...register("consigneeName")} aria-invalid={!!errors.consigneeName} />
              {errors.consigneeName && <FieldError>{errors.consigneeName.message}</FieldError>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                {...register("phone", {
                  onChange: (e) => {
                    e.target.value = String(e.target.value ?? "")
                      .replace(/\D/g, "")
                      .slice(0, 15);
                  },
                })}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="tel"
                maxLength={15}
              />
              {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Postal code</Label>
            <Input {...register("postalCode")} placeholder="e.g. 560034" maxLength={10} />
            <p className="text-xs text-muted-foreground">
              Enter 6-digit pincode to auto-fill address, city and state
            </p>
          </div>

          <div className="space-y-2">
            <Label required>Address</Label>
            <Input
              {...register("address")}
              placeholder="Street / full line"
              aria-invalid={!!errors.address}
            />
            {errors.address && <FieldError>{errors.address.message}</FieldError>}
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

          <div className="flex items-center gap-2">
            <Checkbox
              id="consignee-default"
              checked={watch("isDefault")}
              onCheckedChange={(c) => setValue("isDefault", c === true)}
            />
            <Label htmlFor="consignee-default" className="cursor-pointer text-sm font-normal">
              {L.defaultCheckbox}
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PartyConsigneesSectionProps {
  partyId: number;
  partyType: PartyType;
  /** When false, skips fetching (e.g. parent dialog closed). */
  enabled: boolean;
}

export function PartyConsigneesSection({
  partyId,
  partyType,
  enabled,
}: PartyConsigneesSectionProps) {
  const L = consigneeUiLabels(partyType);
  const { data: party, isPending } = useParty(partyId, { enabled });
  const deleteMutation = useDeletePartyConsignee(partyId);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PartyConsignee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartyConsignee | null>(null);

  const consignees = useMemo(() => sortConsignees(party?.consignees ?? []), [party?.consignees]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (c: PartyConsignee) => {
    setEditing(c);
    setEditorOpen(true);
  };

  const confirmDelete = async (consigneeId: number) => {
    try {
      await deleteMutation.mutateAsync(consigneeId);
      showSuccessToast(L.toastRemoved);
      setDeleteTarget(null);
    } catch (err) {
      showErrorToast(err, L.toastRemoveError);
    }
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h3 className="text-sm font-medium">{L.sectionTitle}</h3>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{L.sectionDescription}</p>

      {isPending ? (
        <p className="text-sm text-muted-foreground">{L.loadingList}</p>
      ) : consignees.length === 0 ? (
        <p className="text-sm text-muted-foreground">{L.emptyList}</p>
      ) : (
        <ul className="max-h-48 space-y-2 overflow-y-auto pr-1 text-sm">
          {consignees.map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/20 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {c.label ? (
                    <span className="font-medium">{c.label}</span>
                  ) : (
                    <span className="text-muted-foreground">No label</span>
                  )}
                  {c.isDefault && (
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      Default
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-muted-foreground">{c.consigneeName}</p>
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  {[c.address, c.city, c.state, c.postalCode].filter(Boolean).join(", ") ||
                    c.address}
                </p>
                {(c.phone || c.email) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[c.phone, c.email].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => openEdit(c)}
                  title="Edit"
                  aria-label={`Edit ${L.itemAriaPrefix} ${c.label || c.consigneeName}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(c)}
                  title="Delete"
                  aria-label={`Delete ${L.itemAriaPrefix} ${c.label || c.consigneeName}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConsigneeEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        partyId={partyId}
        consignee={editing}
        partyType={partyType}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{L.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? L.deleteDescription(deleteTarget.label || deleteTarget.consigneeName)
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                const id = deleteTarget?.id;
                if (id != null) void confirmDelete(id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
