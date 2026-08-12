import { createWorkoutWithUpdatedFirstSet } from "@/domain/workout/tests/workout.test.helpers";

import { completeSet, type CompleteSetDependencies } from "../completeSet";

function createDependencies(): CompleteSetDependencies {
  return {
    repository: {
      saveWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: () => 5_000,
  };
}

describe("completeSet", () => {
  it("completes the requested set and persists the returned aggregate", async () => {
    const dependencies = createDependencies();

    const nextWorkout = await completeSet(
      dependencies,
      createWorkoutWithUpdatedFirstSet(),
      { workoutSetId: "set_1" },
    );

    expect(nextWorkout.exercises[0].sets[0].finishedAt).toBe(5_000);
    expect(dependencies.repository.saveWorkoutAggregate).toHaveBeenCalledWith(
      nextWorkout,
    );
  });
});
