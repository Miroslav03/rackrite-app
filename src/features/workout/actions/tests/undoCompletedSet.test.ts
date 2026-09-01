import { createWorkoutWithCompletedFirstSet } from "@/domain/workout/tests/workout.test.helpers";

import {
  undoCompletedSet,
  type UndoSetCompletionDependencies,
} from "../undoCompletedSet";

function createDependencies(): UndoSetCompletionDependencies {
  return {
    repository: {
      updateWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: () => 6_000,
  };
}

describe("undoCompletedSet", () => {
  it("reopens the set and persists the returned aggregate once", async () => {
    const dependencies = createDependencies();
    const workout = createWorkoutWithCompletedFirstSet();

    const nextWorkout = await undoCompletedSet(
      dependencies,
      workout,
      { workoutSetId: "set_1" },
    );

    expect(nextWorkout.exercises[0].sets[0]).toMatchObject({
      finishedAt: null,
      updatedAt: 6_000,
    });
    expect(nextWorkout.workout.activeSetId).toBe("set_1");
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).toHaveBeenCalledTimes(1);
    expect(dependencies.repository.updateWorkoutAggregate).toHaveBeenCalledWith(
      workout,
      nextWorkout,
    );
  });

  it("rejects without changing the source aggregate when persistence fails", async () => {
    const error = new Error("Database unavailable");
    const workout = createWorkoutWithCompletedFirstSet();
    const dependencies = createDependencies();

    jest
      .mocked(dependencies.repository.updateWorkoutAggregate)
      .mockRejectedValueOnce(error);

    await expect(
      undoCompletedSet(dependencies, workout, { workoutSetId: "set_1" }),
    ).rejects.toBe(error);
    expect(workout.exercises[0].sets[0].finishedAt).toBe(5_000);
  });
});
