import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Diagnosis",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const None: Story = createProgressStory("diagnosis-none");
export const Fatigue: Story = createProgressStory("diagnosis-fatigue");
export const ExcessiveIntensity: Story = createProgressStory(
  "diagnosis-excessive_intensity",
);
export const InsufficientStimulus: Story = createProgressStory(
  "diagnosis-insufficient_stimulus",
);
export const InconsistentTraining: Story = createProgressStory(
  "diagnosis-inconsistent_training",
);
export const InsufficientEvidence: Story = createProgressStory(
  "diagnosis-insufficient_evidence",
);
