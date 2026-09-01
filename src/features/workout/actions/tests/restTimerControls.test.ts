import { createWorkoutWithCompletedFirstSet } from "@/domain/workout/tests/workout.test.helpers";
import { startWorkoutRestTimer } from "@/domain/workout/workout.useCases";

import {
  adjustRestTimer,
  type AdjustRestTimerDependencies,
} from "../adjustRestTimer";
import {
  resetRestTimer,
  type ResetRestTimerDependencies,
} from "../resetRestTimer";
import {
  skipRestTimer,
  type SkipRestTimerDependencies,
} from "../skipRestTimer";

type RestTimerDependencies = AdjustRestTimerDependencies &
  ResetRestTimerDependencies &
  SkipRestTimerDependencies;

function createDependencies(now = 7_000): RestTimerDependencies {
  return {
    repository: {
      updateWorkoutAggregate: jest.fn().mockResolvedValue(undefined),
    },
    now: jest.fn(() => now),
  };
}

function createWorkoutWithRunningTimer() {
  return startWorkoutRestTimer(createWorkoutWithCompletedFirstSet(), {
    setId: "set_1",
    now: 6_000,
  });
}

describe("adjustRestTimer", () => {
  it("adjusts the timer using one timestamp and persists once", async () => {
    const dependencies = createDependencies();
    const workout = createWorkoutWithRunningTimer();

    const nextWorkout = await adjustRestTimer(dependencies, workout, {
      seconds: 15,
    });

    expect(nextWorkout.workout.restTimer?.endsAt).toBe(201_000);
    expect(dependencies.now).toHaveBeenCalledTimes(1);
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).toHaveBeenCalledTimes(1);
    expect(dependencies.repository.updateWorkoutAggregate).toHaveBeenCalledWith(
      workout,
      nextWorkout,
    );
  });

  it("skips rest and persists once when subtraction reaches zero", async () => {
    const dependencies = createDependencies(180_000);

    const nextWorkout = await adjustRestTimer(
      dependencies,
      createWorkoutWithRunningTimer(),
      { seconds: -15 },
    );

    expect(nextWorkout.workout.restTimer).toBeNull();
    expect(nextWorkout.workout.activeSetId).toBe("set_2");
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).toHaveBeenCalledTimes(1);
  });

  it("persists an expired-timer adjustment as one combined skip", async () => {
    const dependencies = createDependencies(200_000);

    const nextWorkout = await adjustRestTimer(
      dependencies,
      createWorkoutWithRunningTimer(),
      { seconds: 15 },
    );

    expect(nextWorkout.workout.restTimer).toBeNull();
    expect(nextWorkout.workout.activeSetId).toBe("set_2");
    expect(dependencies.now).toHaveBeenCalledTimes(1);
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).toHaveBeenCalledTimes(1);
  });

  it("does not persist when the timer has already been cleared", async () => {
    const sourceWorkout = createWorkoutWithCompletedFirstSet();
    const dependencies = createDependencies();

    const nextWorkout = await adjustRestTimer(dependencies, sourceWorkout, {
      seconds: 15,
    });

    expect(nextWorkout).toBe(sourceWorkout);
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).not.toHaveBeenCalled();
  });

  it("rejects without changing source state when persistence fails", async () => {
    const sourceWorkout = createWorkoutWithRunningTimer();
    const dependencies = createDependencies();
    const error = new Error("Database unavailable");

    jest
      .mocked(dependencies.repository.updateWorkoutAggregate)
      .mockRejectedValueOnce(error);

    await expect(
      adjustRestTimer(dependencies, sourceWorkout, { seconds: 15 }),
    ).rejects.toBe(error);
    expect(sourceWorkout.workout.restTimer?.endsAt).toBe(186_000);
  });
});

describe("resetRestTimer", () => {
  it("restarts the configured duration and persists once", async () => {
    const dependencies = createDependencies(8_000);

    const nextWorkout = await resetRestTimer(
      dependencies,
      createWorkoutWithRunningTimer(),
    );

    expect(nextWorkout.workout.restTimer).toEqual({
      sourceSetId: "set_1",
      startedAt: 8_000,
      endsAt: 188_000,
    });
    expect(dependencies.now).toHaveBeenCalledTimes(1);
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).toHaveBeenCalledTimes(1);
  });

  it("persists an expired-timer reset as one combined skip", async () => {
    const dependencies = createDependencies(200_000);

    const nextWorkout = await resetRestTimer(
      dependencies,
      createWorkoutWithRunningTimer(),
    );

    expect(nextWorkout.workout.restTimer).toBeNull();
    expect(nextWorkout.workout.activeSetId).toBe("set_2");
    expect(dependencies.now).toHaveBeenCalledTimes(1);
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).toHaveBeenCalledTimes(1);
  });

  it("does not persist when the timer has already been cleared", async () => {
    const sourceWorkout = createWorkoutWithCompletedFirstSet();
    const dependencies = createDependencies();

    const nextWorkout = await resetRestTimer(dependencies, sourceWorkout);

    expect(nextWorkout).toBe(sourceWorkout);
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).not.toHaveBeenCalled();
  });

  it("rejects without changing source state when persistence fails", async () => {
    const sourceWorkout = createWorkoutWithRunningTimer();
    const dependencies = createDependencies();
    const error = new Error("Database unavailable");

    jest
      .mocked(dependencies.repository.updateWorkoutAggregate)
      .mockRejectedValueOnce(error);

    await expect(resetRestTimer(dependencies, sourceWorkout)).rejects.toBe(
      error,
    );
    expect(sourceWorkout.workout.restTimer?.startedAt).toBe(6_000);
  });
});

describe("skipRestTimer", () => {
  it("clears rest, selects the next set, and persists once", async () => {
    const dependencies = createDependencies();

    const nextWorkout = await skipRestTimer(
      dependencies,
      createWorkoutWithRunningTimer(),
    );

    expect(nextWorkout.workout.restTimer).toBeNull();
    expect(nextWorkout.workout.activeSetId).toBe("set_2");
    expect(dependencies.now).toHaveBeenCalledTimes(1);
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).toHaveBeenCalledTimes(1);
  });

  it("does not persist when the timer has already been cleared", async () => {
    const sourceWorkout = createWorkoutWithCompletedFirstSet();
    const dependencies = createDependencies();

    const nextWorkout = await skipRestTimer(dependencies, sourceWorkout);

    expect(nextWorkout).toBe(sourceWorkout);
    expect(
      dependencies.repository.updateWorkoutAggregate,
    ).not.toHaveBeenCalled();
  });

  it("rejects without changing source state when persistence fails", async () => {
    const sourceWorkout = createWorkoutWithRunningTimer();
    const dependencies = createDependencies();
    const error = new Error("Database unavailable");

    jest
      .mocked(dependencies.repository.updateWorkoutAggregate)
      .mockRejectedValueOnce(error);

    await expect(skipRestTimer(dependencies, sourceWorkout)).rejects.toBe(
      error,
    );
    expect(sourceWorkout.workout.restTimer).toEqual({
      sourceSetId: "set_1",
      startedAt: 6_000,
      endsAt: 186_000,
    });
    expect(sourceWorkout.workout.activeSetId).toBe("set_2");
  });
});
