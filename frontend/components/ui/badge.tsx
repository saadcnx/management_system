import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "muted"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        {
          "bg-primary text-primary-foreground": variant === "default",
          "bg-success/10 text-success": variant === "success",
          "bg-muted text-muted-foreground": variant === "muted",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }