import { createElement, type ReactElement } from "react";

import {
  createWorkoutWithAllSetsCompleted,
  createCompletedWorkoutWithMixedSets,
  createWorkoutWithTwoExercises,
  createWorkoutWithTwoSets,
} from "@/domain/workout/tests/workout.test.helpers";
import type { WorkoutAggregate } from "@/domain/workout/workout.types";
import {
  addWorkoutSet,
  createRepeatedWorkout,
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
    repeatWorkout: async () => workout,
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

function repeatedWorkout() {
  let id = 0;
  return createRepeatedWorkout(createCompletedWorkoutWithMixedSets(), {
    id: "repeated",
    now: 200000,
    createWorkoutExerciseId: () => `exercise_${++id}`,
    createWorkoutSetId: () => `set_${++id}`,
  });
}

describe("repeat workout session controller", () => {
  it("commits a new session and rejects callbacks retained from the discarded workout", async () => {
    const old = createWorkoutWithTwoSets();
    const next = repeatedWorkout();
    const actions = createActions(old, {
      repeatWorkout: jest.fn(async () => next),
      cancelWorkout: jest.fn(async () => undefined),
    });
    const rendered = await renderController(actions);
    const staleCancel = rendered.getController().cancelWorkout;
    const staleUpdate = rendered.getController().updateSet;
    await act(async () => {
      expect(
        (
          await rendered
            .getController()
            .repeatWorkout({
              sourceWorkoutId: "source",
              expectedActiveWorkoutId: old.workout.id,
            })
        ).success,
      ).toBe(true);
    });
    expect(rendered.getController().state).toMatchObject({
      status: "active",
      workout: next,
      operation: { status: "idle" },
    });
    await act(async () => {
      expect((await staleCancel()).success).toBe(false);
      expect(
        (
          await staleUpdate({
            workoutSetId: "set_1",
            values: { weight: 999 },
          })
        ).success,
      ).toBe(false);
    });
    expect(actions.cancelWorkout).not.toHaveBeenCalled();
    expect(rendered.getController().state).toMatchObject({
      workout: next,
    });
    await rendered.unmount();
  });

  it.each([true, false])(
    "prevents duplicate repeat and concurrent writes (active=%s)",
    async (active) => {
      const old = createWorkoutWithTwoSets();
      const next = repeatedWorkout();
      let resolve: (workout: WorkoutAggregate) => void = () => undefined;
      const promise = new Promise<WorkoutAggregate>((done) => {
        resolve = done;
      });
      const repeatWorkout = jest.fn(() => promise);
      const rendered = await renderController(
        createActions(old, {
          loadActiveWorkout: async () => (active ? old : null),
          repeatWorkout,
        }),
      );
      const command = {
        sourceWorkoutId: "source",
        expectedActiveWorkoutId: active ? old.workout.id : null,
      };
      let pending:
        ReturnType<WorkoutSessionController["repeatWorkout"]> | undefined;
      await act(async () => {
        const controller = rendered.getController();
        pending = controller.repeatWorkout(command);
        expect((await controller.repeatWorkout(command)).success).toBe(
          false,
        );
        expect((await controller.startEmptyWorkout()).success).toBe(false);
        if (active)
          expect(
            (
              await controller.updateSet({
                workoutSetId: "set_1",
                values: { weight: 999 },
              })
            ).success,
          ).toBe(false);
      });
      expect(repeatWorkout).toHaveBeenCalledTimes(1);
      expect(rendered.getController().state).toMatchObject({
        operation: {
          status: "pending",
          operation: { type: "repeatWorkout", sourceWorkoutId: "source" },
        },
      });
      await act(async () => {
        resolve(next);
        await pending;
      });
      expect(rendered.getController().state).toMatchObject({
        status: "active",
        workout: next,
      });
      await rendered.unmount();
    },
  );

  it("preserves the active session on failure, retries, and rejects stale confirmation", async () => {
    const old = createWorkoutWithTwoSets();
    const next = repeatedWorkout();
    const repeatWorkout = jest
      .fn<Promise<WorkoutAggregate>, []>()
      .mockRejectedValueOnce(new Error("Disk full"))
      .mockResolvedValueOnce(next);
    const rendered = await renderController(
      createActions(old, { repeatWorkout }),
    );
    const command = {
      sourceWorkoutId: "source",
      expectedActiveWorkoutId: old.workout.id,
    };
    await act(async () => {
      await rendered.getController().repeatWorkout(command);
    });
    expect(rendered.getController().state).toMatchObject({
      status: "active",
      workout: old,
      operation: { status: "error" },
    });
    await act(async () => {
      await rendered.getController().repeatWorkout(command);
    });
    await act(async () => {
      expect(
        (await rendered.getController().repeatWorkout(command)).success,
      ).toBe(false);
    });
    expect(repeatWorkout).toHaveBeenCalledTimes(2);
    expect(rendered.getController().state).toMatchObject({
      workout: next,
    });
    await rendered.unmount();
  });

  it("does not repeat while an existing workout mutation is in flight", async () => {
    const old = createWorkoutWithTwoSets();
    let resolve: (workout: WorkoutAggregate) => void = () => undefined;
    const updatePromise = new Promise<WorkoutAggregate>((done) => {
      resolve = done;
    });
    const repeatWorkout = jest.fn(async () => repeatedWorkout());
    const rendered = await renderController(
      createActions(old, {
        updateSet: () => updatePromise,
        repeatWorkout,
      }),
    );
    let pending:
      ReturnType<WorkoutSessionController["updateSet"]> | undefined;
    await act(async () => {
      pending = rendered
        .getController()
        .updateSet({ workoutSetId: "set_1", values: { weight: 99 } });
      expect(
        (
          await rendered
            .getController()
            .repeatWorkout({
              sourceWorkoutId: "source",
              expectedActiveWorkoutId: old.workout.id,
            })
        ).success,
      ).toBe(false);
    });
    expect(repeatWorkout).not.toHaveBeenCalled();
    await act(async () => {
      resolve(old);
      await pending;
    });
    await rendered.unmount();
  });
});
