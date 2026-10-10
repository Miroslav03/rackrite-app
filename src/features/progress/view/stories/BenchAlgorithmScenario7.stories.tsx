import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Algorithm scenarios/Bench/Scenario 7",
  id: "progress-algorithm-scenarios-scenario-7",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Week1Heavy: Story = createProgressStory(
  "bench-scenario-7-week-1-day-1",
);
export const Week2Heavy: Story = createProgressStory(
  "bench-scenario-7-week-2-day-1",
);
export const Week3Heavy: Story = createProgressStory(
  "bench-scenario-7-week-3-day-1",
);
export const Week4Heavy: Story = createProgressStory(
  "bench-scenario-7-week-4-day-1",
);
export const Week5Heavy: Story = createProgressStory(
  "bench-scenario-7-week-5-day-1",
);
export const Week6Heavy: Story = createProgressStory(
  "bench-scenario-7-week-6-day-1",
);
export const Week7Heavy: Story = createProgressStory(
  "bench-scenario-7-week-7-day-1",
);
export const Week8Heavy: Story = createProgressStory(
  "bench-scenario-7-week-8-day-1",
);
