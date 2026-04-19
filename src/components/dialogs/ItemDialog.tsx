import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TriangleAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CategoryCombobox } from "@/components/items/CategoryCombobox";
import { UnitCombobox } from "@/components/items/UnitCombobox";
import {
  useCreateItem,
  useUpdateItem,
  useCategories,
  useCreateCategory,
  useUnits,
  useCreateUnit,
} from "@/hooks/use-items";
import {
  hsnCode,
  sacCode,
  optionalString,
  percentString,
  otherTaxName,
} from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import { normalizeMinStockThresholdValue } from "@/lib/item-api";
import { formatIgstFromCgstSgst } from "@/lib/invoice-create";
import { capitaliseWords } from "@/lib/utils";
import type { Item, Category, CreateItemRequest, Unit } from "@/types/item";

function defaultUnitForType(type: "STOCK" | "SERVICE"): string {
  return type === "SERVICE" ? "hr" : "nos";
}

const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    type: z.enum(["STOCK", "SERVICE"]),
    isActive: z.boolean(),
    hsnCode,
    sacCode,
    unit: z.string().min(1, "Unit is required"),
    description: optionalString,
    minStockThreshold: optionalString,
    isTaxable: z.boolean(),
    taxType: z.enum(["GST", "OTHER"]),
    cgstRate: percentString,
    sgstRate: percentString,
    igstRate: percentString,
    otherTaxName,
    otherTaxRate: percentString,
  })
  .superRefine((data, ctx) => {
    if (data.type === "STOCK" && !(data.minStockThreshold ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minStockThreshold"],
        message: "Min stock alert is required for stock items",
      });
    }

    if (data.type === "STOCK" && (data.minStockThreshold ?? "").trim()) {
      const threshold = (data.minStockThreshold ?? "").trim();
      if (!/^\d+$/.test(threshold)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["minStockThreshold"],
          message: "Min stock alert must be a whole number",
        });
      }
    }

    if (data.isTaxable) {
      if (!data.taxType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["taxType"],
          message: "Tax type is required when item is taxable",
        });
      }

      if (data.taxType === "GST") {
        const cgst = (data.cgstRate ?? "").trim();
        const sgst = (data.sgstRate ?? "").trim();
        const igst = (data.igstRate ?? "").trim();

        if (!cgst) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["cgstRate"],
            message: "CGST rate is required",
          });
        }
        if (!sgst) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sgstRate"],
            message: "SGST rate is required",
          });
        }
        if (!igst) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["igstRate"],
            message: "IGST rate is required",
          });
        }

        const cgstNum = Number(cgst);
        const sgstNum = Number(sgst);
        const igstNum = Number(igst);
        if (
          cgst &&
          sgst &&
          igst &&
          Number.isFinite(cgstNum) &&
          Number.isFinite(sgstNum) &&
          Number.isFinite(igstNum)
        ) {
          const delta = Math.abs(cgstNum + sgstNum - igstNum);
          if (delta > 0.01) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["igstRate"],
              message: "IGST must be equal to CGST + SGST",
            });
          }
        }
      } else if (data.taxType === "OTHER") {
        if (!data.otherTaxName) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["otherTaxName"],
            message: "Tax name is required",
          });
        }
        if (!data.otherTaxRate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["otherTaxRate"],
            message: "Tax rate is required",
          });
        }
      }
    }
  });

type FormData = z.infer<typeof schema>;

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  initialName?: string;
  onSuccess?: (item: Item) => void;
  /** POST /items/units is owner-only; hide “add unit” for STAFF. */
  canManageUnits?: boolean;
}

