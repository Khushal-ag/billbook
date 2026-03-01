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
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CategoryCombobox } from "@/components/items/CategoryCombobox";
import { useCreateItem, useUpdateItem, useCategories, useCreateCategory } from "@/hooks/use-items";
import {
  hsnCode,
  sacCode,
  optionalString,
  percentString,
  otherTaxName,
} from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import type { Item, Category, CreateItemRequest } from "@/types/item";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(["STOCK", "SERVICE"]),
  hsnCode,
  sacCode,
  unit: optionalString,
  description: optionalString,
  minStockThreshold: optionalString,
  isTaxable: z.boolean(),
  taxType: z.enum(["GST", "OTHER"]),
  cgstRate: percentString,
  sgstRate: percentString,
  igstRate: percentString,
  otherTaxName,
  otherTaxRate: percentString,
});

type FormData = z.infer<typeof schema>;

const UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: "nos", label: "Numbers (nos)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "l", label: "Litres (l)" },
  { value: "ml", label: "Millilitres (ml)" },
  { value: "m", label: "Metres (m)" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "set", label: "Set" },
  { value: "doz", label: "Dozen (doz)" },
  { value: "hr", label: "Hours (hr)" },
  { value: "sqft", label: "Square feet (sqft)" },
];

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
}

export default function ItemDialog({ open, onOpenChange, item }: ItemDialogProps) {
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "STOCK",
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

  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (open) {
      if (item) {
        reset({
          name: item.name,
          type: item.type,
          hsnCode: item.hsnCode ?? "",
          sacCode: item.sacCode ?? "",
          unit: item.unit ?? "nos",
          description: item.description ?? "",
          minStockThreshold: item.minStockThreshold ?? "",
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
      } else {
        reset({
          name: "",
          type: "STOCK",
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
      }
    }
  }, [open, item, reset, categories]);

  const handleCreateCategory = async (name: string): Promise<Category | null> => {
    try {
      const created = await createCategoryMutation.mutateAsync({ name });
      return created;
    } catch {
      showErrorToast(null, "Failed to create category");
      return null;
    }
  };

  const onSubmit = async (data: FormData) => {
    const payload: CreateItemRequest = {
      name: data.name,
      type: data.type,
      hsnCode: data.hsnCode || null,
      sacCode: data.sacCode || null,
      categoryId: category?.id && category.id > 0 ? category.id : null,
      unit: data.unit || "nos",
      description: data.description || null,
      minStockThreshold:
        data.type === "STOCK" && data.minStockThreshold ? data.minStockThreshold : null,
      isTaxable: data.isTaxable,
      taxType: data.taxType,
      cgstRate: data.cgstRate || "0",
      sgstRate: data.sgstRate || "0",
      igstRate: data.igstRate || "0",
      otherTaxName: data.otherTaxName || null,
      otherTaxRate: data.otherTaxRate || "0",
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        showSuccessToast("Item updated");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccessToast("Item created");
      }
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, isEdit ? "Failed to update item" : "Failed to create item");
    }
  };

  const productType = watch("type");
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{isEdit ? "Edit Item" : "New Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Details */}
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input {...register("name")} placeholder="Item or service name" />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select
                      value={productType}
                      onValueChange={(v) => setValue("type", v as "STOCK" | "SERVICE")}
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
                  <Label>Category</Label>
                  <CategoryCombobox
                    value={category}
                    onValueChange={setCategory}
                    categories={categories}
                    categoriesLoading={categoriesLoading}
                    onCreateCategory={handleCreateCategory}
                    placeholder="Search or add category..."
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={watch("unit") || "nos"}
                      onValueChange={(v) => setValue("unit", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                        {item?.unit && !UNIT_OPTIONS.some((o) => o.value === item.unit) && (
                          <SelectItem value={item.unit}>{item.unit}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {productType === "STOCK" && (
                    <div className="space-y-2">
                      <Label>Min stock alert</Label>
                      <Input {...register("minStockThreshold")} placeholder="e.g. 10" />
                      <p className="text-xs text-muted-foreground">
                        Alert when below this. Empty = no alert.
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea rows={2} {...register("description")} placeholder="Optional" />
                </div>
              </section>

              {/* Classification */}
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Classification</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>HSN Code</Label>
                    <Input maxLength={8} {...register("hsnCode")} placeholder="e.g. 998314" />
                  </div>
                  <div className="space-y-2">
                    <Label>SAC Code</Label>
                    <Input maxLength={6} {...register("sacCode")} placeholder="e.g. 998313" />
                  </div>
                </div>
              </section>

              {/* Tax */}
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Tax</h3>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isTaxable"
                    checked={watch("isTaxable")}
                    onCheckedChange={(v) => setValue("isTaxable", !!v)}
                  />
                  <Label htmlFor="isTaxable" className="cursor-pointer font-normal">
                    Taxable
                  </Label>
                </div>
                {watch("isTaxable") && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tax type</Label>
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
                    </div>
                    {watch("taxType") === "GST" ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">CGST %</Label>
                          <Input placeholder="9" {...register("cgstRate")} />
                          {errors.cgstRate && (
                            <p className="text-xs text-destructive">{errors.cgstRate.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">SGST %</Label>
                          <Input placeholder="9" {...register("sgstRate")} />
                          {errors.sgstRate && (
                            <p className="text-xs text-destructive">{errors.sgstRate.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">IGST %</Label>
                          <Input placeholder="18" {...register("igstRate")} />
                          {errors.igstRate && (
                            <p className="text-xs text-destructive">{errors.igstRate.message}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Other tax name</Label>
                          <Input
                            maxLength={100}
                            placeholder="e.g. VAT"
                            {...register("otherTaxName")}
                          />
                          {errors.otherTaxName && (
                            <p className="text-xs text-destructive">
                              {errors.otherTaxName.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Rate %</Label>
                          <Input placeholder="0" {...register("otherTaxRate")} />
                          {errors.otherTaxRate && (
                            <p className="text-xs text-destructive">
                              {errors.otherTaxRate.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
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
    </Dialog>
  );
}
