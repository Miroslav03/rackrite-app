import { createWorkoutWithCompletedFirstSet } from "@/domain/workout/tests/workout.test.helpers";
import {
  createEmptyWorkout,
  finishWorkout,
} from "@/domain/workout/workout.useCases";

import {
  cancelWorkout,
  type CancelWorkoutDependencies,
} from "../cancelWorkout";

function createDependencies(): CancelWorkoutDependencies {
  return {
    repository: {
      deleteWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
  };
}

describe("cancelWorkout", () => {
  it("deletes the validated active workout", async () => {
    const workout = createEmptyWorkout({
      id: "workout_1",
      now: 1_000,
    });
    const dependencies = createDependencies();

    await cancelWorkout(dependencies, workout);

    expect(dependencies.repository.deleteWorkoutAggregate).toHaveBeenCalledWith(
      "workout_1",
    );
  });

  it("does not delete a completed workout", async () => {
    const completedWorkout = finishWorkout(
      createWorkoutWithCompletedFirstSet(),
      { now: 6_000 },
    );
    const dependencies = createDependencies();

    await expect(cancelWorkout(dependencies, completedWorkout)).rejects.toThrow(
      "Workout must be active",
    );
    expect(
      dependencies.repository.deleteWorkoutAggregate,
    ).not.toHaveBeenCalled();
  });
});
