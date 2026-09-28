import type { TemplateId } from "@/domain/templates/editor/templates.types";
import type {
  WorkoutExerciseId,
  WorkoutId,
} from "@/domain/workout/workout.types";

import { isOperationPending } from "@/shared/state/operationState";

import type {
  ActiveWorkoutOperation,
  OperationState,
  StartWorkoutOperation,
} from "./workoutSession.types";

export function getPendingRepeatWorkoutId(
  state: OperationState<StartWorkoutOperation | ActiveWorkoutOperation>,
): WorkoutId | null {
  if (
    isOperationPending(state) &&
    typeof state.operation !== "string" &&
    state.operation.type === "repeatWorkout"
  ) {
    return state.operation.sourceWorkoutId;
  }

  return null;
}

export function isAddSetOperationPending(
  state: OperationState<ActiveWorkoutOperation>,
  workoutExerciseId: WorkoutExerciseId,
): boolean {
  return (
    isOperationPending(state) &&
    state.operation.type === "addSet" &&
    state.operation.workoutExerciseId === workoutExerciseId
  );
}

export function isCopyPreviousSetOperationPending(
  state: OperationState<ActiveWorkoutOperation>,
  workoutExerciseId: WorkoutExerciseId,
): boolean {
  return (
    isOperationPending(state) &&
    state.operation.type === "copyPreviousSet" &&
    state.operation.workoutExerciseId === workoutExerciseId
  );
}

export function getPendingStartTemplateId(
  state: OperationState<StartWorkoutOperation | ActiveWorkoutOperation>,
): TemplateId | null {
  if (
    isOperationPending(state) &&
    typeof state.operation !== "string" &&
    state.operation.type === "startWorkoutFromTemplate"
  ) {
    return state.operation.templateId;
  }
  return null;
}
