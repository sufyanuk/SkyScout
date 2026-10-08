import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]",
        sunrise: "bg-sunrise text-white shadow-sm hover:bg-sunrise/90 active:scale-[0.98]",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-card hover:bg-muted hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "rounded-md text-primary underline-offset-4 hover:underline",
        dark: "bg-foreground text-white hover:bg-foreground/90 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 gap-1.5 px-3.5 text-[13px]",
        lg: "h-12 px-7 text-base",
        xl: "h-14 px-8 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
