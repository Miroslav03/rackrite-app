import type { Exercise } from "@/domain/exercises/exercise.types";
import { createEmptyWorkout } from "@/domain/workout/workout.useCases";

import { addExercise, type AddExerciseDependencies } from "./addExercise";

const customAccessory: Exercise = {
  id: "custom_triceps_extension",
  name: "Custom Triceps Extension",
  kind: "accessory",
  origin: "custom",
  liftFamily: null,
  defaultRestSeconds: null,
};

function createDependencies(): AddExerciseDependencies {
  return {
    repository: {
      saveWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: () => 2_000,
    createWorkoutExerciseId: () => "workout_exercise_1",
    createWorkoutSetId: () => "set_1",
    getDefaultRestSeconds: () => 90,
  };
}

describe("addExercise", () => {
  it("adds an exercise, creates its initial set, and persists the aggregate", async () => {
    const workout = createEmptyWorkout({ id: "workout_1", now: 1_000 });
    const dependencies = createDependencies();

    const nextWorkout = await addExercise(dependencies, workout, {
      exercise: customAccessory,
    });

    expect(nextWorkout.exercises).toHaveLength(1);
    expect(nextWorkout.exercises[0]).toMatchObject({
      workoutExercise: {
        id: "workout_exercise_1",
        workoutId: "workout_1",
        exerciseId: customAccessory.id,
        restSeconds: 90,
      },
      exercise: customAccessory,
      sets: [
        {
          id: "set_1",
          workoutExerciseId: "workout_exercise_1",
          setIndex: 0,
        },
      ],
    });
    expect(nextWorkout.workout.activeSetId).toBe("set_1");
    expect(
      dependencies.repository.saveWorkoutAggregate,
    ).toHaveBeenCalledWith(nextWorkout);
  });

  it("keeps an exercise-specific rest time instead of using the settings fallback", async () => {
    const workout = createEmptyWorkout({ id: "workout_1", now: 1_000 });
    const dependencies = createDependencies();
    const getDefaultRestSeconds = jest.spyOn(
      dependencies,
      "getDefaultRestSeconds",
    );
    const exercise: Exercise = {
      ...customAccessory,
      defaultRestSeconds: 120,
    };

    const nextWorkout = await addExercise(dependencies, workout, {
      exercise,
    });

    expect(
      nextWorkout.exercises[0].workoutExercise.restSeconds,
    ).toBe(120);
    expect(getDefaultRestSeconds).not.toHaveBeenCalled();
  });
});
