import { createWorkoutWithAllSetsCompleted } from "@/domain/workout/tests/workout.test.helpers";
import { finishWorkout } from "@/domain/workout/workout.useCases";

import type { WorkoutHistoryRepository } from "@/data/repositories/historyRepository";
import type { HistoryCursor } from "@/domain/history/history.types";

import { loadHistoryOverview } from "../loadHistoryOverview";
import { loadHistoryPage } from "../loadHistoryPage";

function createRepository(): WorkoutHistoryRepository {
  return {
    getCompletedWorkoutPage: jest.fn(async () => ({
      workouts: [
        finishWorkout(createWorkoutWithAllSetsCompleted(), {
          now: 10_000,
          skipUnfinishedSets: false,
        }),
      ],
      nextCursor: null,
    })),
    getCompletedWorkoutCount: jest.fn(async () => 700),
  };
}

it("loads a bounded overview and returns summaries without retaining sets", async () => {
  const repository = createRepository();
  const overview = await loadHistoryOverview({ repository });
  expect(repository.getCompletedWorkoutPage).toHaveBeenCalledWith({
    limit: 50,
    cursor: null,
  });
  expect(overview.totalCount).toBe(700);
  expect(overview.page.items[0].exercises[0]).toEqual({
    id: "workout_exercise_1",
    name: "Competition Bench",
    totalSets: 2,
    setCounts: { warmup: 0, working: 2, top: 0, backoff: 0 },
    topSet: { weight: 100, reps: 5 },
  });
});

it.each([0, -1, 51, 1.5, Infinity, NaN])(
  "rejects unbounded/invalid page size %s",
  async (limit) => {
    const repository = createRepository();
    await expect(
      loadHistoryPage({ repository }, { limit, cursor: null }),
    ).rejects.toThrow("page size");
    expect(repository.getCompletedWorkoutPage).not.toHaveBeenCalled();
  },
);

it("forwards the cursor without fetching the global count again", async () => {
  const repository = createRepository();
  const cursor = { finishedAt: 1000, workoutId: "workout_50" };
  await loadHistoryPage({ repository }, { limit: 50, cursor });
  expect(repository.getCompletedWorkoutPage).toHaveBeenCalledWith({
    limit: 50,
    cursor,
  });
  expect(repository.getCompletedWorkoutCount).not.toHaveBeenCalled();
});

it.each<HistoryCursor>([
  { finishedAt: NaN, workoutId: "workout_50" },
  { finishedAt: Infinity, workoutId: "workout_50" },
  { finishedAt: 1000, workoutId: "" },
])("rejects an invalid cursor before reading persistence: %o", async (cursor) => {
  const repository = createRepository();
  await expect(
    loadHistoryPage({ repository }, { limit: 50, cursor }),
  ).rejects.toThrow("Invalid history cursor");
  expect(repository.getCompletedWorkoutPage).not.toHaveBeenCalled();
});

it("returns the repository's next cursor with the derived summaries", async () => {
  const repository = createRepository();
  const completedPage = await repository.getCompletedWorkoutPage({
    limit: 50,
    cursor: null,
  });
  const nextCursor = { finishedAt: 10_000, workoutId: "workout_50" };
  jest.mocked(repository.getCompletedWorkoutPage).mockResolvedValue({
    ...completedPage,
    nextCursor,
  });

  const page = await loadHistoryPage(
    { repository },
    { limit: 50, cursor: null },
  );

  expect(page.items).toHaveLength(1);
  expect(page.nextCursor).toEqual(nextCursor);
});

it("returns an empty overview when there are no completed workouts", async () => {
  const repository = createRepository();
  jest.mocked(repository.getCompletedWorkoutPage).mockResolvedValue({
    workouts: [],
    nextCursor: null,
  });
  jest.mocked(repository.getCompletedWorkoutCount).mockResolvedValue(0);

  await expect(loadHistoryOverview({ repository })).resolves.toEqual({
    page: { items: [], nextCursor: null },
    totalCount: 0,
  });
});

it.each(["getCompletedWorkoutPage", "getCompletedWorkoutCount"] as const)(
  "propagates %s failures instead of returning a partial overview",
  async (method) => {
    const repository = createRepository();
    const error = new Error("SQLite unavailable");
    jest.mocked(repository[method]).mockRejectedValue(error);

    await expect(loadHistoryOverview({ repository })).rejects.toBe(error);
  },
);

it("rejects workouts that do not satisfy the domain's completion requirement", async () => {
  const repository = createRepository();
  jest.mocked(repository.getCompletedWorkoutPage).mockResolvedValue({
    workouts: [createWorkoutWithAllSetsCompleted()],
    nextCursor: null,
  });

  await expect(
    loadHistoryPage({ repository }, { limit: 50, cursor: null }),
  ).rejects.toThrow("completed workout");
});
