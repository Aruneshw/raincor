"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CloudRain,
  Wind,
  Activity,
  Eye,
  CheckCircle2,
  CalendarDays,
  Database,
  Sliders,
  Settings,
  CloudLightning,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAVIGATION: NavSection[] = [
  {
    items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "FORECAST",
    items: [
      { name: "Rainfall Forecast", href: "/forecast", icon: CloudRain },
      { name: "Regime Analysis", href: "/regime", icon: Wind },
      { name: "Transition Monitor", href: "/transition", icon: Activity, badge: "Hot" },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { name: "Uncertainty", href: "/uncertainty", icon: Eye },
      { name: "Verification", href: "/verification", icon: CheckCircle2 },
      { name: "Climatology", href: "/climatology", icon: CalendarDays },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Data Monitor", href: "/data-monitor", icon: Database, badge: "Live" },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col bg-white border-r border-slate-200/80 shadow-[inset_-1px_0_0_rgba(11,42,74,0.03)] z-40 select-none">
      {/* Brand Header */}
      <div className="p-5 pb-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-blue to-navy flex items-center justify-center text-white shadow-clay-button">
          <CloudLightning className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-navy">RAINCOR</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-100 text-brand-blue font-bold">
              v0.1
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 -mt-0.5">
            Monsoon Intelligence for India
          </p>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {NAVIGATION.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group",
                    isActive
                      ? "clay-sidebar-item-active"
                      : "text-slate-600 hover:text-navy hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive ? "text-brand-blue" : "text-slate-400 group-hover:text-navy"
                      )}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "px-1.5 py-0.5 text-[10px] font-semibold rounded-md",
                        item.badge === "Live"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-purple-100 text-purple-700"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="text-[11px] font-semibold text-navy">
          Rainforest Operational Engine
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          MoES / NCMRWF / IMD Standards
        </div>
      </div>
    </aside>
  );
};
