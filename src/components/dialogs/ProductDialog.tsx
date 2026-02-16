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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { priceString, hsnCode, sacCode, optionalString } from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import type { Product } from "@/types/product";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(["STOCK", "SERVICE"]),
  hsnCode,
  sacCode,
  unit: optionalString,
  description: optionalString,
  sellingPrice: priceString,
  purchasePrice: priceString,
  cgstRate: priceString,
  sgstRate: priceString,
  igstRate: priceString,
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export default function ProductDialog({ open, onOpenChange, product }: Props) {
  const isEdit = !!product;
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(product?.id ?? 0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "STOCK" },
  });

  const productType = watch("type");

  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          name: product.name,
          type: product.type,
          hsnCode: product.hsnCode ?? "",
          sacCode: product.sacCode ?? "",
          unit: product.unit ?? "",
          description: product.description ?? "",
          sellingPrice: product.sellingPrice ?? "",
          purchasePrice: product.purchasePrice ?? "",
          cgstRate: product.cgstRate ?? "",
          sgstRate: product.sgstRate ?? "",
          igstRate: product.igstRate ?? "",
        });
      } else {
        reset({
          name: "",
          type: "STOCK",
          unit: "",
          hsnCode: "",
          sacCode: "",
          description: "",
          sellingPrice: "",
          purchasePrice: "",
          cgstRate: "",
          sgstRate: "",
          igstRate: "",
        });
      }
    }
  }, [open, product, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name,
      type: data.type,
      hsnCode: data.hsnCode || undefined,
      sacCode: data.sacCode || undefined,
      unit: data.unit || undefined,
      description: data.description || undefined,
      sellingPrice: data.sellingPrice || undefined,
      purchasePrice: data.purchasePrice || undefined,
      cgstRate: data.cgstRate || undefined,
      sgstRate: data.sgstRate || undefined,
      igstRate: data.igstRate || undefined,
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        showSuccessToast("Product updated");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccessToast("Product created");
      }
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, isEdit ? "Failed to update product" : "Failed to create product");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>HSN Code</Label>
              <Input maxLength={8} {...register("hsnCode")} />
            </div>
            <div className="space-y-2">
              <Label>SAC Code</Label>
              <Input maxLength={6} {...register("sacCode")} />
            </div>
          </div>

          {productType === "STOCK" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input placeholder="nos" {...register("unit")} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={1} {...register("description")} />
              </div>
            </div>
          )}

          {productType === "SERVICE" && (
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={2} {...register("description")} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Selling Price</Label>
              <Input placeholder="999.99" {...register("sellingPrice")} />
              {errors.sellingPrice && (
                <p className="text-xs text-destructive">{errors.sellingPrice.message}</p>
              )}
            </div>
            {productType === "STOCK" && (
              <div className="space-y-2">
                <Label>Purchase Price</Label>
                <Input placeholder="499.99" {...register("purchasePrice")} />
                {errors.purchasePrice && (
                  <p className="text-xs text-destructive">{errors.purchasePrice.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>CGST %</Label>
              <Input placeholder="9" {...register("cgstRate")} />
              {errors.cgstRate && (
                <p className="text-xs text-destructive">{errors.cgstRate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>SGST %</Label>
              <Input placeholder="9" {...register("sgstRate")} />
              {errors.sgstRate && (
                <p className="text-xs text-destructive">{errors.sgstRate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>IGST %</Label>
              <Input placeholder="18" {...register("igstRate")} />
              {errors.igstRate && (
                <p className="text-xs text-destructive">{errors.igstRate.message}</p>
              )}
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
