import { createEmptyWorkout } from "@/domain/workout/workout.useCases";

import { workoutSessionReducer } from "../workoutSession.reducer";
import type { WorkoutSessionState } from "../workoutSession.types";

describe("workoutSessionReducer", () => {
  describe("hydration", () => {
    it("moves to noActiveWorkout when hydration finds nothing", () => {
      const state: WorkoutSessionState = {
        status: "loading",
      };

      const nextState = workoutSessionReducer(state, {
        type: "hydrationSucceeded",
        workout: null,
      });

      expect(nextState).toEqual({
        status: "noActiveWorkout",
        operation: {
          status: "idle",
        },
      });
    });
  });

  describe("start operations", () => {
    it("marks a start operation as pending and preserves no workout", () => {
      const state: WorkoutSessionState = {
        status: "noActiveWorkout",
        operation: {
          status: "idle",
        },
      };

      const newState = workoutSessionReducer(state, {
        type: "startOperationStarted",
        operation: "startEmptyWorkout",
      });

      expect(newState).toEqual({
        status: "noActiveWorkout",
        operation: {
          status: "pending",
          operation: "startEmptyWorkout",
        },
      });
    });

    it("ignores a start operation when a workout is already active", () => {
      const workout = createEmptyWorkout({
        id: "workout_1",
        now: 1_000,
      });

      const state: WorkoutSessionState = {
        status: "active",
        workout,
        operation: {
          status: "idle",
        },
      };

      const nextState = workoutSessionReducer(state, {
        type: "startOperationStarted",
        operation: "startEmptyWorkout",
      });

      expect(nextState).toBe(state);
    });

    it("records an operation error and preserves no workout", () => {
      const error = new Error("Failed to start an empty");

      const state: WorkoutSessionState = {
        status: "noActiveWorkout",
        operation: {
          status: "pending",
          operation: "startEmptyWorkout",
        },
      };

      const nextState = workoutSessionReducer(state, {
        type: "startOperationFailed",
        operation: "startEmptyWorkout",
        error,
      });

      expect(nextState).toEqual({
        status: "noActiveWorkout",
        operation: {
          status: "error",
          operation: "startEmptyWorkout",
          error,
        },
      });
    });
  });

  describe("active operations", () => {
    it("marks an active operation as pending and preserves the workout", () => {
      const workout = createEmptyWorkout({
        id: "workout_1",
        now: 1_000,
      });

      const state: WorkoutSessionState = {
        status: "active",
        workout,
        operation: {
          status: "idle",
        },
      };

      const nextState = workoutSessionReducer(state, {
        type: "activeOperationStarted",
        operation: "updateSet",
      });

      expect(nextState).toEqual({
        status: "active",
        workout,
        operation: {
          status: "pending",
          operation: "updateSet",
        },
      });
    });

    it("ignores an active operation when there is not an active workout", () => {
      const state: WorkoutSessionState = {
        status: "noActiveWorkout",
        operation: {
          status: "idle",
        },
      };

      const nextState = workoutSessionReducer(state, {
        type: "activeOperationStarted",
        operation: "updateSet",
      });

      expect(nextState).toBe(state);
    });

    it("records an operation error and preserves the active workout", () => {
      const workout = createEmptyWorkout({
        id: "workout_1",
        now: 1_000,
      });
      const error = new Error("Failed to update set");

      const state: WorkoutSessionState = {
        status: "active",
        workout,
        operation: {
          status: "pending",
          operation: "updateSet",
        },
      };

      const nextState = workoutSessionReducer(state, {
        type: "activeOperationFailed",
        operation: "updateSet",
        error,
      });

      expect(nextState).toEqual({
        status: "active",
        workout,
        operation: {
          status: "error",
          operation: "updateSet",
          error,
        },
      });
    });
  });

  describe("committing", () => {
    it("stores the returned aggregate as the active workout", () => {
      const workout = createEmptyWorkout({
        id: "workout_1",
        now: 1_000,
      });

      const state: WorkoutSessionState = {
        status: "noActiveWorkout",
        operation: {
          status: "pending",
          operation: "startEmptyWorkout",
        },
      };

      const nextState = workoutSessionReducer(state, {
        type: "workoutCommitted",
        workout,
      });

      expect(nextState).toEqual({
        status: "active",
        workout,
        operation: {
          status: "idle",
        },
      });
    });
  });

  describe("clearing", () => {
    it("removes the active aggregate", () => {
      const workout = createEmptyWorkout({
        id: "workout_1",
        now: 1_000,
      });

      const state: WorkoutSessionState = {
        status: "active",
        workout,
        operation: {
          status: "idle",
        },
      };

      const nextState = workoutSessionReducer(state, {
        type: "workoutCleared",
      });

      expect(nextState).toEqual({
        status: "noActiveWorkout",
        operation: { status: "idle" },
      });
    });
  });
});
