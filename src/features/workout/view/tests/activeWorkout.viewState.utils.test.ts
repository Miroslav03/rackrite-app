import { createEmptyWorkout } from "@/domain/workout/workout.useCases";
import type {
  ActiveWorkoutOperation,
  OperationState,
} from "@/features/workout/session/workoutSession.types";

import type { ActiveWorkoutOverlay } from "../ActiveWorkoutScreenView";
import {
  getDangerConfirmationContent,
  getDangerOperation,
} from "../activeWorkout.viewState.utils";

const cancelWorkoutOverlay: ActiveWorkoutOverlay = {
  type: "dangerConfirmationModal",
  confirmation: { action: "cancelWorkout" },
};

describe("workout cancellation danger state", () => {
  it("describes permanent workout deletion", () => {
    const workout = createEmptyWorkout({
      id: "workout_1",
      now: 1_000,
    });

    expect(
      getDangerConfirmationContent(
        workout,
        cancelWorkoutOverlay.confirmation,
      ),
    ).toEqual({
      title: "CANCEL WORKOUT?",
      description:
        "This workout and all logged exercises and sets will be permanently deleted. This action cannot be undone.",
      confirmLabel: "CANCEL WORKOUT",
      pendingLabel: "CANCELING...",
    });
  });

  it("maps the matching pending operation to the danger modal", () => {
    const operation: OperationState<ActiveWorkoutOperation> = {
      status: "pending",
      operation: { type: "cancelWorkout" },
    };

    expect(getDangerOperation(cancelWorkoutOverlay, operation)).toEqual({
      status: "pending",
      label: "CANCELING...",
    });
  });

  it("ignores an unrelated pending operation", () => {
    const operation: OperationState<ActiveWorkoutOperation> = {
      status: "pending",
      operation: { type: "resetRestTimer" },
    };

    expect(getDangerOperation(cancelWorkoutOverlay, operation)).toEqual({
      status: "idle",
    });
  });
});
