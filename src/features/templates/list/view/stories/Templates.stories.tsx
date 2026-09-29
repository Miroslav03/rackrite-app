import type { Meta, StoryObj } from "@storybook/react-native";

import type { TemplateListItem } from "@/domain/templates/list/templates.types";

import { TemplatesScreenView } from "../TemplatesScreenView";

const dateReference = new Date(2026, 8, 24).getTime();

const exercises: TemplateListItem["exercises"] = [
  {
    id: "squat",
    name: "Competition Squat",
    setTypes: ["warmup", "working", "top", "backoff"],
  },
  { id: "bench", name: "Competition Bench", setTypes: ["working", "top"] },
  {
    id: "deadlift",
    name: "Competition Deadlift",
    setTypes: ["warmup", "working"],
  },
];

const items: TemplateListItem[] = [
  {
    id: "bench",
    name: "Bench Volume Day",
    description: "Targeting chest hypertrophy and lock-out speed.",
    exercises,
    lastExecution: {
      finishedAt: new Date(2026, 8, 22, 19).getTime(),
      durationMinutes: 75,
    },
  },
  {
    id: "squat",
    name: "Heavy Squat Day",
    description: "Main focus on CNS adaptation and 1RM peaking.",
    exercises: exercises.slice(0, 2),
    lastExecution: {
      finishedAt: new Date(2026, 8, 19, 19).getTime(),
      durationMinutes: 90,
    },
  },
  {
    id: "new",
    name: "Deadlift Technique",
    description: "A fresh template with no previous execution.",
    exercises: exercises.slice(2),
    lastExecution: null,
  },
  {
    id: "long",
    name: "Long competition training day with extra posterior chain work",
    description:
      "A longer coaching description that should wrap naturally and remain fully readable on smaller screens and with larger text sizes.",
    exercises,
    lastExecution: { finishedAt: dateReference, durationMinutes: 0 },
  },
  {
    id: "accessories",
    name: "Accessories",
    description: null,
    exercises: [
      { id: "row", name: "Barbell Row", setTypes: ["working"] },
      {
        id: "long-accessory",
        name: "Single-arm overhead cable triceps extension with a pause",
        setTypes: ["warmup", "working", "backoff"],
      },
    ],
    lastExecution: null,
  },
];

const meta = {
  title: "Templates/List",
  component: TemplatesScreenView,
  args: {
    state: {
      status: "ready",
      items,
      refresh: { status: "idle" },
      revision: 1,
    },
    dateReference,
    onRefresh: () => {},
    onCreateTemplate: () => {},
    onOpenTemplate: () => {},
  },
} satisfies Meta<typeof TemplatesScreenView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LedgerCards: Story = {};
export const EmptyLibrary: Story = {
  args: {
    state: {
      status: "ready",
      items: [],
      refresh: { status: "idle" },
      revision: 1,
    },
  },
};
export const RefreshError: Story = {
  args: {
    state: {
      status: "ready",
      items,
      refresh: {
        status: "error",
        error: new Error("Simulated database failure"),
      },
      revision: 1,
    },
  },
};
