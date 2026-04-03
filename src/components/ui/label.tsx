import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

export interface LabelProps
  extends
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  /** Shows a red asterisk after the label (mandatory field). */
  required?: boolean;
}

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props}>
      {children}
      {required ? (
        <span className="text-destructive" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
    </LabelPrimitive.Root>
  ),
);
Label.displayName = LabelPrimitive.Root.displayName;

/** Validation / server error below a field — use with inputs that have aria-invalid. */
export function FieldError({ id, className, ...props }: React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      id={id}
      role="alert"
      className={cn("mt-1.5 text-xs text-destructive", className)}
      {...props}
    />
  );
}

export { Label };
