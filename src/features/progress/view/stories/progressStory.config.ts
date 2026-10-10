import type { Meta, StoryObj } from "@storybook/react-native";

import { ProgressStoryHost } from "./ProgressStoryHost";
import { progressStoryScenarios } from "./progressStory.scenarios";

export const progressStoryMeta = {
  component: ProgressStoryHost,
  args: { initialLift: "bench" },
  argTypes: {
    scenario: { control: false, table: { disable: true } },
    initialLift: { control: "radio", options: ["squat", "bench", "deadlift"] },
    onSelectLift: { action: "Selected lift" },
    onRefresh: { action: "Completed simulated refresh" },
  },
  parameters: {
    layout: "fullscreen",
    noSafeArea: true,
    controls: { include: ["initialLift"] },
  },
} satisfies Meta<typeof ProgressStoryHost>;

export function createProgressStory(
  id: string,
): StoryObj<typeof progressStoryMeta> {
  const scenario = progressStoryScenarios.find((entry) => entry.id === id);

  if (!scenario) throw new Error(`Unknown Progress story: ${id}`);

  return {
    name: scenario.title,
    args: { scenario },
    parameters: { notes: scenario.description },
  };
}
