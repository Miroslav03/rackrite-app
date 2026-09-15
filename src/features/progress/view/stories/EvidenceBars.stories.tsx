import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Evidence bars",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NegativeAndClamped: Story = createProgressStory("bars--1");
export const ZeroNegativeZero: Story = createProgressStory("bars-0");
export const PositiveAndClamped: Story = createProgressStory("bars-1");
