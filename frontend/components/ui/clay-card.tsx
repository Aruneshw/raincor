import React from "react";
import { cn } from "@/lib/utils";

export interface ClayCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "inset" | "panel";
  children: React.ReactNode;
}

export const ClayCard = React.forwardRef<HTMLDivElement, ClayCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variantClasses = {
      default: "clay-card p-5",
      interactive: "clay-card-interactive p-5 cursor-pointer",
      inset: "clay-inset p-4",
      panel: "clay-panel p-6",
    };

    return (
      <div
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ClayCard.displayName = "ClayCard";
