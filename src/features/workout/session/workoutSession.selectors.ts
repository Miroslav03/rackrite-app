import type { WorkoutExerciseId } from "@/domain/workout/workout.types";

import type {
  ActiveWorkoutOperation,
  OperationState,
} from "./workoutSession.types";

export function isOperationPending<TOperation>(
  state: OperationState<TOperation>,
): state is { status: "pending"; operation: TOperation } {
  return state.status === "pending";
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
