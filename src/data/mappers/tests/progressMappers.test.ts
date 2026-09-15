import { exposure } from "@/domain/progress/tests/progress.test.helpers";

import {
  rowsToCompetitionLiftHistory,
  type ProgressHistoryRow,
} from "../progressMappers";

const item = exposure(0);
const row: ProgressHistoryRow = {
  workout: item.workout,
  exercise: item.exercise,
  entry: item.entries[0].exercise,
  set: item.entries[0].sets[0],
};

it("preserves malformed set values for domain exclusion instead of throwing on unrelated invariants", () => {
  const bad = {
    ...row,
    set: { ...item.entries[0].sets[0], weight: -1, rpe: 7.5 },
  };
  const result = rowsToCompetitionLiftHistory([bad, row]);

  expect(result).toHaveLength(1);
  expect(result[0].entries[0].sets).toHaveLength(2);
  expect(result[0].entries[0].sets[0]).toMatchObject({ weight: -1, rpe: 7.5 });
});
