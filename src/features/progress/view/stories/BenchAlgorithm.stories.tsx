import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Algorithm scenarios/Bench/Scenario 1",
  id: "progress-algorithm-scenarios-scenario-1",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Week1Heavy: Story = createProgressStory(
  "bench-scenario-1-week-1-day-1",
);
export const Week1Volume: Story = createProgressStory(
  "bench-scenario-1-week-1-day-2",
);
export const Week2Heavy: Story = createProgressStory(
  "bench-scenario-1-week-2-day-1",
);
export const Week2Volume: Story = createProgressStory(
  "bench-scenario-1-week-2-day-2",
);
export const Week3Heavy: Story = createProgressStory(
  "bench-scenario-1-week-3-day-1",
);
export const Week3Volume: Story = createProgressStory(
  "bench-scenario-1-week-3-day-2",
);
export const Week4Heavy: Story = createProgressStory(
  "bench-scenario-1-week-4-day-1",
);
export const Week4Volume: Story = createProgressStory(
  "bench-scenario-1-week-4-day-2",
);
export const Week5Heavy: Story = createProgressStory(
  "bench-scenario-1-week-5-day-1",
);
export const Week5Volume: Story = createProgressStory(
  "bench-scenario-1-week-5-day-2",
);
export const Week6Heavy: Story = createProgressStory(
  "bench-scenario-1-week-6-day-1",
);
export const Week6Volume: Story = createProgressStory(
  "bench-scenario-1-week-6-day-2",
);
export const Week7Heavy: Story = createProgressStory(
  "bench-scenario-1-week-7-day-1",
);
export const Week7Volume: Story = createProgressStory(
  "bench-scenario-1-week-7-day-2",
);
export const Week8Heavy: Story = createProgressStory(
  "bench-scenario-1-week-8-day-1",
);
export const Week8Volume: Story = createProgressStory(
  "bench-scenario-1-week-8-day-2",
);
