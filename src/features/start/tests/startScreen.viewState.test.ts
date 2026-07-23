import { createEmptyWorkout } from "@/domain/workout/workout.useCases";
import type { WorkoutSessionState } from "@/features/workout/session/workoutSession.types";

import { getStartScreenViewState } from "../view/startScreen.viewState";

describe("getStartScreenViewState", () => {
  it("maps session hydration to the blocking loading view", () => {
    expect(getStartScreenViewState({ status: "loading" })).toEqual({
      view: "loading",
    });
  });

  it("maps a hydration failure to the blocking load error view", () => {
    const error = new Error("Database unavailable");

    expect(getStartScreenViewState({ status: "loadError", error })).toEqual({
      view: "loadError",
      error,
    });
  });

  it("keeps the no-active-workout view visible while quick start is pending", () => {
    const state: WorkoutSessionState = {
      status: "noActiveWorkout",
      operation: {
        status: "pending",
        operation: "startEmptyWorkout",
      },
    };

    expect(getStartScreenViewState(state)).toEqual({
      view: "noActiveWorkout",
      startEmptyWorkout: { status: "starting" },
    });
  });

  it("keeps the no-active-workout view visible and exposes a quick start error", () => {
    const error = new Error("Could not save workout");
    const state: WorkoutSessionState = {
      status: "noActiveWorkout",
      operation: {
        status: "error",
        operation: "startEmptyWorkout",
        error,
      },
    };

    expect(getStartScreenViewState(state)).toEqual({
      view: "noActiveWorkout",
      startEmptyWorkout: { status: "error", error },
    });
  });

  it("maps an active session to the active workout view", () => {
    const workout = createEmptyWorkout({ id: "workout_1", now: 1_000 });

    expect(
      getStartScreenViewState({
        status: "active",
        workout,
        operation: { status: "idle" },
      }),
    ).toEqual({ view: "activeWorkout", workout });
  });
});
