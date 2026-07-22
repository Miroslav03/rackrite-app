import type { WorkoutAggregate } from "@/domain/workout/workout.types";
import { Result } from "@/shared/types/result";
import { WorkoutSessionError } from "./workoutSession.errors";

export type StartWorkoutOperation =
  "startEmptyWorkout" | "startWorkoutFromTemplate";

export type ActiveWorkoutOperation =
  "updateSet" | "completeSet" | "addSet" | "selectSet" | "finishWorkout";

export type WorkoutSessionResult<TValue> = Result<TValue, WorkoutSessionError>;

export type OperationState<TOperation extends string> =
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
      type: "workoutCommitted";
      workout: WorkoutAggregate;
    }
  | { type: "workoutCleared" };
