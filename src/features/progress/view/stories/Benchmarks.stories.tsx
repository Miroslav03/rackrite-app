import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Benchmarks",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProgressWithRPE: Story = createProgressStory(
  "benchmark-progress-with-rpe",
);
export const RepeatWithRPE: Story = createProgressStory(
  "benchmark-repeat-with-rpe",
);
export const RepeatOffGridWithoutRPE: Story = createProgressStory(
  "benchmark-repeat-off-grid-without-rpe",
);
export const ReduceStressWithRPE: Story = createProgressStory(
  "benchmark-reduce-stress-with-rpe",
);
export const ReduceStressWithoutRPE: Story = createProgressStory(
  "benchmark-reduce-stress-without-rpe",
);
