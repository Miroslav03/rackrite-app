import { createWorkoutWithTwoSets } from "@/domain/workout/tests/workout.test.helpers";

import { selectSet, type SelectSetDependencies } from "../selectSet";

function createDependencies(): SelectSetDependencies {
  return {
    repository: {
      saveWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: () => 4_000,
  };
}

describe("selectSet", () => {
  it("selects the requested set and persists the returned aggregate", async () => {
    const dependencies = createDependencies();

    const nextWorkout = await selectSet(
      dependencies,
      createWorkoutWithTwoSets(),
      { workoutSetId: "set_1" },
    );

    expect(nextWorkout.workout.activeSetId).toBe("set_1");
    expect(nextWorkout.workout.updatedAt).toBe(4_000);
    expect(dependencies.repository.saveWorkoutAggregate).toHaveBeenCalledWith(
      nextWorkout,
    );
  });
});
