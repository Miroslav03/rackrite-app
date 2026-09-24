import type { TemplateListRecord } from "../templates.types";
import { summarizeTemplateListItem } from "../templates.utils";

const record: TemplateListRecord = {
  id: "template_1",
  name: "Bench day",
  description: null,
  competitionLifts: [
    { id: "bench", name: "Competition Bench", liftFamily: "bench" },
  ],
  lastExecution: null,
};

it("preserves empty execution data without inventing a duration", () => {
  expect(summarizeTemplateListItem(record)).toEqual(record);
});

it.each([
  [75 * 60_000 + 59_000, 75],
  [59_000, 0],
])(
  "uses the existing whole-minute duration rule for %i milliseconds",
  (elapsed, minutes) => {
    const startedAt = new Date(2026, 8, 23, 23, 30).getTime();
    const lastExecution = Object.freeze({
      startedAt,
      finishedAt: startedAt + elapsed,
    });
    const input = Object.freeze({ ...record, lastExecution });

    expect(summarizeTemplateListItem(input)).toEqual({
      ...record,
      lastExecution: {
        finishedAt: startedAt + elapsed,
        durationMinutes: minutes,
      },
    });
    expect(input.lastExecution).toBe(lastExecution);
  },
);
