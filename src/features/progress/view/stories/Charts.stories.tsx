import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Charts",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = createProgressStory("chart-empty");
export const SinglePoint: Story = createProgressStory("chart-single-point");
export const MissingWeeks: Story = createProgressStory("chart-missing-weeks");
export const EqualValues: Story = createProgressStory("chart-equal-values");
export const ZeroVolume: Story = createProgressStory("chart-zero-volume");
export const ExtremeValue: Story = createProgressStory("chart-extreme-value");
export const Rising: Story = createProgressStory("chart-rising");
export const Falling: Story = createProgressStory("chart-falling");
export const AdjustedWithMissingPoints: Story = createProgressStory("adjusted");
export const MissingComparisonBaseline: Story =
  createProgressStory("chart-no-baseline");
