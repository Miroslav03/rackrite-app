import {
  createWorkoutWithAllSetsCompleted,
  createWorkoutWithCompletedFirstSet,
} from "@/domain/workout/tests/workout.test.helpers";

import {
  finishWorkout,
  type FinishWorkoutDependencies,
} from "../finishWorkout";

function createDependencies(): FinishWorkoutDependencies {
  return {
    repository: {
      updateWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: jest.fn(() => 8_000),
  };
}

describe("finishWorkout", () => {
  it("persists an all-completed workout", async () => {
    const workout = createWorkoutWithAllSetsCompleted();
    const dependencies = createDependencies();

    await finishWorkout(dependencies, workout, {
      skipUnfinishedSets: false,
    });

    expect(dependencies.repository.updateWorkoutAggregate).toHaveBeenCalledWith(
      workout,
      expect.objectContaining({
        workout: expect.objectContaining({
          status: "completed",
          finishedAt: 8_000,
          updatedAt: 8_000,
        }),
      }),
    );
  });

  it("does not persist a partial workout without skip permission", async () => {
    const workout = createWorkoutWithCompletedFirstSet();
    const dependencies = createDependencies();

    await expect(
      finishWorkout(dependencies, workout, {
        skipUnfinishedSets: false,
      }),
    ).rejects.toThrow("Workout has unfinished sets");
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).not.toHaveBeenCalled();
  });

  it("persists the actual partial workout structure after confirmation", async () => {
    const workout = createWorkoutWithCompletedFirstSet();
    const workoutFromDeletedTemplate = {
      ...workout,
      workout: {
        ...workout.workout,
        sourceTemplateId: "deleted_template",
      },
    };
    const dependencies = createDependencies();

    await finishWorkout(dependencies, workoutFromDeletedTemplate, {
      skipUnfinishedSets: true,
    });

    const persistedWorkout = jest.mocked(
      dependencies.repository.updateWorkoutAggregate,
    ).mock.calls[0][1];

    expect(persistedWorkout.workout.sourceTemplateId).toBe("deleted_template");
    expect(persistedWorkout.exercises).toBe(
      workoutFromDeletedTemplate.exercises,
    );
    expect(persistedWorkout.exercises[0].sets[1].finishedAt).toBeNull();
  });
});
