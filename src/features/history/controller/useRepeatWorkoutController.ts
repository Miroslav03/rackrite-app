import { useCallback, useEffect, useRef, useState } from "react";

import type { WorkoutId } from "@/domain/workout/workout.types";

import type { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";
import { getPendingRepeatWorkoutId } from "@/features/workout/session/workoutSession.selectors";

import { useToast } from "@/shared/components/feedback/ToastContext";

import type { RepeatWorkoutCommand } from "../actions/repeatWorkout";

export type HistoryOverlay =
  | { type: "none" }
  | {
      type: "dangerModal";
      confirmation: RepeatWorkoutCommand & { action: "repeatWorkout" };
    };

export function useRepeatWorkoutController(
  session: Pick<
    WorkoutSessionController,
    "state" | "repeatWorkout" | "dismissOperationError"
  >,
  onStarted: () => void,
  isFocused: boolean,
) {
  const [overlay, setOverlay] = useState<HistoryOverlay>({ type: "none" });

  const runningRef = useRef(false);
  const activeRef = useRef(isFocused);

  const { showToast } = useToast();
  const { state, repeatWorkout, dismissOperationError } = session;

  const pendingWorkoutId =
    state.status === "active" || state.status === "noActiveWorkout"
      ? getPendingRepeatWorkoutId(state.operation)
      : null;

  const disabled =
    (state.status !== "active" && state.status !== "noActiveWorkout") ||
    state.operation.status === "pending";

  useEffect(() => {
    activeRef.current = isFocused;
    if (!isFocused) setOverlay({ type: "none" });

    return () => {
      activeRef.current = false;
    };
  }, [isFocused]);

  const run = useCallback(
    async (command: RepeatWorkoutCommand) => {
      if (runningRef.current || disabled) return;

      runningRef.current = true;

      try {
        const result = await repeatWorkout(command);

        if (!activeRef.current) return;

        if (result.success) {
          setOverlay({ type: "none" });
          onStarted();
        } else if (result.error.code === "invalidSessionState") {
          setOverlay({ type: "none" });
        }
      } finally {
        runningRef.current = false;
      }
    },
    [disabled, repeatWorkout, onStarted, showToast, dismissOperationError],
  );

  const requestRepeat = useCallback(
    (sourceWorkoutId: WorkoutId) => {
      if (disabled || runningRef.current) return;

      switch (state.status) {
        case "active":
          setOverlay({
            type: "dangerModal",
            confirmation: {
              action: "repeatWorkout",
              sourceWorkoutId,
              expectedActiveWorkoutId: state.workout.workout.id,
            },
          });
          return;
        case "noActiveWorkout":
          void run({ sourceWorkoutId, expectedActiveWorkoutId: null });
          return;
      }
    },
    [disabled, state, run],
  );

  function confirm() {
    switch (overlay.type) {
      case "none":
        return;
      case "dangerModal":
        switch (overlay.confirmation.action) {
          case "repeatWorkout":
            void run(overlay.confirmation);
            return;
        }
    }
  }

  function close() {
    if (!runningRef.current && pendingWorkoutId === null)
      setOverlay({ type: "none" });
  }

  return {
    overlay,
    pendingWorkoutId,
    disabled,
    requestRepeat,
    confirm,
    close,
  };
}
