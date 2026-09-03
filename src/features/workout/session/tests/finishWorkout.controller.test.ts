import { createElement, type ReactElement } from "react";

import { createWorkoutWithAllSetsCompleted } from "@/domain/workout/tests/workout.test.helpers";
import type { WorkoutAggregate } from "@/domain/workout/workout.types";
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
  finishWorkout: WorkoutSessionActions["finishWorkout"],
): WorkoutSessionActions {
  return {
    loadActiveWorkout: async () => workout,
    startEmptyWorkout: async () => workout,
    cancelWorkout: async () => undefined,
    finishWorkout,
    addExercise: async (currentWorkout) => currentWorkout,
    removeExercise: async (currentWorkout) => currentWorkout,
    removeSet: async (currentWorkout) => currentWorkout,
    addSet: async (currentWorkout) => currentWorkout,
    updateSet: async (currentWorkout) => currentWorkout,
    selectSet: async (currentWorkout) => currentWorkout,
    completeSet: async (currentWorkout) => currentWorkout,
    adjustRestTimer: async (currentWorkout) => currentWorkout,
    resetRestTimer: async (currentWorkout) => currentWorkout,
    skipRestTimer: async (currentWorkout) => currentWorkout,
    undoCompletedSet: async (currentWorkout) => currentWorkout,
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
      createActions(workout, finishWorkout),
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
      createActions(workout, finishWorkout),
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
