import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Learning explanations",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoHistory: Story = createProgressStory("learning-no_history");
export const NoEligibleSets: Story = createProgressStory(
  "learning-no_performance",
);
export const TooFewComparableDays: Story = createProgressStory(
  "learning-insufficient_history",
);
export const StaleHistory: Story = createProgressStory(
  "learning-stale_history",
);
export const RestartAfterAGap: Story = createProgressStory(
  "learning-training_gap",
);
export const IdentityConflict: Story = createProgressStory(
  "learning-ambiguous_identity",
);
export const ConflictingSignals: Story = createProgressStory(
  "learning-conflicting_signals",
);
export const WaitingForConfirmation: Story = createProgressStory(
  "learning-confirming_change",
);
export const LearningFallbackCopy: Story = createProgressStory(
  "learning-confirmed_trend",
);
