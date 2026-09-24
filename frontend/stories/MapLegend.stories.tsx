import type { Meta, StoryObj } from "@storybook/react";
import { MapLegend } from "@/components/maps/map-legend";

const meta: Meta<typeof MapLegend> = {
  title: "Maps/MapLegend",
  component: MapLegend,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MapLegend>;

export const RainfallLegend: Story = {
  args: {
    layer: "rainfall",
  },
};

export const RegimeLegend: Story = {
  args: {
    layer: "regime",
  },
};

export const TransitionLegend: Story = {
  args: {
    layer: "transition",
  },
};

export const UncertaintyLegend: Story = {
  args: {
    layer: "uncertainty",
  },
};
