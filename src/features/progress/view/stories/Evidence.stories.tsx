import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Evidence",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WeakStatusEvidence: Story = createProgressStory("evidence-weak");
export const ModerateStatusEvidence: Story =
  createProgressStory("evidence-moderate");
export const StrongStatusEvidence: Story =
  createProgressStory("evidence-strong");
