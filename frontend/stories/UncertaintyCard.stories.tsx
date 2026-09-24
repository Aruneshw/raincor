import type { Meta, StoryObj } from "@storybook/react";
import { UncertaintyCard } from "@/components/cards/uncertainty-card";

const meta: Meta<typeof UncertaintyCard> = {
  title: "Cards/UncertaintyCard",
  component: UncertaintyCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof UncertaintyCard>;

export const HighConfidence: Story = {
  args: {
    p10: 38.0,
    p50: 92.0,
    p90: 156.0,
    entropy: 0.34,
    confidence: "High",
  },
};

export const ModerateConfidence: Story = {
  args: {
    p10: 14.0,
    p50: 45.0,
    p90: 110.0,
    entropy: 0.58,
    confidence: "Medium",
  },
};

export const LowConfidence: Story = {
  args: {
    p10: 5.0,
    p50: 60.0,
    p90: 195.0,
    entropy: 0.82,
    confidence: "Low",
  },
};
