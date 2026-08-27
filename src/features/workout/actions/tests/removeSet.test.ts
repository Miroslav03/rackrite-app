import { createWorkoutWithTwoSets } from "@/domain/workout/tests/workout.test.helpers";

import { removeSet, type RemoveSetDependencies } from "../removeSet";

function createDependencies(): RemoveSetDependencies {
  return {
    repository: {
      saveWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: () => 4_000,
  };
}

describe("removeSet", () => {
  it("removes the workout set and persists the returned aggregate", async () => {
    const workout = createWorkoutWithTwoSets();
    const dependencies = createDependencies();

    const nextWorkout = await removeSet(dependencies, workout, {
      workoutSetId: "set_2",
    });

    expect(nextWorkout.exercises[0].sets.map((set) => set.id)).toEqual([
      "set_1",
    ]);
    expect(nextWorkout.workout.activeSetId).toBe("set_1");
    expect(nextWorkout.workout.updatedAt).toBe(4_000);
    expect(dependencies.repository.saveWorkoutAggregate).toHaveBeenCalledWith(
      nextWorkout,
    );
  });
});
