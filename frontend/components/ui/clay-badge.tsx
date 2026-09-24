import React from "react";
import { cn } from "@/lib/utils";

export interface ClayBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "danger" | "purple" | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
  children: React.ReactNode;
}

export const ClayBadge: React.FC<ClayBadgeProps> = ({
  className,
  variant = "primary",
  size = "sm",
  dot = false,
  children,
  ...props
}) => {
  const variantStyles = {
    primary:
      "bg-[#EAF5FF] dark:bg-blue-950/60 text-[#2F80D9] dark:text-sky-400 border-blue-200/60 dark:border-blue-800/60",
    success:
      "bg-[#E8F8F0] dark:bg-emerald-950/60 text-[#1E8A5A] dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60",
    warning:
      "bg-[#FEF6E8] dark:bg-amber-950/60 text-[#D98218] dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60",
    danger:
      "bg-[#FDF0F0] dark:bg-rose-950/60 text-[#D83838] dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60",
    purple:
      "bg-[#F3F0FA] dark:bg-purple-950/60 text-[#6958CD] dark:text-purple-400 border-purple-200/60 dark:border-purple-800/60",
    neutral:
      "bg-[#F1F5F9] dark:bg-slate-800/90 text-[#475569] dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60",
  };

  const dotColors = {
    primary: "bg-[#2F80D9]",
    success: "bg-[#22A06B]",
    warning: "bg-[#F2A93B]",
    danger: "bg-[#E05252]",
    purple: "bg-[#7566D8]",
    neutral: "bg-[#64748B]",
  };

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs font-medium",
    md: "px-3 py-1 text-xs font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-none",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dotColors[variant])} />
      )}
      {children}
    </span>
  );
};
