import type {
    WorkoutSessionEvent,
    WorkoutSessionState,
} from "./workoutSession.types";

export function workoutSessionReducer(
  state: WorkoutSessionState,
  event: WorkoutSessionEvent,
): WorkoutSessionState {
  switch (event.type) {
    case "hydrationStarted":
      return { status: "loading" };

    case "hydrationSucceeded":
      return event.workout
        ? {
            status: "active",
            workout: event.workout,
            operation: { status: "idle" },
          }
        : {
            status: "noActiveWorkout",
            operation: { status: "idle" },
          };

    case "hydrationFailed":
      return {
        status: "loadError",
        error: event.error,
      };

    case "startOperationStarted":
      if (state.status !== "noActiveWorkout") {
        return state;
      }

      return {
        status: "noActiveWorkout",
        operation: {
          status: "pending",
          operation: event.operation,
        },
      };

    case "startOperationFailed":
      if (state.status !== "noActiveWorkout") {
        return state;
      }

      return {
        status: "noActiveWorkout",
        operation: {
          status: "error",
          operation: event.operation,
          error: event.error,
        },
      };

    case "activeOperationStarted":
      if (state.status !== "active") {
        return state;
      }

      return {
        ...state,
        operation: {
          status: "pending",
          operation: event.operation,
        },
      };

    case "activeOperationFailed":
      if (state.status !== "active") {
        return state;
      }

      return {
        ...state,
        operation: {
          status: "error",
          operation: event.operation,
          error: event.error,
        },
      };

    case "workoutCommitted":
      if (state.status !== "noActiveWorkout" && state.status !== "active") {
        return state;
      }

      return {
        status: "active",
        workout: event.workout,
        operation: { status: "idle" },
      };

    case "workoutCleared":
      if (state.status !== "active") {
        return state;
      }

      return {
        status: "noActiveWorkout",
        operation: { status: "idle" },
      };
  }
}
