import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black hover:bg-white/90 shadow-sm",
        primary:
          "bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-sm",
        destructive:
          "bg-[#ff453a] text-white shadow-sm hover:bg-[#ff453a]/90",
        outline:
          "border border-white/20 bg-transparent hover:bg-white/5 hover:border-white/30",
        secondary:
          "bg-white/10 text-white shadow-sm hover:bg-white/15",
        ghost:
          "text-white/60 hover:text-white hover:bg-white/5",
        link:
          "text-[#0071e3] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm rounded-xl",
        sm: "h-9 px-4 text-sm rounded-lg",
        lg: "h-12 px-8 text-base rounded-xl",
        xl: "h-14 px-10 text-base rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
      rounded: {
        default: "",
        full: "rounded-full",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
