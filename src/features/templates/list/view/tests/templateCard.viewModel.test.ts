import type { TemplateListItem } from "@/domain/templates/list/templates.types";

import { createTemplateCardViewModel } from "../templateCard.viewModel";

const template: TemplateListItem = {
  id: "bench",
  name: "Bench Volume Day",
  description: null,
  competitionLifts: [
    { id: "bench", name: "Competition Bench", liftFamily: "bench" },
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
])("labels the completion day relative to September %i", (day, relativeDay) => {
  expect(
    createTemplateCardViewModel(template, new Date(2026, 8, day).getTime()),
  ).toEqual({
    name: "Bench Volume Day",
    description: null,
    liftBadges: [{ id: "bench", label: "Competition Bench" }],
    lastExecution: { relativeDay, duration: "75 min" },
  });
});

it("keeps missing execution data empty", () => {
  expect(
    createTemplateCardViewModel(
      { ...template, lastExecution: null },
      Date.now(),
    ).lastExecution,
  ).toBeNull();
});
