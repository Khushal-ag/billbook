import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useCreateInvoice } from "@/hooks/use-invoices";
import { useParties } from "@/hooks/use-parties";
import { useProducts } from "@/hooks/use-products";
import ProductDialog from "./ProductDialog";
import {
  quantityString,
  priceString,
  requiredPriceString,
  percentString,
  dateString,
  optionalString,
} from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";

const itemSchema = z.object({
  productId: z.coerce.number().min(1, "Select a product"),
  quantity: quantityString(),
  unitPrice: requiredPriceString,
  discountPercent: percentString,
});

const schema = z.object({
  partyId: z.coerce.number().min(1, "Select a party"),
  invoiceDate: dateString,
  dueDate: optionalString,
  notes: optionalString,
  discountAmount: priceString,
  discountPercent: percentString,
  items: z.array(itemSchema).min(1, "At least one item is required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvoiceDialog({ open, onOpenChange }: Props) {
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const createMutation = useCreateInvoice();
  const { data: partiesData } = useParties();
  const { data: productsData } = useProducts();

  const parties = (partiesData?.parties ?? []).filter((p) => !p.deletedAt);
  const products = (productsData?.products ?? []).filter((p) => !p.deletedAt);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      partyId: 0,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      notes: "",
      discountAmount: "",
      discountPercent: "",
      items: [{ productId: 0, quantity: "1.00", unitPrice: "", discountPercent: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (open) {
      reset({
        partyId: 0,
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        notes: "",
        discountAmount: "",
        discountPercent: "",
        items: [{ productId: 0, quantity: "1.00", unitPrice: "", discountPercent: "" }],
      });
    }
  }, [open, reset]);

  const onProductChange = (index: number, productId: number) => {
    setValue(`items.${index}.productId`, productId);
    const prod = products.find((p) => p.id === productId);
    if (prod?.sellingPrice) setValue(`items.${index}.unitPrice`, prod.sellingPrice);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      partyId: data.partyId,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate || undefined,
      notes: data.notes || undefined,
      discountAmount: data.discountAmount || undefined,
      discountPercent: data.discountPercent || undefined,
      items: data.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountPercent: it.discountPercent || undefined,
      })),
    };
    try {
      await createMutation.mutateAsync(payload);
      showSuccessToast("Invoice created");
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, "Failed to create invoice");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Party *</Label>
                <Select
                  value={String(watch("partyId"))}
                  onValueChange={(v) => setValue("partyId", Number(v))}
                >
                  <SelectTrigger disabled={parties.length === 0}>
                    <SelectValue
                      placeholder={parties.length === 0 ? "No parties available" : "Select party"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No parties available. Create a party first.
                      </div>
                    ) : (
                      parties.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.partyId && (
                  <p className="text-xs text-destructive">{errors.partyId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Invoice Date *</Label>
                <Input type="date" {...register("invoiceDate")} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" {...register("dueDate")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Amount</Label>
                <Input placeholder="0.00" {...register("discountAmount")} />
              </div>
              <div className="space-y-2">
                <Label>Discount %</Label>
                <Input placeholder="0.00" {...register("discountPercent")} />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ productId: 0, quantity: "1.00", unitPrice: "", discountPercent: "" })
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Item
                </Button>
              </div>
              {errors.items?.root && (
                <p className="text-xs text-destructive">{errors.items.root.message}</p>
              )}
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-start gap-2 rounded-md border p-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Product</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1 text-xs"
                        onClick={() => setProductDialogOpen(true)}
                      >
                        <Plus className="mr-0.5 h-3 w-3" />
                        Add
                      </Button>
                    </div>
                    <Select
                      value={String(watch(`items.${idx}.productId`))}
                      onValueChange={(v) => onProductChange(idx, Number(v))}
                    >
                      <SelectTrigger className="h-8 text-xs" disabled={products.length === 0}>
                        <SelectValue
                          placeholder={products.length === 0 ? "No products" : "Select"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {products.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No products available. Create a product first.
                          </div>
                        ) : (
                          products.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.items?.[idx]?.productId && (
                      <p className="text-xs text-destructive">
                        {errors.items[idx].productId?.message}
                      </p>
                    )}
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input className="h-8 text-xs" {...register(`items.${idx}.quantity`)} />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input className="h-8 text-xs" {...register(`items.${idx}.unitPrice`)} />
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-xs">Disc %</Label>
                    <Input className="h-8 text-xs" {...register(`items.${idx}.discountPercent`)} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-5 h-8 w-8 p-0 text-destructive"
                    onClick={() => fields.length > 1 && remove(idx)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} {...register("notes")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ProductDialog open={productDialogOpen} onOpenChange={setProductDialogOpen} />
    </>
  );
}
