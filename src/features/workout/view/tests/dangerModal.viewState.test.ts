import { createWorkoutWithCompetitionBench } from "@/domain/workout/tests/workout.test.helpers";
import type {
  ActiveWorkoutOperation,
  OperationState,
} from "@/features/workout/session/workoutSession.types";

import type { ActiveWorkoutOverlay } from "../ActiveWorkoutScreenView";
import {
  getModalContent,
  getModalOperation,
} from "../activeWorkout.viewState.utils";

const cancelWorkoutOverlay: ActiveWorkoutOverlay = {
  type: "dangerModal",
  confirmation: { action: "cancelWorkout" },
};

describe("danger modal view state", () => {
  const workout = createWorkoutWithCompetitionBench();

  it("describes permanent workout cancellation", () => {
    expect(getModalContent(workout, cancelWorkoutOverlay)).toEqual({
      title: "CANCEL WORKOUT?",
      description:
        "This workout and all logged exercises and sets will be permanently deleted. This action cannot be undone.",
      confirmLabel: "CANCEL",
      pendingLabel: "CANCELING...",
    });
  });

  it("describes removal of an existing exercise", () => {
    const overlay: ActiveWorkoutOverlay = {
      type: "dangerModal",
      confirmation: {
        action: "removeExercise",
        workoutExerciseId: "workout_exercise_1",
      },
    };

    expect(getModalContent(workout, overlay)).toEqual({
      title: "REMOVE EXERCISE?",
      description:
        "Competition Bench and all of its sets will be permanently removed. This action cannot be undone.",
      confirmLabel: "REMOVE",
      pendingLabel: "REMOVING...",
    });
  });

  it("does not provide removal content for a missing set", () => {
    const overlay: ActiveWorkoutOverlay = {
      type: "dangerModal",
      confirmation: {
        action: "removeSet",
        workoutSetId: "missing_set",
      },
    };

    expect(getModalContent(workout, overlay)).toBeNull();
  });

  it("maps the matching pending operation to the danger modal", () => {
    const operation: OperationState<ActiveWorkoutOperation> = {
      status: "pending",
      operation: { type: "cancelWorkout" },
    };

    expect(getModalOperation(cancelWorkoutOverlay, operation)).toEqual({
      status: "pending",
      label: "CANCELING...",
    });
  });

  it("ignores an unrelated pending operation", () => {
    const operation: OperationState<ActiveWorkoutOperation> = {
      status: "pending",
      operation: { type: "resetRestTimer" },
    };

    expect(getModalOperation(cancelWorkoutOverlay, operation)).toEqual({
      status: "idle",
    });
  });
});
