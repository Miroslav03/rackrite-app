import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Lift status",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Learning: Story = createProgressStory("status-learning");
export const Progressing: Story = createProgressStory("status-progressing");
export const Stable: Story = createProgressStory("status-stable");
export const Stalling: Story = createProgressStory("status-stalling");
export const Plateaued: Story = createProgressStory("status-plateaued");
export const Regressing: Story = createProgressStory("status-regressing");
