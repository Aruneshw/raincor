import React from "react";
import { cn } from "@/lib/utils";

export interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "subtle" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const ClayButton = React.forwardRef<HTMLButtonElement, ClayButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs font-medium rounded-lg",
      md: "px-4 py-2 text-sm font-semibold rounded-xl",
      lg: "px-5 py-2.5 text-base font-semibold rounded-xl",
    };

    const variantClasses = {
      primary: "clay-button-primary",
      secondary: "clay-button-secondary",
      subtle:
        "bg-brand-blue-light dark:bg-brand-blue/20 text-brand-blue dark:text-sky-300 hover:bg-blue-100 dark:hover:bg-brand-blue/30 font-medium",
      outline:
        "border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-navy dark:text-white font-medium",
      danger: "bg-weather-danger text-white shadow-sm hover:opacity-95 font-medium",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ClayButton.displayName = "ClayButton";
