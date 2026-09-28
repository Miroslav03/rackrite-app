import { useCallback, useEffect, useRef, useState } from "react";

import type { TemplateId } from "@/domain/templates/editor/templates.types";

import type { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";
import { getPendingStartTemplateId } from "@/features/workout/session/workoutSession.selectors";

import type { StartWorkoutFromTemplateCommand } from "@/features/workout/actions/startWorkoutFromTemplate";

export type TemplateDetailsOverlay =
  | { type: "none" }
  | {
      type: "dangerModal";
      confirmation: StartWorkoutFromTemplateCommand & {
        action: "startWorkoutFromTemplate";
      };
    };

export function useStartTemplateWorkoutController(
  session: Pick<WorkoutSessionController, "state" | "startWorkoutFromTemplate">,
  onStarted: () => void,
  isFocused: boolean,
) {
  const [overlay, setOverlay] = useState<TemplateDetailsOverlay>({
    type: "none",
  });

  const runningRef = useRef(false);
  const activeRef = useRef(isFocused);

  const { state, startWorkoutFromTemplate } = session;

  const pendingTemplateId =
    state.status === "active" || state.status === "noActiveWorkout"
      ? getPendingStartTemplateId(state.operation)
      : null;

  const disabled =
    !isFocused ||
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
    async (command: StartWorkoutFromTemplateCommand) => {
      if (!activeRef.current || runningRef.current || disabled) return;

      runningRef.current = true;

      try {
        const result = await startWorkoutFromTemplate(command);

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
    [disabled, startWorkoutFromTemplate, onStarted],
  );

  const requestStart = useCallback(
    (templateId: TemplateId) => {
      if (disabled || runningRef.current) return;

      switch (state.status) {
        case "active":
          setOverlay({
            type: "dangerModal",
            confirmation: {
              action: "startWorkoutFromTemplate",
              templateId,
              expectedActiveWorkoutId: state.workout.workout.id,
            },
          });
          return;
        case "noActiveWorkout":
          void run({ templateId, expectedActiveWorkoutId: null });
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
          case "startWorkoutFromTemplate":
            void run(overlay.confirmation);
            return;
        }
    }
  }

  function close() {
    if (!runningRef.current && pendingTemplateId === null)
      setOverlay({ type: "none" });
  }

  return {
    overlay,
    pendingTemplateId,
    disabled,
    requestStart,
    confirm,
    close,
  };
}
