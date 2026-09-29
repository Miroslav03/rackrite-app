import type { TemplateListItem } from "@/domain/templates/list/templates.types";

import { createTemplateCardViewModel } from "../templateCard.viewModel";

const template: TemplateListItem = {
  id: "bench",
  name: "Bench Volume Day",
  description: null,
  exercises: [
    {
      id: "bench",
      name: "Competition Bench",
      setTypes: ["working", "top"],
    },
  ],
  lastExecution: {
    finishedAt: new Date(2026, 8, 24, 0, 45).getTime(),
    durationMinutes: 75,
  },
};

it.each([
  [24, "Today"],
  [25, "Yesterday"],
  [28, "4 days ago"],
])(
  "labels the completion day relative to September %i",
  (day, relativeDay) => {
    expect(
      createTemplateCardViewModel(
        template,
        new Date(2026, 8, day).getTime(),
      ),
    ).toEqual({
      name: "Bench Volume Day",
      description: null,
      exercises: [
        {
          id: "bench",
          name: "Competition Bench",
          setBadges: [
            { type: "working", label: "Working" },
            { type: "top", label: "Top" },
          ],
        },
      ],
      lastExecution: { relativeDay, duration: "75 min" },
    });
  },
);

it("keeps missing execution data empty", () => {
  expect(
    createTemplateCardViewModel(
      { ...template, lastExecution: null },
      Date.now(),
    ).lastExecution,
  ).toBeNull();
});

it("preserves exercise order and shows each planned set type once in badge order", () => {
  const card = createTemplateCardViewModel(
    {
      ...template,
      exercises: [
        {
          id: "row",
          name: "Barbell Row",
          setTypes: ["backoff", "top", "working", "warmup", "working"],
        },
        {
          id: "paused-bench",
          name: "Paused Bench",
          setTypes: ["working"],
        },
      ],
    },
    Date.now(),
  );

  expect(card.exercises).toEqual([
    {
      id: "row",
      name: "Barbell Row",
      setBadges: [
        { type: "warmup", label: "Warm-up" },
        { type: "working", label: "Working" },
        { type: "top", label: "Top" },
        { type: "backoff", label: "Backoff" },
      ],
    },
    {
      id: "paused-bench",
      name: "Paused Bench",
      setBadges: [{ type: "working", label: "Working" }],
    },
  ]);
});

it("preserves exercises without sets and handles an empty exercise list", () => {
  expect(
    createTemplateCardViewModel(
      {
        ...template,
        exercises: [{ id: "row", name: "Row", setTypes: [] }],
      },
      Date.now(),
    ).exercises,
  ).toEqual([{ id: "row", name: "Row", setBadges: [] }]);
  expect(
    createTemplateCardViewModel({ ...template, exercises: [] }, Date.now())
      .exercises,
  ).toEqual([]);
});
