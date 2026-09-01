import { createEmptyWorkout } from "@/domain/workout/workout.useCases";

import {
  startQuickWorkout,
  type StartQuickWorkoutDependencies,
} from "../startQuickWorkout";

function createDependencies(): StartQuickWorkoutDependencies {
  return {
    repository: {
      getActiveWorkoutAggregate: jest.fn().mockResolvedValue(null),
      insertWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: jest.fn(() => 1_000),
    createWorkoutId: jest.fn(() => "workout_1"),
  };
}

describe("startQuickWorkout", () => {
  it("inserts a newly created workout aggregate", async () => {
    const dependencies = createDependencies();

    const workout = await startQuickWorkout(dependencies);

    expect(workout.workout).toMatchObject({
      id: "workout_1",
      status: "active",
      startedAt: 1_000,
    });
    expect(dependencies.repository.insertWorkoutAggregate).toHaveBeenCalledWith(
      workout,
    );
  });

  it("returns the existing active workout without inserting another one", async () => {
    const existingWorkout = createEmptyWorkout({
      id: "existing_workout",
      now: 500,
    });
    const dependencies = createDependencies();

    jest
      .mocked(dependencies.repository.getActiveWorkoutAggregate)
      .mockResolvedValueOnce(existingWorkout);

    const workout = await startQuickWorkout(dependencies);

    expect(workout).toBe(existingWorkout);
    expect(
      dependencies.repository.insertWorkoutAggregate,
    ).not.toHaveBeenCalled();
    expect(dependencies.now).not.toHaveBeenCalled();
    expect(dependencies.createWorkoutId).not.toHaveBeenCalled();
  });
});
