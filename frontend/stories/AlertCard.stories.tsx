import type { Meta, StoryObj } from "@storybook/react";
import { AlertCard } from "@/components/cards/alert-card";

const meta: Meta<typeof AlertCard> = {
  title: "Cards/AlertCard",
  component: AlertCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AlertCard>;

export const HeavyRainfall: Story = {
  args: {
    alert: {
      id: "alt_1",
      type: "Heavy Rainfall",
      gridId: "G07123",
      location: "Assam / Kamrup",
      detail: "96.4 mm / 24h (Orographic)",
      timeAgo: "8m ago",
      severity: "high",
    },
  },
};

export const RegimeTransition: Story = {
  args: {
    alert: {
      id: "alt_2",
      type: "Regime Transition",
      gridId: "G10234",
      location: "Odisha / Puri",
      detail: "Active → Depression (Prob: 73%)",
      timeAgo: "14m ago",
      severity: "medium",
    },
  },
};

export const HighUncertainty: Story = {
  args: {
    alert: {
      id: "alt_3",
      type: "High Uncertainty",
      gridId: "G04567",
      location: "West Bengal / 24 Parganas",
      detail: "P10–P90: 18–142 mm (Entropy: 0.81)",
      timeAgo: "22m ago",
      severity: "high",
    },
  },
};