export default function ItemDialog({
  open,
  onOpenChange,
  item,
  initialName,
  onSuccess,
  canManageUnits = true,
}: ItemDialogProps) {
  const isEdit = !!item;
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem(item?.id ?? 0);
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const categories = useMemo(
    () => (Array.isArray(categoriesData) ? categoriesData : []),
    [categoriesData],
  );
  const createCategoryMutation = useCreateCategory();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "STOCK",
      isActive: true,
      unit: "nos",
      minStockThreshold: "",
      isTaxable: true,
      taxType: "GST",
      cgstRate: "",
      sgstRate: "",
      igstRate: "",
      otherTaxName: "",
      otherTaxRate: "",
    },
  });

  const productType = watch("type");
  const cgstRateW = watch("cgstRate");
  const sgstRateW = watch("sgstRate");
  const taxTypeW = watch("taxType");
  const isTaxableW = watch("isTaxable");

  const { data: unitsData, isLoading: unitsLoading } = useUnits(productType);
  const units = useMemo(() => (Array.isArray(unitsData) ? unitsData : []), [unitsData]);
  const createUnitMutation = useCreateUnit();
  const [category, setCategory] = useState<Category | null>(null);
  const [showCategoryError, setShowCategoryError] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const isItemActive = watch("isActive");

  // Reset form when dialog opens or edited item changes. Omit `categories` from deps so that
  // adding a category (which refetches categories) does not reset the form or clear selection.
  useEffect(() => {
    if (open) {
      if (item) {
        reset({
          name: item.name,
          type: item.type,
          isActive: item.isActive ?? true,
          hsnCode: item.hsnCode ?? "",
          sacCode: item.sacCode ?? "",
          unit: item.unit ?? "nos",
          description: item.description ?? "",
          minStockThreshold: normalizeMinStockThresholdValue(item.minStockThreshold) ?? "",
          isTaxable: item.isTaxable ?? true,
          taxType: (item.taxType ?? "GST") as "GST" | "OTHER",
          cgstRate: item.cgstRate ?? "",
          sgstRate: item.sgstRate ?? "",
          igstRate: item.igstRate ?? "",
          otherTaxName: item.otherTaxName ?? "",
          otherTaxRate: item.otherTaxRate ?? "",
        });
        const cat =
          item.categoryId && categories.length
            ? (categories.find((c) => c.id === item.categoryId) ?? null)
            : item.categoryName
              ? { id: item.categoryId ?? 0, name: item.categoryName, businessId: item.businessId }
              : typeof item.category === "string"
                ? { id: 0, name: item.category, businessId: item.businessId }
                : item.category && typeof item.category === "object"
                  ? { id: item.category.id, name: item.category.name, businessId: item.businessId }
                  : null;
        setCategory(cat);
        setShowCategoryError(false);
      } else {
        reset({
          name: initialName?.trim() ?? "",
          type: "STOCK",
          isActive: true,
          unit: "nos",
          hsnCode: "",
          sacCode: "",
          description: "",
          minStockThreshold: "",
          isTaxable: true,
          taxType: "GST",
          cgstRate: "",
          sgstRate: "",
          igstRate: "",
          otherTaxName: "",
          otherTaxRate: "",
        });
        setCategory(null);
        setShowCategoryError(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit categories so adding a category does not reset form
  }, [open, item, reset, initialName]);

  useEffect(() => {
    if (!open || !isTaxableW || taxTypeW !== "GST") return;
    const { cgstRate: cRaw, sgstRate: sRaw } = getValues();
    const c = (cRaw ?? "").trim();
    const s = (sRaw ?? "").trim();
    if (c === "" && s === "") return;
    setValue("igstRate", formatIgstFromCgstSgst(cRaw ?? "", sRaw ?? ""), {
      shouldValidate: true,
    });
  }, [open, isTaxableW, taxTypeW, cgstRateW, sgstRateW, setValue, getValues]);

  const handleCreateCategory = async (name: string): Promise<Category | null> => {
    try {
      const created = await createCategoryMutation.mutateAsync({
        name: capitaliseWords(name),
      });
      return created;
    } catch {
      showErrorToast(null, "Failed to create category");
      return null;
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!category || !category.id || category.id <= 0) {
      setShowCategoryError(true);
      showErrorToast(null, "Category is required");
      return;
    }

    await submitItem(data);
  };

  const submitItem = async (data: FormData) => {
    setShowCategoryError(false);

    if (!category || !category.id || category.id <= 0) {
      setShowCategoryError(true);
      showErrorToast(null, "Category is required");
      return;
    }

    const payload: CreateItemRequest = {
      name: capitaliseWords(data.name),
      type: data.type,
      hsnCode: data.hsnCode || null,
      sacCode: data.sacCode || null,
      categoryId: category.id,
      unit: data.unit,
      description: data.description || null,
      minStockThreshold:
        data.type === "STOCK"
          ? normalizeMinStockThresholdValue((data.minStockThreshold ?? "").trim() || null)
          : null,
      isActive: data.isActive,
      isTaxable: data.isTaxable,
      taxType: data.taxType,
      cgstRate: data.cgstRate || "0",
      sgstRate: data.sgstRate || "0",
      igstRate:
        data.taxType === "GST" &&
        ((data.cgstRate ?? "").trim() !== "" || (data.sgstRate ?? "").trim() !== "")
          ? formatIgstFromCgstSgst(data.cgstRate ?? "", data.sgstRate ?? "") || "0"
          : data.igstRate || "0",
      otherTaxName: data.otherTaxName || null,
      otherTaxRate: data.otherTaxRate || "0",
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        showSuccessToast("Item updated");
      } else {
        const created = await createMutation.mutateAsync(payload);
        showSuccessToast("Item created");
        onSuccess?.(created);
      }
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, isEdit ? "Failed to update item" : "Failed to create item");
    }
  };

  const handleStatusChange = (value: string) => {
    if (value === "active") {
      setValue("isActive", true);
      return;
    }

    if (isEdit && item?.isActive && isItemActive) {
      setDeactivateConfirmOpen(true);
      return;
    }

    setValue("isActive", false);
  };

  const handleConfirmDeactivate = () => {
    setValue("isActive", false);
    setDeactivateConfirmOpen(false);
  };

  const handleCreateUnit = async (
    value: string,
    label: string,
    type: "STOCK" | "SERVICE",
  ): Promise<Unit | null> => {
    try {
      const created = await createUnitMutation.mutateAsync({
        value,
        label: capitaliseWords(label),
        type,
      });
      return created;
    } catch {
      showErrorToast(null, "Failed to create unit");
      return null;
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const formatRateValue = (value: number): string => {
    const rounded = Number(value.toFixed(2));
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  };

  const parseRateValue = (value: string | undefined): number | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  };

  const syncFromIntraRates = () => {
    const cgstRaw = getValues("cgstRate") ?? "";
    const sgstRaw = getValues("sgstRate") ?? "";
    const cgst = parseRateValue(cgstRaw);
    const sgst = parseRateValue(sgstRaw);

    if (!cgstRaw.trim() || !sgstRaw.trim()) {
      setValue("igstRate", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    if (cgst == null || sgst == null) {
      setValue("igstRate", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    setValue("igstRate", formatRateValue(cgst + sgst), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const syncFromIgstRate = (igstText: string) => {
    if (!igstText.trim()) {
      setValue("cgstRate", "", { shouldDirty: true, shouldValidate: true });
      setValue("sgstRate", "", { shouldDirty: true, shouldValidate: true });
      return;
    }

    const igst = parseRateValue(igstText);
    if (igst == null) {
      setValue("cgstRate", "", { shouldDirty: true, shouldValidate: true });
      setValue("sgstRate", "", { shouldDirty: true, shouldValidate: true });
      return;
    }

    const half = igst / 2;
    const halfText = formatRateValue(half);
    setValue("cgstRate", halfText, { shouldDirty: true, shouldValidate: true });
    setValue("sgstRate", halfText, { shouldDirty: true, shouldValidate: true });
  };

  const onInvalidSubmit = () => {
    if (!category?.id || category.id <= 0) {
      setShowCategoryError(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{isEdit ? "Edit Item" : "New Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label required>Name</Label>
                    <Input
                      className="placeholder:opacity-80"
                      aria-invalid={!!errors.name}
                      {...register("name")}
                      placeholder="Item or service name"
                    />
                    {errors.name && <FieldError>{errors.name.message}</FieldError>}
                  </div>
                  <div className="space-y-2">
                    <Label required>Type</Label>
                    <Select
                      value={productType}
                      onValueChange={(v) => {
                        const newType = v as "STOCK" | "SERVICE";
                        setValue("type", newType);
                        setValue("unit", newType === "SERVICE" ? "hr" : "nos");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STOCK">Stock</SelectItem>
                        <SelectItem value="SERVICE">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label required>Category</Label>
                  <CategoryCombobox
                    value={category}
                    onValueChange={(nextCategory) => {
                      setCategory(nextCategory);
                      if (nextCategory?.id && nextCategory.id > 0) {
                        setShowCategoryError(false);
                      }
                    }}
                    categories={categories}
                    categoriesLoading={categoriesLoading}
                    onCreateCategory={handleCreateCategory}
                    placeholder="Search or add category..."
                  />
                  {showCategoryError && (!category?.id || category.id <= 0) ? (
                    <FieldError>Category is required</FieldError>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label required>Unit</Label>
                    <UnitCombobox
                      type={productType}
                      value={watch("unit") || defaultUnitForType(productType)}
                      onValueChange={(v) => setValue("unit", v ?? defaultUnitForType(productType))}
                      units={units}
                      unitsLoading={unitsLoading}
                      onCreateUnit={
                        canManageUnits
                          ? (value, label) => handleCreateUnit(value, label, productType)
                          : undefined
                      }
                      placeholder="Select unit"
                    />
                    {errors.unit && <FieldError>{errors.unit.message}</FieldError>}
                  </div>
                  {productType === "STOCK" && (
                    <div className="space-y-2">
                      <Label required>Min stock alert</Label>
                      <Input
                        className="placeholder:opacity-80"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        step={1}
                        min={0}
                        {...register("minStockThreshold", {
                          onChange: (event) => {
                            event.target.value = event.target.value.replace(/\D/g, "");
                          },
                        })}
                        placeholder="e.g. 10"
                      />
                      {errors.minStockThreshold && (
                        <FieldError>{errors.minStockThreshold.message}</FieldError>
                      )}
                      <p className="text-xs text-muted-foreground">
                        You'll be notified when quantity drops below this value. Required for stock
                        items.
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    className="placeholder:opacity-80"
                    rows={2}
                    {...register("description")}
                    placeholder="Optional"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Classification</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>HSN Code</Label>
                    <Input
                      className="placeholder:opacity-80"
                      maxLength={8}
                      {...register("hsnCode")}
                      placeholder="e.g. 998314"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SAC Code</Label>
                    <Input
                      className="placeholder:opacity-80"
                      maxLength={6}
                      {...register("sacCode")}
                      placeholder="e.g. 998313"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Tax</h3>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isTaxable"
                    checked={watch("isTaxable")}
                    onCheckedChange={(checked: boolean) => setValue("isTaxable", checked)}
                  />
                  <Label htmlFor="isTaxable" className="cursor-pointer font-normal">
                    Taxable
                  </Label>
                </div>
                {watch("isTaxable") && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label required>Tax type</Label>
                      <Select
                        value={watch("taxType")}
                        onValueChange={(v) => setValue("taxType", v as "GST" | "OTHER")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GST">GST</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.taxType && <FieldError>{errors.taxType.message}</FieldError>}
                    </div>
                    {watch("taxType") === "GST" ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs" required>
                            CGST %
                          </Label>
                          <Input
                            placeholder="e.g. 9"
                            className="placeholder:opacity-80"
                            {...register("cgstRate", {
                              onChange: () => {
                                syncFromIntraRates();
                              },
                            })}
                          />
                          {errors.cgstRate && <FieldError>{errors.cgstRate.message}</FieldError>}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs" required>
                            SGST %
                          </Label>
                          <Input
                            placeholder="e.g. 9"
                            className="placeholder:opacity-80"
                            {...register("sgstRate", {
                              onChange: () => {
                                syncFromIntraRates();
                              },
                            })}
                          />
                          {errors.sgstRate && <FieldError>{errors.sgstRate.message}</FieldError>}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs" required>
                            IGST %
                          </Label>
                          <Input
                            placeholder="e.g. 18"
                            className="placeholder:opacity-80"
                            {...register("igstRate", {
                              onChange: (event) => {
                                syncFromIgstRate(event.target.value);
                              },
                            })}
                          />
                          {errors.igstRate && <FieldError>{errors.igstRate.message}</FieldError>}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs" required>
                            Other tax name
                          </Label>
                          <Input
                            className="placeholder:opacity-80"
                            maxLength={100}
                            placeholder="e.g. VAT"
                            {...register("otherTaxName")}
                          />
                          {errors.otherTaxName && (
                            <FieldError>{errors.otherTaxName.message}</FieldError>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs" required>
                            Rate %
                          </Label>
                          <Input
                            placeholder="0"
                            className="placeholder:opacity-80"
                            {...register("otherTaxRate")}
                          />
                          {errors.otherTaxRate && (
                            <FieldError>{errors.otherTaxRate.message}</FieldError>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
          <div className="shrink-0 border-t px-6 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label className="text-sm font-medium">Status</Label>
              <RadioGroup
                value={isItemActive ? "active" : "inactive"}
                onValueChange={handleStatusChange}
                className="flex items-center gap-6"
                aria-label="Item status"
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
          <DialogFooter className="shrink-0 border-t px-6 py-4">
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

      <AlertDialog
        open={deactivateConfirmOpen}
        onOpenChange={(open) => setDeactivateConfirmOpen(open)}
      >
        <AlertDialogContent className="max-w-md overflow-hidden p-0">
          <AlertDialogHeader className="border-b bg-destructive/5 px-5 py-4">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <TriangleAlert className="h-4 w-4" />
            </div>
            <AlertDialogTitle className="text-base">Deactivate this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the item as inactive and hide it by default in item lists and
              selections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-t px-5 py-4">
            <AlertDialogCancel>Keep Active</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
