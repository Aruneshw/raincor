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
    primary: "bg-[#EAF5FF] text-[#2F80D9] border-blue-200/60",
    success: "bg-[#E8F8F0] text-[#1E8A5A] border-emerald-200/60",
    warning: "bg-[#FEF6E8] text-[#D98218] border-amber-200/60",
    danger: "bg-[#FDF0F0] text-[#D83838] border-rose-200/60",
    purple: "bg-[#F3F0FA] text-[#6958CD] border-purple-200/60",
    neutral: "bg-[#F1F5F9] text-[#475569] border-slate-200/60",
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
        "inline-flex items-center gap-1.5 rounded-full border shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dotColors[variant])} />}
      {children}
    </span>
  );
};
