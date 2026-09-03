import {
  createWorkoutWithCompetitionBench,
  createWorkoutWithTwoSets,
} from "@/domain/workout/tests/workout.test.helpers";
import {
  completeWorkoutSet,
  updateWorkoutSet,
} from "@/domain/workout/workout.useCases";

import {
  copyPreviousSet,
  type CopyPreviousSetDependencies,
} from "../copyPreviousSet";

function createDependencies(): CopyPreviousSetDependencies {
  return {
    repository: {
      updateWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    createWorkoutSetId: jest.fn(() => "set_3"),
    now: () => 7_000,
  };
}

describe("copyPreviousSet", () => {
  it("copies the last set values into a new active unfinished set", async () => {
    const configuredFirstSet = updateWorkoutSet(createWorkoutWithTwoSets(), {
      setId: "set_1",
      type: "warmup",
      weight: 60,
      reps: 8,
      rpe: 6,
      now: 4_000,
    });
    const configuredLastSet = updateWorkoutSet(configuredFirstSet, {
      setId: "set_2",
      type: "top",
      weight: 100,
      reps: 5,
      rpe: 9,
      now: 5_000,
    });
    const workout = completeWorkoutSet(configuredLastSet, {
      setId: "set_2",
      now: 6_000,
    });
    const dependencies = createDependencies();

    const nextWorkout = await copyPreviousSet(dependencies, workout, {
      workoutExerciseId: "workout_exercise_1",
    });

    expect(workout.workout.activeSetId).toBe("set_1");
    expect(nextWorkout.exercises[0].sets[2]).toEqual({
      id: "set_3",
      workoutExerciseId: "workout_exercise_1",
      setIndex: 2,
      type: "top",
      weight: 100,
      reps: 5,
      rpe: 9,
      finishedAt: null,
      createdAt: 7_000,
      updatedAt: 7_000,
    });
    expect(nextWorkout.workout.activeSetId).toBe("set_3");
    expect(dependencies.repository.updateWorkoutAggregate).toHaveBeenCalledWith(
      workout,
      nextWorkout,
    );
  });

  it("rejects a missing workout exercise without persisting", async () => {
    const workout = createWorkoutWithCompetitionBench();
    const dependencies = createDependencies();

    await expect(
      copyPreviousSet(dependencies, workout, {
        workoutExerciseId: "missing_exercise",
      }),
    ).rejects.toThrow("Workout exercise not found");
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).not.toHaveBeenCalled();
  });
});
