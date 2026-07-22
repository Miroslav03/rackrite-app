import type { WorkoutAggregate } from "@/domain/workout/workout.types";
import type { WorkoutSessionState } from "@/features/workout/session/workoutSession.types";

export type StartEmptyWorkoutViewState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "error"; error: Error };

export type StartScreenViewState =
  | { view: "loading" }
  | { view: "loadError"; error: Error }
  | {
      view: "noActiveWorkout";
      startEmptyWorkout: StartEmptyWorkoutViewState;
    }
  | { view: "activeWorkout"; workout: WorkoutAggregate };

export function getStartScreenViewState(
  session: WorkoutSessionState,
): StartScreenViewState {
  switch (session.status) {
    case "loading":
      return { view: "loading" };

    case "loadError":
      return { view: "loadError", error: session.error };

    case "active":
      return { view: "activeWorkout", workout: session.workout };

    case "noActiveWorkout": {
      const operation = session.operation;

      if (
        operation.status === "pending" &&
        operation.operation === "startEmptyWorkout"
      ) {
        return {
          view: "noActiveWorkout",
          startEmptyWorkout: { status: "starting" },
        };
      }

      if (
        operation.status === "error" &&
        operation.operation === "startEmptyWorkout"
      ) {
        return {
          view: "noActiveWorkout",
          startEmptyWorkout: { status: "error", error: operation.error },
        };
      }

      return {
        view: "noActiveWorkout",
        startEmptyWorkout: { status: "idle" },
      };
    }
  }
}
