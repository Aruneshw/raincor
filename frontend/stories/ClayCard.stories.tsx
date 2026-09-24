import type { Meta, StoryObj } from "@storybook/react";
import { ClayCard } from "@/components/ui/clay-card";

const meta: Meta<typeof ClayCard> = {
  title: "Claymorphism/ClayCard",
  component: ClayCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ClayCard>;

export const Default: Story = {
  args: {
    variant: "default",
    children: (
      <div>
        <h4 className="font-bold text-navy text-sm">Default Clay Card</h4>
        <p className="text-xs text-slate-500 mt-1">Soft 3D depth, white glass surface, soft drop shadow.</p>
      </div>
    ),
  },
};

export const Interactive: Story = {
  args: {
    variant: "interactive",
    children: (
      <div>
        <h4 className="font-bold text-navy text-sm">Interactive Hover Card</h4>
        <p className="text-xs text-slate-500 mt-1">Hover over this card to observe the clay elevation lift.</p>
      </div>
    ),
  },
};

export const Inset: Story = {
  args: {
    variant: "inset",
    children: (
      <div>
        <h4 className="font-bold text-navy text-sm">Inset Clay Well</h4>
        <p className="text-xs text-slate-500 mt-1">Soft inner shadow well for embedded telemetry and controls.</p>
      </div>
    ),
  },
};
