import {
  createWorkoutWithCompletedFirstSet,
  createWorkoutWithCompetitionBench,
} from "@/domain/workout/tests/workout.test.helpers";

import { updateSet, type UpdateSetDependencies } from "../updateSet";

function createDependencies(): UpdateSetDependencies {
  return {
    repository: {
      saveWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: () => 3_000,
  };
}

describe("updateSet", () => {
  it("updates the requested values and persists the returned aggregate", async () => {
    const dependencies = createDependencies();

    const nextWorkout = await updateSet(
      dependencies,
      createWorkoutWithCompetitionBench(),
      {
        workoutSetId: "set_1",
        values: { type: "top", weight: 100, rpe: 8 },
      },
    );

    expect(nextWorkout.exercises[0].sets[0]).toMatchObject({
      type: "top",
      weight: 100,
      rpe: 8,
      updatedAt: 3_000,
    });
    expect(dependencies.repository.saveWorkoutAggregate).toHaveBeenCalledWith(
      nextWorkout,
    );
  });

  it("persists an automatic completed-set undo and update once", async () => {
    const dependencies = createDependencies();

    const nextWorkout = await updateSet(
      dependencies,
      createWorkoutWithCompletedFirstSet(),
      {
        workoutSetId: "set_1",
        values: { reps: null },
      },
    );

    expect(nextWorkout.exercises[0].sets[0]).toMatchObject({
      reps: null,
      finishedAt: null,
      updatedAt: 3_000,
    });
    expect(nextWorkout.workout.activeSetId).toBe("set_1");
    expect(dependencies.repository.saveWorkoutAggregate).toHaveBeenCalledTimes(
      1,
    );
    expect(dependencies.repository.saveWorkoutAggregate).toHaveBeenCalledWith(
      nextWorkout,
    );
  });

  it("rejects without changing the source aggregate when persistence fails", async () => {
    const error = new Error("Database unavailable");
    const workout = createWorkoutWithCompletedFirstSet();
    const dependencies = createDependencies();

    jest
      .mocked(dependencies.repository.saveWorkoutAggregate)
      .mockRejectedValueOnce(error);

    await expect(
      updateSet(dependencies, workout, {
        workoutSetId: "set_1",
        values: { weight: null },
      }),
    ).rejects.toBe(error);
    expect(workout.exercises[0].sets[0]).toMatchObject({
      weight: 100,
      finishedAt: 5_000,
    });
  });
});
