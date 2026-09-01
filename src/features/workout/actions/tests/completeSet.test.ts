import {
  createWorkoutWithCompletedFirstSet,
  createWorkoutWithCompetitionBench,
  createWorkoutWithUpdatedFirstSet,
} from "@/domain/workout/tests/workout.test.helpers";
import {
  addWorkoutSet,
  startWorkoutRestTimer,
  updateWorkoutSet,
} from "@/domain/workout/workout.useCases";

import { completeSet, type CompleteSetDependencies } from "../completeSet";

function createDependencies(now = 5_000): CompleteSetDependencies {
  return {
    repository: {
      saveWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: jest.fn(() => now),
  };
}

describe("completeSet", () => {
  it("completes the set, starts rest, and persists the combined aggregate once", async () => {
    const dependencies = createDependencies();

    const nextWorkout = await completeSet(
      dependencies,
      createWorkoutWithUpdatedFirstSet(),
      { workoutSetId: "set_1" },
    );

    expect(nextWorkout.exercises[0].sets[0].finishedAt).toBe(5_000);
    expect(nextWorkout.workout.restTimer).toEqual({
      sourceSetId: "set_1",
      startedAt: 5_000,
      endsAt: 185_000,
    });
    expect(dependencies.now).toHaveBeenCalledTimes(1);
    expect(dependencies.repository.saveWorkoutAggregate).toHaveBeenCalledTimes(
      1,
    );
    expect(dependencies.repository.saveWorkoutAggregate).toHaveBeenCalledWith(
      nextWorkout,
    );
  });

  it("replaces a running timer when another non-final set is completed", async () => {
    const withTimer = startWorkoutRestTimer(
      createWorkoutWithCompletedFirstSet(),
      { setId: "set_1", now: 6_000 },
    );
    const configuredSecondSet = updateWorkoutSet(withTimer, {
      setId: "set_2",
      weight: 105,
      reps: 4,
      now: 7_000,
    });
    const withThirdSet = addWorkoutSet(configuredSecondSet, {
      workoutExerciseId: "workout_exercise_1",
      setId: "set_3",
      now: 8_000,
    });
    const dependencies = createDependencies(9_000);

    const nextWorkout = await completeSet(dependencies, withThirdSet, {
      workoutSetId: "set_2",
    });

    expect(nextWorkout.workout.restTimer).toEqual({
      sourceSetId: "set_2",
      startedAt: 9_000,
      endsAt: 189_000,
    });
    expect(dependencies.repository.saveWorkoutAggregate).toHaveBeenCalledTimes(
      1,
    );
  });

  it("does not start rest after the final unfinished set is completed", async () => {
    const configuredWorkout = updateWorkoutSet(
      createWorkoutWithCompetitionBench(),
      {
        setId: "set_1",
        weight: 100,
        reps: 5,
        now: 3_000,
      },
    );
    const dependencies = createDependencies(4_000);

    const nextWorkout = await completeSet(dependencies, configuredWorkout, {
      workoutSetId: "set_1",
    });

    expect(nextWorkout.workout.restTimer).toBeNull();
    expect(dependencies.repository.saveWorkoutAggregate).toHaveBeenCalledTimes(
      1,
    );
  });

  it("rejects without changing the source aggregate when persistence fails", async () => {
    const sourceWorkout = createWorkoutWithUpdatedFirstSet();
    const dependencies = createDependencies();
    const error = new Error("Database unavailable");

    jest
      .mocked(dependencies.repository.saveWorkoutAggregate)
      .mockRejectedValueOnce(error);

    await expect(
      completeSet(dependencies, sourceWorkout, { workoutSetId: "set_1" }),
    ).rejects.toBe(error);
    expect(sourceWorkout.exercises[0].sets[0].finishedAt).toBeNull();
    expect(sourceWorkout.workout.restTimer).toBeNull();
  });
});
