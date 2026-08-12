import { createWorkoutWithCompetitionBench } from "@/domain/workout/tests/workout.test.helpers";

import { updateSet, type UpdateSetDependencies } from "../updateSet";

function createDependencies(): UpdateSetDependencies {
  return {
    repository: {
      saveWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: () => 3_000,
  };
}

describe("updateSet", () => {
  it("updates the requested values and persists the returned aggregate", async () => {
    const dependencies = createDependencies();

    const nextWorkout = await updateSet(
      dependencies,
      createWorkoutWithCompetitionBench(),
      {
        workoutSetId: "set_1",
        values: { type: "top", weight: 100, rpe: 8 },
      },
    );

    expect(nextWorkout.exercises[0].sets[0]).toMatchObject({
      type: "top",
      weight: 100,
      rpe: 8,
      updatedAt: 3_000,
    });
    expect(dependencies.repository.saveWorkoutAggregate).toHaveBeenCalledWith(
      nextWorkout,
    );
  });
});
