import { createWorkoutWithTwoExercises } from "@/domain/workout/tests/workout.test.helpers";

import {
  updateExerciseOrder,
  type UpdateExerciseOrderDependencies,
} from "../updateExerciseOrder";

function createDependencies(): UpdateExerciseOrderDependencies {
  return {
    repository: {
      updateWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: () => 4_000,
  };
}

describe("updateExerciseOrder", () => {
  it("moves one exercise and persists the returned aggregate", async () => {
    const workout = createWorkoutWithTwoExercises();
    const dependencies = createDependencies();

    const nextWorkout = await updateExerciseOrder(dependencies, workout, {
      workoutExerciseId: "workout_exercise_2",
      orderIndex: 0,
    });

    expect(
      nextWorkout.exercises.map(({ workoutExercise }) => ({
        id: workoutExercise.id,
        orderIndex: workoutExercise.orderIndex,
      })),
    ).toEqual([
      { id: "workout_exercise_2", orderIndex: 0 },
      { id: "workout_exercise_1", orderIndex: 1 },
    ]);
    expect(dependencies.repository.updateWorkoutAggregate).toHaveBeenCalledWith(
      workout,
      nextWorkout,
    );
  });

  it("does not persist when the exercise is already at that index", async () => {
    const workout = createWorkoutWithTwoExercises();
    const dependencies = createDependencies();

    const nextWorkout = await updateExerciseOrder(dependencies, workout, {
      workoutExerciseId: "workout_exercise_2",
      orderIndex: 1,
    });

    expect(nextWorkout).toBe(workout);
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).not.toHaveBeenCalled();
  });

  it("rejects without changing the source aggregate when persistence fails", async () => {
    const error = new Error("Database unavailable");
    const workout = createWorkoutWithTwoExercises();
    const dependencies = createDependencies();

    jest
      .mocked(dependencies.repository.updateWorkoutAggregate)
      .mockRejectedValueOnce(error);

    await expect(
      updateExerciseOrder(dependencies, workout, {
        workoutExerciseId: "workout_exercise_2",
        orderIndex: 0,
      }),
    ).rejects.toBe(error);
    expect(
      workout.exercises.map(
        ({ workoutExercise }) => workoutExercise.orderIndex,
      ),
    ).toEqual([0, 1]);
  });
});
