import { loadProgressOverview } from "../loadProgressOverview";

import { atDay, exposure } from "@/domain/progress/tests/progress.test.helpers";

import {
  addLocalCalendarDays,
  startOfLocalDay,
} from "@/shared/utils/localCalendar";

it("loads a single bounded snapshot for all three lifts", async () => {
  const analysisTime = atDay(50);
  const repository = {
    getCompletedCompetitionLiftHistory: jest.fn(async () => [
      exposure(48),
      exposure(45, { family: "squat" }),
    ]),
  };
  const overview = await loadProgressOverview({ repository }, analysisTime);

  expect(repository.getCompletedCompetitionLiftHistory).toHaveBeenCalledTimes(
    1,
  );
  expect(repository.getCompletedCompetitionLiftHistory).toHaveBeenCalledWith({
    fromFinishedAt: addLocalCalendarDays(startOfLocalDay(analysisTime), -168),
    throughFinishedAt: analysisTime,
  });
  expect(Object.keys(overview.lifts)).toEqual(["squat", "bench", "deadlift"]);
  expect(overview.lifts.bench.analysisTime).toBe(analysisTime);
  expect(overview.lifts.squat.sessions).toHaveLength(1);
});

it("rejects invalid analysis time and propagates database failure", async () => {
  const repository = {
    getCompletedCompetitionLiftHistory: jest
      .fn()
      .mockRejectedValue(new Error("SQLite failure")),
  };

  await expect(loadProgressOverview({ repository }, NaN)).rejects.toThrow(
    "analysis time",
  );
  expect(repository.getCompletedCompetitionLiftHistory).not.toHaveBeenCalled();
  await expect(loadProgressOverview({ repository }, atDay(0))).rejects.toThrow(
    "SQLite failure",
  );
});
