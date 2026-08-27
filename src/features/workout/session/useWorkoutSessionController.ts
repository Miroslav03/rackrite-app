import { useCallback, useEffect, useReducer, useRef } from "react";

import type { AddExerciseCommand } from "@/features/workout/actions/addExercise";
import type { AddSetCommand } from "@/features/workout/actions/addSet";
import type { CompleteSetCommand } from "@/features/workout/actions/completeSet";
import type { RemoveExerciseCommand } from "@/features/workout/actions/removeExercise";
import type { RemoveSetCommand } from "@/features/workout/actions/removeSet";
import type { SelectSetCommand } from "@/features/workout/actions/selectSet";
import type { UpdateSetCommand } from "@/features/workout/actions/updateSet";
import type { WorkoutSessionActions } from "@/features/workout/actions/workoutSessionActions";

import { toError } from "@/shared/utils/error";

import type { WorkoutAggregate } from "@/domain/workout/workout.types";

import { failure, success } from "@/shared/types/result";

import { WorkoutSessionError } from "./workoutSession.errors";
import { workoutSessionReducer } from "./workoutSession.reducer";
import type {
  ActiveWorkoutOperation,
  WorkoutSessionResult,
  WorkoutSessionState,
} from "./workoutSession.types";

export type WorkoutSessionController = {
  state: WorkoutSessionState;
  dismissOperationError: (error: Error) => void;
  startEmptyWorkout: () => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  addExercise: (
    command: AddExerciseCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  removeExercise: (
    command: RemoveExerciseCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  removeSet: (
    command: RemoveSetCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  addSet: (
    command: AddSetCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  updateSet: (
    command: UpdateSetCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  selectSet: (
    command: SelectSetCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
  completeSet: (
    command: CompleteSetCommand,
  ) => Promise<WorkoutSessionResult<WorkoutAggregate>>;
};

type RunActiveWorkoutOperationInput = {
  operation: ActiveWorkoutOperation;
  invalidStateMessage: string;
  failureMessage: string;
  run: (workout: WorkoutAggregate) => Promise<WorkoutAggregate>;
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
  const activeWorkoutRef = useRef<WorkoutAggregate | null>(null);

  useEffect(() => {
    if (isActiveOperationRunningRef.current) {
      return;
    }

    activeWorkoutRef.current = state.status === "active" ? state.workout : null;
  }, [state]);

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

  const runActiveWorkoutOperation = useCallback(
    async ({
      operation,
      invalidStateMessage,
      failureMessage,
      run,
    }: RunActiveWorkoutOperationInput): Promise<
      WorkoutSessionResult<WorkoutAggregate>
    > => {
      const activeWorkout = activeWorkoutRef.current;

      if (state.status !== "active" || activeWorkout === null) {
        return failure(
          new WorkoutSessionError({
            code: "invalidSessionState",
            message: invalidStateMessage,
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
      dispatch({ type: "activeOperationStarted", operation });

      try {
        const workout = await run(activeWorkout);

        activeWorkoutRef.current = workout;
        dispatch({ type: "workoutCommitted", workout });

        return success(workout);
      } catch (error) {
        const sessionError = new WorkoutSessionError({
          code: "operationFailed",
          message: failureMessage,
          cause: toError(error),
        });

        dispatch({
          type: "activeOperationFailed",
          operation,
          error: sessionError,
        });

        return failure(sessionError);
      } finally {
        isActiveOperationRunningRef.current = false;
      }
    },
    [state.status],
  );

  const dismissOperationError = useCallback((error: Error) => {
    dispatch({
      type: "operationErrorDismissed",
      error,
    });
  }, []);

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
    (command: AddExerciseCommand) =>
      runActiveWorkoutOperation({
        operation: {
          type: "addExercise",
          exerciseId: command.exercise.id,
        },
        invalidStateMessage:
          "An exercise cannot be added without an active workout",
        failureMessage: "Failed to add the exercise",
        run: (workout) => actions.addExercise(workout, command),
      }),
    [actions, runActiveWorkoutOperation],
  );

  const removeExercise = useCallback(
    (command: RemoveExerciseCommand) =>
      runActiveWorkoutOperation({
        operation: {
          type: "removeExercise",
          workoutExerciseId: command.workoutExerciseId,
        },
        invalidStateMessage:
          "An exercise cannot be removed without an active workout",
        failureMessage: "Failed to remove the exercise",
        run: (workout) => actions.removeExercise(workout, command),
      }),
    [actions, runActiveWorkoutOperation],
  );

  const removeSet = useCallback(
    (command: RemoveSetCommand) =>
      runActiveWorkoutOperation({
        operation: {
          type: "removeSet",
          workoutSetId: command.workoutSetId,
        },
        invalidStateMessage:
          "A set cannot be removed without an active workout",
        failureMessage: "Failed to remove the set",
        run: (workout) => actions.removeSet(workout, command),
      }),
    [actions, runActiveWorkoutOperation],
  );

  const addSet = useCallback(
    (command: AddSetCommand) =>
      runActiveWorkoutOperation({
        operation: {
          type: "addSet",
          workoutExerciseId: command.workoutExerciseId,
        },
        invalidStateMessage: "A set cannot be added without an active workout",
        failureMessage: "Failed to add the set",
        run: (workout) => actions.addSet(workout, command),
      }),
    [actions, runActiveWorkoutOperation],
  );

  const updateSet = useCallback(
    (command: UpdateSetCommand) =>
      runActiveWorkoutOperation({
        operation: {
          type: "updateSet",
          workoutSetId: command.workoutSetId,
        },
        invalidStateMessage:
          "A set cannot be updated without an active workout",
        failureMessage: "Failed to update the set",
        run: (workout) => actions.updateSet(workout, command),
      }),
    [actions, runActiveWorkoutOperation],
  );

  const selectSet = useCallback(
    (command: SelectSetCommand) =>
      runActiveWorkoutOperation({
        operation: {
          type: "selectSet",
          workoutSetId: command.workoutSetId,
        },
        invalidStateMessage:
          "A set cannot be selected without an active workout",
        failureMessage: "Failed to select the set",
        run: (workout) => actions.selectSet(workout, command),
      }),
    [actions, runActiveWorkoutOperation],
  );

  const completeSet = useCallback(
    (command: CompleteSetCommand) =>
      runActiveWorkoutOperation({
        operation: {
          type: "completeSet",
          workoutSetId: command.workoutSetId,
        },
        invalidStateMessage:
          "A set cannot be completed without an active workout",
        failureMessage: "Failed to complete the set",
        run: (workout) => actions.completeSet(workout, command),
      }),
    [actions, runActiveWorkoutOperation],
  );

  return {
    state,
    startEmptyWorkout,
    addExercise,
    removeExercise,
    removeSet,
    addSet,
    updateSet,
    selectSet,
    completeSet,
    dismissOperationError,
  };
}
