import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Unavailable measurements",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoHistory: Story = createProgressStory("missing-no_history");
export const NoEligibleSets: Story = createProgressStory(
  "missing-no_performance",
);
export const InsufficientHistory: Story = createProgressStory(
  "missing-insufficient_history",
);
export const MissingRPE: Story = createProgressStory("missing-missing_rpe");
export const PartialRPE: Story = createProgressStory("missing-partial_rpe");
export const InvalidBaseline: Story = createProgressStory(
  "missing-invalid_baseline",
);
export const IncompleteWeeks: Story = createProgressStory(
  "missing-incomplete_period",
);
