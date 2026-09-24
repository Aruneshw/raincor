import type { Meta, StoryObj } from "@storybook/react";
import { KpiCard } from "@/components/cards/kpi-card";
import { CloudRain, AlertTriangle, Activity, ShieldCheck } from "lucide-react";

const meta: Meta<typeof KpiCard> = {
  title: "Cards/KpiCard",
  component: KpiCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof KpiCard>;

export const TotalRainfall: Story = {
  args: {
    title: "Total Rainfall (24h)",
    value: "124.6",
    unit: "mm",
    change: { value: "+18.2%", isPositive: true, label: "vs 30y Normal" },
    icon: CloudRain,
    iconColor: "text-brand-blue",
  },
};

export const HeavyRainGrids: Story = {
  args: {
    title: "Heavy Rain Grids",
    value: "1,238",
    unit: "cells",
    change: { value: "+8.4%", isPositive: true, label: "exceeding 64.5 mm" },
    icon: AlertTriangle,
    iconColor: "text-weather-warning",
  },
};

export const TransitioningGrids: Story = {
  args: {
    title: "Transitioning Grids",
    value: "417",
    unit: "cells",
    change: { value: "24.6%", isPositive: true, label: "active regime shift" },
    icon: Activity,
    iconColor: "text-weather-purple",
  },
};

export const ModelSkill: Story = {
  args: {
    title: "Model Skill (CSI @ 64mm)",
    value: "0.62",
    change: { value: "+0.14", isPositive: true, label: "gain over raw NWP" },
    icon: ShieldCheck,
    iconColor: "text-weather-success",
  },
};
