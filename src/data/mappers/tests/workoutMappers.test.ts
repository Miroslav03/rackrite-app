import type { WorkoutRow } from "@/data/db/schema";
import {
  workoutRowToWorkout,
  workoutToRow,
} from "@/data/mappers/workoutMappers";

import type { Workout } from "@/domain/workout/workout.types";

function createWorkout(): Workout {
  return {
    id: "workout_1",
    sourceTemplateId: null,
    status: "active",
    activeSetId: "set_2",
    restTimer: {
      sourceSetId: "set_1",
      startedAt: 6_000,
      endsAt: 186_000,
    },
    startedAt: 1_000,
    finishedAt: null,
    createdAt: 1_000,
    updatedAt: 6_000,
  };
}

function createWorkoutRow(overrides: Partial<WorkoutRow> = {}): WorkoutRow {
  return {
    id: "workout_1",
    sourceTemplateId: null,
    status: "active",
    activeSetId: "set_2",
    restTimerSourceSetId: "set_1",
    restTimerStartedAt: 6_000,
    restTimerEndsAt: 186_000,
    startedAt: 1_000,
    finishedAt: null,
    createdAt: 1_000,
    updatedAt: 6_000,
    ...overrides,
  };
}

describe("workout timer mapping", () => {
  it("maps timer source metadata to its database row", () => {
    expect(workoutToRow(createWorkout())).toMatchObject({
      restTimerSourceSetId: "set_1",
      restTimerStartedAt: 6_000,
      restTimerEndsAt: 186_000,
    });
  });

  it("maps complete timer source metadata from its database row", () => {
    expect(workoutRowToWorkout(createWorkoutRow()).restTimer).toEqual({
      sourceSetId: "set_1",
      startedAt: 6_000,
      endsAt: 186_000,
    });
  });

  it.each([
    { restTimerSourceSetId: null },
    { restTimerStartedAt: null },
    { restTimerEndsAt: null },
  ])("rejects partial timer metadata: %o", (overrides) => {
    expect(() => workoutRowToWorkout(createWorkoutRow(overrides))).toThrow(
      "rest timer source and timestamps must all be defined or all be null",
    );
  });
});
