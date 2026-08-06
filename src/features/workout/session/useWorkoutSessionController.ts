import { useCallback, useEffect, useReducer, useRef } from "react";

import type { WorkoutSessionActions } from "@/features/workout/actions/workoutSessionActions";
import type { AddExerciseCommand } from "@/features/workout/actions/addExercise";
import type { RemoveExerciseCommand } from "@/features/workout/actions/removeExercise";

import { toError } from "@/shared/utils/error";

import { WorkoutAggregate } from "@/domain/workout/workout.types";

import { failure, success } from "@/shared/types/result";

import { WorkoutSessionError } from "./workoutSession.errors";
import { workoutSessionReducer } from "./workoutSession.reducer";
import type {
  WorkoutSessionResult,
  WorkoutSessionState,
} from "./workoutSession.types";

export type WorkoutSessionController = {
  state: WorkoutSessionState;
  startEmptyWorkout: () => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  addExercise: (
    command: AddExerciseCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  removeExercise: (
    command: RemoveExerciseCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
};

const initialWorkoutSessionState: WorkoutSessionState = {
  status: "loading",
};

export function useWorkoutSessionController(
  actions: WorkoutSessionActions,
): WorkoutSessionController {
  const [state, dispatch] = useReducer(
    workoutSessionReducer,
    initialWorkoutSessionState,
  );

  const isStartingRef = useRef(false);
  const isActiveOperationRunningRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    dispatch({ type: "hydrationStarted" });

    actions
      .loadActiveWorkout()
      .then((workout) => {
        if (cancelled) {
          return;
        }

        dispatch({
          type: "hydrationSucceeded",
          workout,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        dispatch({
          type: "hydrationFailed",
          error: toError(error),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [actions]);

  const startEmptyWorkout = useCallback(async (): Promise<
    WorkoutSessionResult<WorkoutAggregate>
  > => {
    if (state.status !== "noActiveWorkout") {
      return {
        success: false,
        error: new WorkoutSessionError({
          code: "invalidSessionState",
          message: "An empty workout cannot be started in this state",
        }),
      };
    }

    if (isStartingRef.current) {
      return {
        success: false,
        error: new WorkoutSessionError({
          code: "operationAlreadyRunning",
          message: "An empty workout is already being started",
        }),
      };
    }

    isStartingRef.current = true;

    dispatch({
      type: "startOperationStarted",
      operation: "startEmptyWorkout",
    });

    try {
      const workout = await actions.startEmptyWorkout();

      dispatch({
        type: "workoutCommitted",
        workout,
      });

      return success(workout);
    } catch (error) {
      const sessionError = new WorkoutSessionError({
        code: "operationFailed",
        message: "Failed to start an empty workout",
        cause: toError(error),
      });

      dispatch({
        type: "startOperationFailed",
        operation: "startEmptyWorkout",
        error: sessionError,
      });

      return failure(sessionError);
    } finally {
      isStartingRef.current = false;
    }
  }, [actions, state.status]);

  const addExercise = useCallback(
    async (
      command: AddExerciseCommand,
    ): Promise<WorkoutSessionResult<WorkoutAggregate>> => {
      if (state.status !== "active") {
        return failure(
          new WorkoutSessionError({
            code: "invalidSessionState",
            message: "An exercise cannot be added without an active workout",
          }),
        );
      }

      if (isActiveOperationRunningRef.current) {
        return failure(
          new WorkoutSessionError({
            code: "operationAlreadyRunning",
            message: "Another workout operation is already running",
          }),
        );
      }

      isActiveOperationRunningRef.current = true;

      dispatch({
        type: "activeOperationStarted",
        operation: "addExercise",
      });

      try {
        const workout = await actions.addExercise(state.workout, command);

        dispatch({
          type: "workoutCommitted",
          workout,
        });

        return success(workout);
      } catch (error) {
        const sessionError = new WorkoutSessionError({
          code: "operationFailed",
          message: "Failed to add the exercise",
          cause: toError(error),
        });

        dispatch({
          type: "activeOperationFailed",
          operation: "addExercise",
          error: sessionError,
        });

        return failure(sessionError);
      } finally {
        isActiveOperationRunningRef.current = false;
      }
    },
    [actions, state],
  );

  const removeExercise = useCallback(
    async (
      command: RemoveExerciseCommand,
    ): Promise<WorkoutSessionResult<WorkoutAggregate>> => {
      if (state.status !== "active") {
        return failure(
          new WorkoutSessionError({
            code: "invalidSessionState",
            message: "An exercise cannot be removed without an active workout",
          }),
        );
      }

      if (isActiveOperationRunningRef.current) {
        return failure(
          new WorkoutSessionError({
            code: "operationAlreadyRunning",
            message: "Another workout operation is already running",
          }),
        );
      }

      isActiveOperationRunningRef.current = true;

      dispatch({
        type: "activeOperationStarted",
        operation: "removeExercise",
      });

      try {
        const workout = await actions.removeExercise(state.workout, command);

        dispatch({
          type: "workoutCommitted",
          workout,
        });

        return success(workout);
      } catch (error) {
        const sessionError = new WorkoutSessionError({
          code: "operationFailed",
          message: "Failed to remove the exercise",
          cause: toError(error),
        });

        dispatch({
          type: "activeOperationFailed",
          operation: "removeExercise",
          error: sessionError,
        });

        return failure(sessionError);
      } finally {
        isActiveOperationRunningRef.current = false;
      }
    },
    [actions, state],
  );

  return {
    state,
    startEmptyWorkout,
    addExercise,
    removeExercise,
  };
}
