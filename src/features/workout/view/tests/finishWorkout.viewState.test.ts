import {
  createWorkoutWithAllSetsCompleted,
  createWorkoutWithCompletedFirstSet,
} from "@/domain/workout/tests/workout.test.helpers";
import {
  addWorkoutSet,
  createEmptyWorkout,
} from "@/domain/workout/workout.useCases";
import type {
  ActiveWorkoutOperation,
  OperationState,
} from "@/features/workout/session/workoutSession.types";

import type { ActiveWorkoutOverlay } from "../ActiveWorkoutScreenView";
import {
  getModalContent,
  getModalOperation,
} from "../activeWorkout.viewState.utils";

const finishWorkoutOverlay: ActiveWorkoutOverlay = {
  type: "confirmationModal",
  confirmation: { action: "finishWorkout" },
};

describe("finish workout modal view state", () => {
  it("does not provide confirmation content for a blocked workout", () => {
    const workout = createEmptyWorkout({ id: "workout_1", now: 1_000 });

    expect(getModalContent(workout, finishWorkoutOverlay)).toBeNull();
  });

  it("provides a generic confirmation when every set is completed", () => {
    expect(
      getModalContent(
        createWorkoutWithAllSetsCompleted(),
        finishWorkoutOverlay,
      ),
    ).toEqual({
      title: "FINISH WORKOUT?",
      description: "Are you sure you want to finish this workout?",
      confirmLabel: "FINISH",
      pendingLabel: "FINISHING...",
    });
  });

  it("provides the unfinished-set warning instead of a second confirmation", () => {
    expect(
      getModalContent(
        createWorkoutWithCompletedFirstSet(),
        finishWorkoutOverlay,
      ),
    ).toEqual({
      title: "FINISH WORKOUT?",
      description:
        "You still have 1 unfinished set. Finish now to save completed sets and skip the rest.",
      confirmLabel: "FINISH",
      pendingLabel: "FINISHING...",
    });
  });

  it("pluralizes the warning when multiple sets are unfinished", () => {
    const workout = addWorkoutSet(createWorkoutWithCompletedFirstSet(), {
      workoutExerciseId: "workout_exercise_1",
      setId: "set_3",
      now: 6_000,
    });

    expect(getModalContent(workout, finishWorkoutOverlay)).toEqual({
      title: "FINISH WORKOUT?",
      description:
        "You still have 2 unfinished sets. Finish now to save completed sets and skip the rest.",
      confirmLabel: "FINISH",
      pendingLabel: "FINISHING...",
    });
  });

  it("maps a pending finish operation to the confirmation modal", () => {
    const operation: OperationState<ActiveWorkoutOperation> = {
      status: "pending",
      operation: { type: "finishWorkout" },
    };

    expect(getModalOperation(finishWorkoutOverlay, operation)).toEqual({
      status: "pending",
      label: "FINISHING...",
    });
  });

  it("ignores an unrelated pending operation", () => {
    const operation: OperationState<ActiveWorkoutOperation> = {
      status: "pending",
      operation: { type: "resetRestTimer" },
    };

    expect(getModalOperation(finishWorkoutOverlay, operation)).toEqual({
      status: "idle",
    });
  });
});
