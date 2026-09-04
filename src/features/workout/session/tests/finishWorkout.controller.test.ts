import { createElement, type ReactElement } from "react";

import {
  createWorkoutWithAllSetsCompleted,
  createWorkoutWithTwoExercises,
  createWorkoutWithTwoSets,
} from "@/domain/workout/tests/workout.test.helpers";
import type { WorkoutAggregate } from "@/domain/workout/workout.types";
import {
  addWorkoutSet,
  updateWorkoutExerciseOrder,
} from "@/domain/workout/workout.useCases";
import type { WorkoutSessionActions } from "@/features/workout/actions/workoutSessionActions";

import {
  useWorkoutSessionController,
  type WorkoutSessionController,
} from "../useWorkoutSessionController";

type TestRenderer = {
  unmount: () => void;
};

type ReactTestRendererModule = {
  act: (callback: () => void | Promise<void>) => Promise<void>;
  create: (element: ReactElement) => TestRenderer;
};

const { act, create } = jest.requireActual<ReactTestRendererModule>(
  "react-test-renderer",
);

function createActions(
  workout: WorkoutAggregate,
  overrides: Partial<WorkoutSessionActions> = {},
): WorkoutSessionActions {
  return {
    loadActiveWorkout: async () => workout,
    startEmptyWorkout: async () => workout,
    cancelWorkout: async () => undefined,
    finishWorkout: async () => undefined,
    addExercise: async (currentWorkout) => currentWorkout,
    removeExercise: async (currentWorkout) => currentWorkout,
    updateExerciseOrder: async (currentWorkout) => currentWorkout,
    removeSet: async (currentWorkout) => currentWorkout,
    addSet: async (currentWorkout) => currentWorkout,
    copyPreviousSet: async (currentWorkout) => currentWorkout,
    updateSet: async (currentWorkout) => currentWorkout,
    selectSet: async (currentWorkout) => currentWorkout,
    completeSet: async (currentWorkout) => currentWorkout,
    adjustRestTimer: async (currentWorkout) => currentWorkout,
    resetRestTimer: async (currentWorkout) => currentWorkout,
    skipRestTimer: async (currentWorkout) => currentWorkout,
    undoCompletedSet: async (currentWorkout) => currentWorkout,
    ...overrides,
  };
}

async function renderController(actions: WorkoutSessionActions) {
  let controller: WorkoutSessionController | null = null;
  let renderer: TestRenderer | null = null;

  function ControllerHarness() {
    controller = useWorkoutSessionController(actions);
    return null;
  }

  await act(async () => {
    renderer = create(createElement(ControllerHarness));
  });

  return {
    getController(): WorkoutSessionController {
      if (controller === null) {
        throw new Error("Workout session controller was not rendered");
      }

      return controller;
    },
    async unmount() {
      await act(async () => {
        renderer?.unmount();
      });
    },
  };
}

describe("finish workout session controller", () => {
  it("clears the active workout after finishing succeeds", async () => {
    const workout = createWorkoutWithAllSetsCompleted();
    const finishWorkout = jest.fn<
      ReturnType<WorkoutSessionActions["finishWorkout"]>,
      Parameters<WorkoutSessionActions["finishWorkout"]>
    >(() => Promise.resolve());
    const rendered = await renderController(
      createActions(workout, { finishWorkout }),
    );

    await act(async () => {
      await rendered.getController().finishWorkout({
        skipUnfinishedSets: false,
      });
    });

    expect(finishWorkout).toHaveBeenCalledWith(workout, {
      skipUnfinishedSets: false,
    });
    expect(rendered.getController().state).toEqual({
      status: "noActiveWorkout",
      operation: { status: "idle" },
    });

    await rendered.unmount();
  });

  it("preserves the workout after failure and allows a retry", async () => {
    const workout = createWorkoutWithAllSetsCompleted();
    const persistenceError = new Error("Database unavailable");
    const finishWorkout = jest
      .fn<
        ReturnType<WorkoutSessionActions["finishWorkout"]>,
        Parameters<WorkoutSessionActions["finishWorkout"]>
      >()
      .mockRejectedValueOnce(persistenceError)
      .mockResolvedValueOnce(undefined);
    const rendered = await renderController(
      createActions(workout, { finishWorkout }),
    );

    await act(async () => {
      await rendered.getController().finishWorkout({
        skipUnfinishedSets: false,
      });
    });

    expect(rendered.getController().state).toMatchObject({
      status: "active",
      workout,
      operation: {
        status: "error",
        operation: { type: "finishWorkout" },
        error: {
          message: "Failed to finish the workout",
          cause: persistenceError,
        },
      },
    });

    await act(async () => {
      await rendered.getController().finishWorkout({
        skipUnfinishedSets: false,
      });
    });

    expect(finishWorkout).toHaveBeenCalledTimes(2);
    expect(rendered.getController().state).toEqual({
      status: "noActiveWorkout",
      operation: { status: "idle" },
    });

    await rendered.unmount();
  });
});

