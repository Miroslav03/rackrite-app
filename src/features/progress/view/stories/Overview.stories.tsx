import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Overview",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DerivedSampleHistory: Story = createProgressStory("recorded");
export const EmptyHistory: Story = createProgressStory("empty");
export const EarlyEstimate: Story = createProgressStory("early");
