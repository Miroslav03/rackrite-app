import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { progressStoryScenarios } from "./progressStory.scenarios";

export const progressStoryMeta = {
  component: ProgressStoryHost,
  args: { initialLift: "bench" },
  argTypes: {
    scenario: { control: false, table: { disable: true } },
    initialLift: { control: "radio", options: ["squat", "bench", "deadlift"] },
    initialMetric: {
      control: "radio",
      options: ["performance", "e1rm", "volume"],
    },
    onSelectLift: { action: "Selected lift" },
    onSelectMetric: { action: "Selected metric" },
    onRefresh: { action: "Completed simulated refresh" },
  },
  parameters: {
    layout: "fullscreen",
    noSafeArea: true,
    controls: { include: ["initialLift", "initialMetric"] },
  },
} satisfies Meta<typeof ProgressStoryHost>;

export function createProgressStory(
  id: string,
): StoryObj<typeof progressStoryMeta> {
  const scenario = progressStoryScenarios.find((entry) => entry.id === id);

  if (!scenario) throw new Error(`Unknown Progress story: ${id}`);

  return {
    name: scenario.title,
    args: { scenario, initialMetric: scenario.metric ?? "performance" },
    parameters: { notes: scenario.description },
  };
}
