import { selectHistoryWorkoutDetails } from "@/domain/history/history.utils";
import { createCompletedWorkoutWithMixedSets } from "@/domain/workout/tests/workout.test.helpers";

import { createHistoryDetailsViewModel } from "../historyDetails.viewModel";

it("formats the history metrics, exercise kind, and consecutive set numbers", () => {
  const details = selectHistoryWorkoutDetails(
    createCompletedWorkoutWithMixedSets(),
  );
  details.startedAt = new Date(2026, 8, 7, 12).getTime();
  const view = createHistoryDetailsViewModel(details);
  expect(view).toMatchObject({
    name: "Template Workout",
    date: "SEP 7, 2026",
    duration: "3 MIN",
    totalVolume: "1,050",
    totalSets: "4",
    averageRpe: "8.5",
  });
  expect(view.exercises[0].kind).toBe("Competition Lift");
  expect(view.exercises[0].sets.map(({ number }) => number)).toEqual([
    "01",
    "02",
    "03",
    "04",
  ]);
  expect(view.exercises[0].sets[3].rpe).toBe("—");
  details.averageRpe = null;
  expect(createHistoryDetailsViewModel(details).averageRpe).toBe("—");
});
