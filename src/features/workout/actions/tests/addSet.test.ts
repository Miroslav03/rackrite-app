import { createWorkoutWithCompetitionBench } from "@/domain/workout/tests/workout.test.helpers";

import { addSet, type AddSetDependencies } from "../addSet";

function createDependencies(): AddSetDependencies {
  return {
    repository: {
      updateWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    createWorkoutSetId: () => "set_2",
    now: () => 3_000,
  };
}

describe("addSet", () => {
  it("adds a blank working set and persists the returned aggregate", async () => {
    const workout = createWorkoutWithCompetitionBench();
    const dependencies = createDependencies();

    const nextWorkout = await addSet(dependencies, workout, {
      workoutExerciseId: "workout_exercise_1",
    });

    expect(nextWorkout.exercises[0].sets[1]).toEqual({
      id: "set_2",
      workoutExerciseId: "workout_exercise_1",
      setIndex: 1,
      type: "working",
      weight: null,
      reps: null,
      rpe: null,
      finishedAt: null,
      createdAt: 3_000,
      updatedAt: 3_000,
    });
    expect(nextWorkout.workout.activeSetId).toBe("set_2");
    expect(dependencies.repository.updateWorkoutAggregate).toHaveBeenCalledWith(
      workout,
      nextWorkout,
    );
  });

  it("uses optional initial values when they are provided", async () => {
    const workout = createWorkoutWithCompetitionBench();
    const dependencies = createDependencies();

    const nextWorkout = await addSet(dependencies, workout, {
      workoutExerciseId: "workout_exercise_1",
      initialValues: {
        type: "warmup",
        weight: 60,
        reps: 8,
        rpe: 6,
      },
    });

    expect(nextWorkout.exercises[0].sets[1]).toMatchObject({
      type: "warmup",
      weight: 60,
      reps: 8,
      rpe: 6,
    });
    expect(dependencies.repository.updateWorkoutAggregate).toHaveBeenCalledWith(
      workout,
      nextWorkout,
    );
  });
});
