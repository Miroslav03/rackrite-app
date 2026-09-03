import {
  isCopyPreviousSetOperationPending,
  isOperationPending,
} from "../workoutSession.selectors";
import type {
  ActiveWorkoutOperation,
  OperationState,
} from "../workoutSession.types";

describe("workout session selectors", () => {
  it("identifies a copy-previous operation for the matching exercise", () => {
    const operation: OperationState<ActiveWorkoutOperation> = {
      status: "pending",
      operation: {
        type: "copyPreviousSet",
        workoutExerciseId: "workout_exercise_1",
      },
    };

    expect(isOperationPending(operation)).toBe(true);
    expect(
      isCopyPreviousSetOperationPending(operation, "workout_exercise_1"),
    ).toBe(true);
    expect(
      isCopyPreviousSetOperationPending(operation, "workout_exercise_2"),
    ).toBe(false);
  });

  it("does not treat adding a set as copying the previous set", () => {
    const operation: OperationState<ActiveWorkoutOperation> = {
      status: "pending",
      operation: {
        type: "addSet",
        workoutExerciseId: "workout_exercise_1",
      },
    };

    expect(
      isCopyPreviousSetOperationPending(operation, "workout_exercise_1"),
    ).toBe(false);
  });
});
