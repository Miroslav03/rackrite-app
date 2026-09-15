import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Recommendations",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ContinueApproach: Story = createProgressStory(
  "action-continue_approach",
);
export const Monitor: Story = createProgressStory("action-monitor");
export const ReduceStress: Story = createProgressStory("action-reduce_stress");
export const ReviewStimulus: Story = createProgressStory(
  "action-review_stimulus",
);
export const RestoreConsistency: Story = createProgressStory(
  "action-restore_consistency",
);
export const GatherEvidence: Story = createProgressStory(
  "action-gather_evidence",
);
export const Reassess: Story = createProgressStory("action-reassess");
