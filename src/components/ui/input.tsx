import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white shadow-sm transition-all duration-300",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
          "placeholder:text-white/30",
          "focus:border-white/20 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Premium textarea component
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white shadow-sm transition-all duration-300",
          "placeholder:text-white/30",
          "focus:border-white/20 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

// Search input with icon
interface SearchInputProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
            {icon}
          </div>
        )}
        <input
          type="search"
          className={cn(
            "flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] pr-4 py-2 text-sm text-white shadow-sm transition-all duration-300",
            icon ? "pl-11" : "pl-4",
            "placeholder:text-white/30",
            "focus:border-white/20 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { Input, Textarea, SearchInput }