describe("copy previous set workout session controller", () => {
  it("tracks the operation, forwards the command, and commits the result", async () => {
    const workout = createWorkoutWithTwoSets();
    const copiedWorkout = addWorkoutSet(workout, {
      workoutExerciseId: "workout_exercise_1",
      setId: "set_3",
      now: 4_000,
    });
    let resolveCopy: (workout: WorkoutAggregate) => void = () => undefined;
    const copyPromise = new Promise<WorkoutAggregate>((resolve) => {
      resolveCopy = resolve;
    });
    const copyPreviousSet = jest.fn(() => copyPromise);
    const rendered = await renderController(
      createActions(workout, { copyPreviousSet }),
    );
    const command = { workoutExerciseId: "workout_exercise_1" };
    let operationPromise:
      ReturnType<WorkoutSessionController["copyPreviousSet"]> | undefined;

    await act(async () => {
      operationPromise = rendered.getController().copyPreviousSet(command);
      await Promise.resolve();
    });

    expect(rendered.getController().state).toMatchObject({
      status: "active",
      workout,
      operation: {
        status: "pending",
        operation: {
          type: "copyPreviousSet",
          workoutExerciseId: "workout_exercise_1",
        },
      },
    });

    await act(async () => {
      resolveCopy(copiedWorkout);
      await operationPromise;
    });

    expect(copyPreviousSet).toHaveBeenCalledWith(workout, command);
    expect(rendered.getController().state).toEqual({
      status: "active",
      workout: copiedWorkout,
      operation: { status: "idle" },
    });

    await rendered.unmount();
  });
});

describe("update exercise order workout session controller", () => {
  it("tracks the move, forwards it, and commits the reordered workout", async () => {
    const workout = createWorkoutWithTwoExercises();
    const reorderedWorkout = updateWorkoutExerciseOrder(workout, {
      workoutExerciseId: "workout_exercise_2",
      orderIndex: 0,
      now: 4_000,
    });
    let resolveUpdate: (workout: WorkoutAggregate) => void = () => undefined;
    const updatePromise = new Promise<WorkoutAggregate>((resolve) => {
      resolveUpdate = resolve;
    });
    const updateExerciseOrder = jest.fn(() => updatePromise);
    const rendered = await renderController(
      createActions(workout, { updateExerciseOrder }),
    );
    const command = {
      workoutExerciseId: "workout_exercise_2",
      orderIndex: 0,
    };
    let operationPromise:
      ReturnType<WorkoutSessionController["updateExerciseOrder"]> | undefined;

    await act(async () => {
      operationPromise = rendered.getController().updateExerciseOrder(command);
      await Promise.resolve();
    });

    expect(rendered.getController().state).toMatchObject({
      status: "active",
      workout,
      operation: {
        status: "pending",
        operation: {
          type: "updateExerciseOrder",
          workoutExerciseId: "workout_exercise_2",
          orderIndex: 0,
        },
      },
    });

    await act(async () => {
      resolveUpdate(reorderedWorkout);
      await operationPromise;
    });

    expect(updateExerciseOrder).toHaveBeenCalledWith(workout, command);
    expect(rendered.getController().state).toEqual({
      status: "active",
      workout: reorderedWorkout,
      operation: { status: "idle" },
    });

    await rendered.unmount();
  });
});
