import { createWorkoutWithCompetitionBench } from "@/domain/workout/tests/workout.test.helpers";

import {
  removeExercise,
  type RemoveExerciseDependencies,
} from "./removeExercise";

function createDependencies(): RemoveExerciseDependencies {
  return {
    repository: {
      saveWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: () => 3_000,
  };
}

describe("removeExercise", () => {
  it("removes the workout exercise and persists the returned aggregate", async () => {
    const workout = createWorkoutWithCompetitionBench();
    const dependencies = createDependencies();

    const nextWorkout = await removeExercise(dependencies, workout, {
      workoutExerciseId: "workout_exercise_1",
    });

    expect(nextWorkout.exercises).toEqual([]);
    expect(nextWorkout.workout.activeSetId).toBeNull();
    expect(nextWorkout.workout.updatedAt).toBe(3_000);
    expect(
      dependencies.repository.saveWorkoutAggregate,
    ).toHaveBeenCalledWith(nextWorkout);
  });
});
