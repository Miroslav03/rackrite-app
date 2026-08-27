import type { ExerciseId } from "@/domain/exercises/exercise.types";
import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutSetId,
} from "@/domain/workout/workout.types";
import type { Result } from "@/shared/types/result";
import type { WorkoutSessionError } from "./workoutSession.errors";

export type StartWorkoutOperation =
  "startEmptyWorkout" | "startWorkoutFromTemplate";

export type ActiveWorkoutOperation =
  | { type: "addExercise"; exerciseId: ExerciseId }
  | { type: "removeExercise"; workoutExerciseId: WorkoutExerciseId }
  | { type: "removeSet"; workoutSetId: WorkoutSetId }
  | { type: "addSet"; workoutExerciseId: WorkoutExerciseId }
  | { type: "updateSet"; workoutSetId: WorkoutSetId }
  | { type: "completeSet"; workoutSetId: WorkoutSetId }
  | { type: "selectSet"; workoutSetId: WorkoutSetId }
  | { type: "finishWorkout" };

export type WorkoutSessionResult<TValue> = Result<TValue, WorkoutSessionError>;

export type OperationState<TOperation> =
  | { status: "idle" }
  | {
      status: "pending";
      operation: TOperation;
    }
  | {
      status: "error";
      operation: TOperation;
      error: Error;
    };

export type WorkoutSessionState =
  | { status: "loading" }
  | {
      status: "loadError";
      error: Error;
    }
  | {
      status: "noActiveWorkout";
      operation: OperationState<StartWorkoutOperation>;
    }
  | {
      status: "active";
      workout: WorkoutAggregate;
      operation: OperationState<ActiveWorkoutOperation>;
    };

export type WorkoutSessionEvent =
  | { type: "hydrationStarted" }
  | {
      type: "hydrationSucceeded";
      workout: WorkoutAggregate | null;
    }
  | {
      type: "hydrationFailed";
      error: Error;
    }
  | {
      type: "startOperationStarted";
      operation: StartWorkoutOperation;
    }
  | {
      type: "startOperationFailed";
      operation: StartWorkoutOperation;
      error: Error;
    }
  | {
      type: "activeOperationStarted";
      operation: ActiveWorkoutOperation;
    }
  | {
      type: "activeOperationFailed";
      operation: ActiveWorkoutOperation;
      error: Error;
    }
  | {
      type: "operationErrorDismissed";
      error: Error;
    }
  | {
      type: "workoutCommitted";
      workout: WorkoutAggregate;
    }
  | { type: "workoutCleared" };
